import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from '@/lib/gemini'
import { generateText } from 'ai'

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

    const raw = text.trim().replace(/^["']|["']$/g, '')

    if (!raw || raw.toUpperCase() === 'NONE') {
      return NextResponse.json({ suggestion: null })
    }

    let matched = folderNames.find(n => n.toLowerCase() === raw.toLowerCase()) ?? null

    if (!matched) {
      matched = folderNames.find(n => raw.toLowerCase().includes(n.toLowerCase())) ?? null
    }

    if (!matched) {
      matched = folderNames.find(n => n.toLowerCase().includes(raw.toLowerCase())) ?? null
    }

    return NextResponse.json({ suggestion: matched })
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (!status || status < 500) console.error('[suggest-folder]', err)
    return NextResponse.json({ suggestion: null })
  }
}
