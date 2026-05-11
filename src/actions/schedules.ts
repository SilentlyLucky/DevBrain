'use server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const toISO = z.string().min(1).transform(s => new Date(s).toISOString())

const ScheduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  start_time: toISO,
  end_time: toISO,
  document_ids: z.array(z.string().uuid()).default([]),
  reminder_minutes: z.coerce.number().int().min(1).max(10080).optional(),
})

export async function createSchedule(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const parsed = ScheduleSchema.parse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    document_ids: formData.getAll('document_ids').filter(Boolean),
    reminder_minutes: formData.get('reminder_minutes') || undefined,
  })

  const { error } = await supabase.from('schedules').insert({ ...parsed, user_id: user.id, status: 'Upcoming' })
  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
}

export async function updateSchedule(id: string, data: {
  title: string
  description?: string | null
  start_time: string
  end_time: string
  status?: 'Upcoming' | 'Completed' | 'Missed'
  reminder_minutes?: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  
  const updatePayload: any = {
    title: data.title,
    description: data.description ?? null,
    start_time: data.start_time,
    end_time: data.end_time,
    reminder_minutes: data.reminder_minutes ?? null,
  }

  if (data.status) {
    updatePayload.status = data.status
  }

  const { error } = await supabase
    .from('schedules')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/schedule')
  revalidatePath('/tasks')
}

export async function updateScheduleStatus(id: string, status: 'Upcoming' | 'Completed' | 'Missed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('schedules').update({ status }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/schedule')
}

export async function updateScheduleGcalId(id: string, gcal_event_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  await supabase.from('schedules').update({ gcal_event_id }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/schedule')
}

export async function deleteSchedule(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: schedule } = await supabase
    .from('schedules')
    .select('gcal_event_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (schedule?.gcal_event_id) {
    const { data: { session } } = await supabase.auth.getSession()
    const providerToken = session?.provider_token
    if (providerToken) {
      try {
        const { google: gapis } = await import('googleapis')
        const auth = new gapis.auth.OAuth2()
        auth.setCredentials({ access_token: providerToken })
        const cal = gapis.calendar({ version: 'v3', auth })
        await cal.events.delete({ calendarId: 'primary', eventId: schedule.gcal_event_id })
      } catch {
      }
    }
  }

  await supabase.from('schedules').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/schedule')
}

export async function importSchedulesFromGcal(
  events: Array<{ title: string; start: string; end: string; gcal_event_id: string }>
): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: existing } = await supabase
    .from('schedules')
    .select('gcal_event_id')
    .eq('user_id', user.id)
    .not('gcal_event_id', 'is', null)

  const existingIds = new Set(existing?.map(s => s.gcal_event_id) ?? [])
  const newEvents = events.filter(e => !existingIds.has(e.gcal_event_id))

  if (newEvents.length === 0) return 0

  await supabase.from('schedules').insert(
    newEvents.map(e => ({
      user_id: user.id,
      title: e.title,
      start_time: e.start,
      end_time: e.end,
      status: 'Upcoming' as const,
      gcal_event_id: e.gcal_event_id,
    }))
  )

  revalidatePath('/schedule')
  return newEvents.length
}
