import { convertToModelMessages, streamText, UIMessage, tool, stepCountIs } from 'ai'
import { revalidatePath } from 'next/cache'
import { devbrainModel, SYSTEM_PROMPT } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'
import { getDocuments, getDocumentById, getSchedules, retrieveRelevantChunks } from '@/lib/dal'
import { deleteDocument } from '@/actions/documents'
import { z } from 'zod'

export const runtime = 'nodejs'

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit')
    )
  }
  return false
}

function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  if (messages.length === 0) return []

  const sanitized: UIMessage[] = []

  for (const m of messages) {
    if (m.role === 'system') continue

    const last = sanitized[sanitized.length - 1]
    if (last && last.role === m.role) {
      last.parts = [...last.parts, ...m.parts]
      continue
    }

    sanitized.push({ ...m })
  }

  while (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.shift()
  }

  return sanitized
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { messages }: { messages: UIMessage[] } = await req.json()
    const sanitizedMessages = sanitizeMessages(messages)
    const recentMessages = sanitizedMessages.slice(-20)

    const result = streamText({
      model: devbrainModel,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(recentMessages),
      stopWhen: stepCountIs(8),
      tools: {
        retrieveContext: tool({
          description:
            'Search the knowledge base using semantic + keyword search. ' +
            'Use for ANY question about documents, notes, PDFs, reference material, or when the user wants to FIND which documents contain a topic. ' +
            'Results are grouped by document so you can see ALL matching documents, not just top excerpts. ' +
            'ALWAYS call this first - do not answer from memory.',
          inputSchema: z.object({
            query: z.string().describe('Specific question or topic to search for in the knowledge base'),
          }),
          execute: async ({ query }) => {
            let chunks
            try {
              chunks = await retrieveRelevantChunks(query)
            } catch {
              return {
                message: 'Knowledge base search is temporarily unavailable. Please try again in a moment.',
              }
            }
            if (chunks.length === 0) {
              return {
                message:
                  'No relevant content was found. You may not have uploaded any documents yet, ' +
                  'or they were uploaded before semantic search was enabled - re-upload to index them.',
              }
            }

            const byDoc = new Map<string, { excerpts: string[]; score: number }>()
            for (const c of chunks) {
              if (!byDoc.has(c.document_title)) {
                byDoc.set(c.document_title, { excerpts: [], score: c.rrf_score })
              }
              const entry = byDoc.get(c.document_title)!
              if (entry.excerpts.length < 2) entry.excerpts.push(c.content)
            }

            return {
              documents_found: Array.from(byDoc.entries()).map(([title, { excerpts, score }]) => ({
                document: title,
                relevance_score: score.toFixed(4),
                excerpts,
              })),
              total_documents_matched: byDoc.size,
            }
          },
        }),

        listDocuments: tool({
          description: "List all documents in the user's knowledge base with their IDs and types.",
          inputSchema: z.object({}),
          execute: async () => {
            const docs = await getDocuments()
            if (docs.length === 0) return { message: 'Knowledge base is empty.' }
            return { documents: docs.map(d => ({ id: d.id, title: d.title, type: d.source_type })) }
          },
        }),

        listSchedules: tool({
          description:
            "Get the user's daily schedules - upcoming, completed, and missed sessions. " +
            'Call this when the user asks about their schedule, next task, or daily plan. ' +
            'NOTE: "Overdue" is not a real database status. A schedule is overdue when its status is "Upcoming" but start_time is in the past. ' +
            'To fix an overdue schedule, update its startTime and endTime to a future date using updateSchedule.',
          inputSchema: z.object({}),
          execute: async () => {
            const schedules = await getSchedules()
            if (schedules.length === 0) return { message: 'No schedules found.' }
            const now = new Date()
            return {
              schedules: schedules.map(s => ({
                id: s.id,
                title: s.title,
                start_time: s.start_time,
                end_time: s.end_time,
                status: s.status,
                is_overdue: s.status === 'Upcoming' && new Date(s.start_time) < now,
                description: s.description ?? null,
                document_id: s.document_id,
              })),
            }
          },
        }),

        getDocumentContent: tool({
          description:
            'Get the full extracted text of a specific document. Use listDocuments first to get the ID. ' +
            'Prefer retrieveContext for Q&A - use this only when the user explicitly asks to read a full document.',
          inputSchema: z.object({
            documentId: z.string().describe('The document ID from listDocuments'),
          }),
          execute: async ({ documentId }) => {
            const doc = await getDocumentById(documentId)
            if (!doc) return { error: 'Document not found. Use listDocuments to get valid IDs.' }
            return { title: doc.title, type: doc.source_type, content: doc.content }
          },
        }),

        deleteDocument: tool({
          description: 'Delete a document from the knowledge base. Call listDocuments first to get the correct ID.',
          inputSchema: z.object({
            id: z.string().uuid().describe('The UUID of the document to delete'),
          }),
          execute: async ({ id }) => {
            const { data: doc } = await supabase
              .from('documents')
              .select('title')
              .eq('id', id)
              .eq('user_id', user.id)
              .single()

            if (!doc) return { success: false, error: 'Document not found.' }

            await deleteDocument(id)
            return { success: true, message: `Document "${doc.title}" was deleted.` }
          },
        }),

        createSchedule: tool({
          description: "Create a task or event in the user's schedule.",
          inputSchema: z.object({
            title: z.string().describe('Title of the task or event (required)'),
            startTime: z.string().describe('Start time in ISO 8601 UTC, e.g. "2026-05-07T14:00:00Z"'),
            endTime: z.string().describe('End time in ISO 8601 UTC, e.g. "2026-05-07T15:30:00Z"'),
            description: z.string().optional().describe('Optional notes or details about the session'),
            category: z.string().optional().describe('Category name, e.g. "Work", "Personal", "Life"'),
            documentIds: z.array(z.string().uuid()).optional().describe('UUIDs of documents from listDocuments to link to this schedule (can be multiple)'),
            reminderMinutes: z.number().int().min(1).max(10080).optional()
              .describe('Minutes before start_time to fire a reminder notification. Omit for no reminder. Convert natural language: "30 menit"→30, "1 jam"→60, "3 jam"→180, "1 hari"→1440'),
            addToGoogleCalendar: z.boolean().optional().describe('If true, also create the event in Google Calendar'),
          }),
          execute: async ({ title, startTime, endTime, description, category, documentIds, reminderMinutes, addToGoogleCalendar }) => {
            let fullDescription: string | undefined
            if (category && description) fullDescription = `[${category}] ${description}`
            else if (category) fullDescription = `[${category}]`
            else if (description) fullDescription = description

            const { data: newSchedule, error } = await supabase
              .from('schedules')
              .insert({ user_id: user.id, title, start_time: startTime, end_time: endTime, status: 'Upcoming', description: fullDescription, document_ids: documentIds ?? [], reminder_minutes: reminderMinutes ?? null })
              .select('id')
              .single()

            if (error) return { success: false, error: error.message }
            revalidatePath('/schedule')

            if (addToGoogleCalendar && newSchedule) {
              const { data: { session } } = await supabase.auth.getSession()
              const providerToken = session?.provider_token
              if (!providerToken) {
                return { success: true, gcal: false, message: `Schedule "${title}" was created. Google Calendar is not available - connect your Google account in Settings first.` }
              }
              try {
                const { google: gapis } = await import('googleapis')
                const auth = new gapis.auth.OAuth2()
                auth.setCredentials({ access_token: providerToken })
                const cal = gapis.calendar({ version: 'v3', auth })
                const event = await cal.events.insert({
                  calendarId: 'primary',
                  requestBody: { summary: title, start: { dateTime: startTime }, end: { dateTime: endTime } },
                })
                if (event.data.id) {
                  await supabase.from('schedules').update({ gcal_event_id: event.data.id }).eq('id', newSchedule.id)
                }
                return { success: true, gcal: true, message: `Schedule "${title}" was created and added to Google Calendar.` }
              } catch {
                return { success: true, gcal: false, message: `Schedule "${title}" was created. Google Calendar sync failed - try manual sync from the Schedule menu.` }
              }
            }

            return { success: true, message: `Schedule "${title}" was created.` }
          },
        }),

        updateSchedule: tool({
          description: "Update an existing schedule entry. Call listSchedules first to get the correct ID.",
          inputSchema: z.object({
            id: z.string().uuid().describe('The UUID of the schedule to update'),
            title: z.string().optional().describe('New title'),
            startTime: z.string().optional().describe('New start time in ISO 8601 UTC'),
            endTime: z.string().optional().describe('New end time in ISO 8601 UTC'),
            description: z.string().optional().describe('New description or notes'),
            category: z.string().optional().describe('New category, e.g. "Work", "Personal"'),
            status: z.enum(['Upcoming', 'Completed', 'Missed']).optional().describe('New status'),
            documentIds: z.array(z.string().uuid()).optional().describe('New array of document UUIDs to link'),
            reminderMinutes: z.number().int().min(1).max(10080).optional().describe('Minutes before start_time for reminder'),
            syncWithGoogleCalendar: z.boolean().optional().describe('If true, update the linked Google Calendar event as well'),
          }),
          execute: async ({ id, title, startTime, endTime, description, category, status, documentIds, reminderMinutes, syncWithGoogleCalendar }) => {
            // Get existing to check for gcal_event_id
            const { data: existing } = await supabase.from('schedules').select('*').eq('id', id).single()
            if (!existing) return { success: false, error: 'Schedule not found.' }

            const updateData: any = {}
            if (title !== undefined) updateData.title = title
            if (startTime !== undefined) updateData.start_time = startTime
            if (endTime !== undefined) updateData.end_time = endTime
            if (status !== undefined) updateData.status = status
            if (documentIds !== undefined) updateData.document_ids = documentIds
            if (reminderMinutes !== undefined) updateData.reminder_minutes = reminderMinutes

            if (category !== undefined || description !== undefined) {
              const cat = category ?? (existing.description?.startsWith('[') ? existing.description.split(']')[0].slice(1) : undefined)
              const desc = description ?? (existing.description?.includes(']') ? existing.description.split(']').slice(1).join(']').trim() : existing.description)

              if (cat && desc) updateData.description = `[${cat}] ${desc}`
              else if (cat) updateData.description = `[${cat}]`
              else if (desc) updateData.description = desc
            }

            const { error } = await supabase.from('schedules').update(updateData).eq('id', id)
            if (error) return { success: false, error: error.message }
            revalidatePath('/schedule')

            if (syncWithGoogleCalendar && existing.gcal_event_id) {
              const { data: { session } } = await supabase.auth.getSession()
              const providerToken = session?.provider_token
              if (providerToken) {
                try {
                  const { google: gapis } = await import('googleapis')
                  const auth = new gapis.auth.OAuth2()
                  auth.setCredentials({ access_token: providerToken })
                  const cal = gapis.calendar({ version: 'v3', auth })
                  await cal.events.patch({
                    calendarId: 'primary',
                    eventId: existing.gcal_event_id,
                    requestBody: {
                      summary: title ?? existing.title,
                      start: { dateTime: startTime ?? existing.start_time },
                      end: { dateTime: endTime ?? existing.end_time },
                      description: updateData.description ?? existing.description,
                    },
                  })
                  return { success: true, message: `Schedule "${title ?? existing.title}" was updated and synced to Google Calendar.` }
                } catch {
                  return { success: true, message: 'Schedule was updated in the database, but Google Calendar sync failed.' }
                }
              }
            }

            return { success: true, message: `Schedule "${title ?? existing.title}" was updated.` }
          },
        }),

        deleteSchedule: tool({
          description: "Delete a schedule entry. Call listSchedules first to get the correct ID.",
          inputSchema: z.object({
            id: z.string().uuid().describe('The UUID of the schedule to delete'),
            deleteFromGoogleCalendar: z.boolean().optional().describe('If true, also delete from Google Calendar'),
          }),
          execute: async ({ id, deleteFromGoogleCalendar }) => {
            const { data: existing } = await supabase.from('schedules').select('*').eq('id', id).single()
            if (!existing) return { success: false, error: 'Schedule not found.' }

            const { error } = await supabase.from('schedules').delete().eq('id', id)
            if (error) return { success: false, error: error.message }
            revalidatePath('/schedule')

            if (deleteFromGoogleCalendar && existing.gcal_event_id) {
              const { data: { session } } = await supabase.auth.getSession()
              const providerToken = session?.provider_token
              if (providerToken) {
                try {
                  const { google: gapis } = await import('googleapis')
                  const auth = new gapis.auth.OAuth2()
                  auth.setCredentials({ access_token: providerToken })
                  const cal = gapis.calendar({ version: 'v3', auth })
                  await cal.events.delete({ calendarId: 'primary', eventId: existing.gcal_event_id })
                  return { success: true, message: `Schedule "${existing.title}" was deleted from the database and Google Calendar.` }
                } catch {
                  return { success: true, message: `Schedule "${existing.title}" was deleted from the database, but failed to delete from Google Calendar.` }
                }
              }
            }

            return { success: true, message: `Schedule "${existing.title}" was deleted.` }
          },
        }),
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const message = isQuotaError(error)
      ? 'Gemini API quota exhausted. Please wait a few minutes and try again.'
      : 'AI is temporarily unavailable. Please try again.'
    console.error('[chat] streamText error:', error)
    return Response.json({ error: message }, { status: 503 })
  }
}
