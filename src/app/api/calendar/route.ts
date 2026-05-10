import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

function makeGoogleAuth(providerToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: providerToken })
  return google.calendar({ version: 'v3', auth })
}

function extractMessage(err: unknown): string {
  return typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message)
    : String(err)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, start_time, end_time, provider_token: bodyToken } = await req.json()

  const providerToken = session.provider_token ?? bodyToken
  if (!providerToken) {
    return Response.json(
      { error: 'No Google token. Please sign out and sign in again with Google.' },
      { status: 400 }
    )
  }

  const calendar = makeGoogleAuth(providerToken)

  try {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        start: { dateTime: start_time },
        end: { dateTime: end_time },
      },
    })
    return Response.json({ gcal_event_id: event.data.id })
  } catch (err: unknown) {
    const message = extractMessage(err)
    console.error('[calendar POST]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { gcal_event_id, provider_token: bodyToken } = await req.json()

  const providerToken = session.provider_token ?? bodyToken
  if (!providerToken) {
    return Response.json(
      { error: 'No Google token. Please sign out and sign in again with Google.' },
      { status: 400 }
    )
  }

  const calendar = makeGoogleAuth(providerToken)

  try {
    await calendar.events.delete({ calendarId: 'primary', eventId: gcal_event_id })
    return Response.json({ success: true })
  } catch (err: unknown) {
    const message = extractMessage(err)
    console.error('[calendar DELETE]', message)
    if (message.includes('404') || message.toLowerCase().includes('not found')) {
      return Response.json({ success: true })
    }
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const bodyToken = req.nextUrl.searchParams.get('provider_token')
  const providerToken = session.provider_token ?? bodyToken
  if (!providerToken) {
    return Response.json(
      { error: 'No Google token. Please sign out and sign in again with Google.' },
      { status: 400 }
    )
  }

  const calendar = makeGoogleAuth(providerToken)

  try {
    const now = new Date()
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysOut.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    })

    const events = (response.data.items ?? [])
      .filter(e => e.start?.dateTime && e.end?.dateTime && e.id)
      .map(e => ({
        title: e.summary ?? 'Untitled',
        start: e.start!.dateTime!,
        end: e.end!.dateTime!,
        gcal_event_id: e.id!,
      }))

    return Response.json({ events })
  } catch (err: unknown) {
    const message = extractMessage(err)
    console.error('[calendar GET]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
