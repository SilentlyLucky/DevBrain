const MAX_CHARS = 1500
const OVERLAP = 150

export function chunkText(content: string): string[] {
  if (!content.trim()) return []

  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    const next = current ? `${current}\n\n${para}` : para

    if (next.length <= MAX_CHARS) {
      current = next
    } else {
      if (current) {
        chunks.push(current)
        const overlap = current.slice(-OVERLAP).trimStart()
        current = overlap ? `${overlap}\n\n${para}` : para
      } else {
        current = para
      }

      while (current.length > MAX_CHARS) {
        chunks.push(current.slice(0, MAX_CHARS))
        current = current.slice(MAX_CHARS - OVERLAP)
      }
    }
  }

  if (current.trim()) chunks.push(current)
  return chunks
}
