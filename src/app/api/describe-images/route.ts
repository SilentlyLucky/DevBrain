import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { devbrainModel } from '@/lib/gemini'

export const runtime = 'nodejs'

interface PageInput {
  pageNum: number
  base64: string
}

interface PageOutput {
  pageNum: number
  description: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { pages }: { pages: PageInput[] } = await req.json()
  if (!pages?.length) return Response.json({ descriptions: [] })

  const results = await Promise.allSettled(
    pages.slice(0, 5).map(async ({ pageNum, base64 }): Promise<PageOutput> => {
      const { text } = await generateText({
        model: devbrainModel,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract and transcribe ALL content visible on this page. Rules:\n1. Mathematical expressions (equations, integrals, derivatives, limits, fractions, summations, matrices): write them as LaTeX wrapped in $...$ for inline or $$...$$ for display math. Example: $$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$\n2. Example problems: include full problem statement, every solution step, and the final answer.\n3. Diagrams and graphs: describe axes, labels, curves, intersections, and key values.\n4. Tables: reproduce all rows and columns.\n5. Regular text: transcribe exactly.\nBe complete - omit nothing.',
            },
            {
              type: 'image',
              image: base64,
              mimeType: 'image/jpeg' as const,
            },
          ],
        }],
      })
      return { pageNum, description: text }
    })
  )

  const descriptions: PageOutput[] = results
    .filter((r): r is PromiseFulfilledResult<PageOutput> => r.status === 'fulfilled')
    .map(r => r.value)

  const failed = results.filter(r => r.status === 'rejected').length
  if (failed > 0) console.error(`[describe-images] ${failed} page(s) failed`)

  return Response.json({ descriptions })
}
