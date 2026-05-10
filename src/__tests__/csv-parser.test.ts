import { describe, it, expect } from 'vitest'
import { extractTextFromCsv } from '@/lib/parsers/csv-parser'

function makeCsvFile(content: string): File {
  return new File([content], 'data.csv', { type: 'text/csv' })
}

describe('extractTextFromCsv', () => {
  it('returns raw CSV text as-is', async () => {
    const raw = 'name,age\nAlice,30\nBob,25'
    const file = makeCsvFile(raw)
    expect(await extractTextFromCsv(file)).toBe(raw)
  })

  it('returns empty string for empty file', async () => {
    const file = makeCsvFile('')
    expect((await extractTextFromCsv(file)).trim()).toBe('')
  })
})
