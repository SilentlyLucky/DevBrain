import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from '@/lib/gemini'
import { generateText } from 'ai'

// Use the smallest available model - folder matching is a trivial classification task
const suggestionModel = google('gemini-2.5-flash-lite')

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, contentPreview, folderNames } = await req.json() as {
      title: string
      contentPreview: string
      folderNames: string[]
    }

    // If no folders exist, skip AI and return null
    if (!folderNames || folderNames.length === 0) {
      return NextResponse.json({ suggestion: null })
    }

    const prompt = `You are a document classifier. Pick the BEST matching folder for this document.

Available folders: ${folderNames.map(n => `"${n}"`).join(', ')}

Document title: "${title}"
Content preview: ${contentPreview.slice(0, 800)}

Rules:
- Reply with ONLY one folder name from the list above, copied exactly.
- Always pick the closest match even if it's not perfect.
- Only reply "NONE" if the document is completely unrelated to every single folder.
- Do not add quotes, punctuation, or explanation.`

    const { text } = await generateText({
      model: suggestionModel,
      prompt,
      maxOutputTokens: 30,
    })

    const raw = text.trim().replace(/^["']|["']$/g, '') // strip accidental quotes

    if (!raw || raw.toUpperCase() === 'NONE') {
      return NextResponse.json({ suggestion: null })
    }

    // 1. Exact case-insensitive match
    let matched = folderNames.find(n => n.toLowerCase() === raw.toLowerCase()) ?? null

    // 2. Folder name contained in model output (e.g. model said "Kalkulus 2" but folder is "Kalkulus")
    if (!matched) {
      matched = folderNames.find(n => raw.toLowerCase().includes(n.toLowerCase())) ?? null
    }

    // 3. Model output contained in folder name (e.g. model said "Calc" but folder is "Kalkulus")
    if (!matched) {
      matched = folderNames.find(n => n.toLowerCase().includes(raw.toLowerCase())) ?? null
    }

    return NextResponse.json({ suggestion: matched })
  } catch (err: unknown) {
    // Log only unexpected errors - transient 503/overload failures are non-fatal
    const status = (err as { statusCode?: number })?.statusCode
    if (!status || status < 500) console.error('[suggest-folder]', err)
    return NextResponse.json({ suggestion: null })
  }
}
