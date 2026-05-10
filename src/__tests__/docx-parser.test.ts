import { describe, it, expect, vi } from 'vitest'

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted DOCX content' }),
  },
}))

import { extractTextFromDocx } from '@/lib/parsers/docx-parser'

describe('extractTextFromDocx', () => {
  it('returns text extracted by mammoth', async () => {
    const file = new File(['dummy'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const result = await extractTextFromDocx(file)
    expect(result).toBe('Extracted DOCX content')
  })
})
