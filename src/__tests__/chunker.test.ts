import { describe, it, expect } from 'vitest'
import { chunkText } from '@/lib/chunker'

describe('chunkText', () => {
  it('returns empty array for empty string', () => {
    expect(chunkText('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(chunkText('   \n\n  ')).toEqual([])
  })

  it('returns single chunk for text under 1500 chars', () => {
    const text = 'Hello world. This is a short document.'
    const result = chunkText(text)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(text)
  })

  it('returns single chunk for text exactly at 1499 chars', () => {
    const text = 'a'.repeat(1499)
    expect(chunkText(text)).toHaveLength(1)
  })

  it('splits two large paragraphs into multiple chunks', () => {
    const para1 = 'Word '.repeat(200)
    const para2 = 'Text '.repeat(200)
    const text = `${para1}\n\n${para2}`
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('each chunk does not exceed 1500 chars', () => {
    const paras = Array.from({ length: 20 }, (_, i) => `Paragraph ${i}. ${'x'.repeat(300)}`)
    const text = paras.join('\n\n')
    chunkText(text).forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(1500)
    })
  })

  it('later chunks contain overlap from the previous chunk end', () => {
    const para1 = 'Alpha '.repeat(200)
    const para2 = 'Beta '.repeat(200)
    const para3 = 'Gamma '.repeat(200)
    const text = [para1, para2, para3].join('\n\n')
    const chunks = chunkText(text)
    if (chunks.length >= 2) {
      const tailOfFirst = chunks[0].slice(-150)
      expect(chunks[1].startsWith(tailOfFirst.trimStart())).toBe(true)
    }
  })

  it('splits single long paragraph with no newlines into chunks ≤ 1500 chars', () => {
    const text = 'x'.repeat(4000)
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(1500)
    })
  })
})
