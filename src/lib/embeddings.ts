import 'server-only'

// src/lib/embeddings.ts
import { embed } from 'ai'
import { google } from '@/lib/gemini'

const embeddingModel = google.textEmbeddingModel('gemini-embedding-2')

export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (chunks.length === 0) return []
  const results = await Promise.all(
    chunks.map(chunk => embed({ model: embeddingModel, value: chunk }).then(r => r.embedding.slice(0, 768)))
  )
  return results
}

export async function embedQuery(query: string): Promise<number[]> {
  if (!query.trim()) throw new Error('Query must not be empty')
  const { embedding } = await embed({
    model: embeddingModel,
    value: query,
  })
  return embedding.slice(0, 768)
}
