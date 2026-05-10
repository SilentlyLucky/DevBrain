import { describe, it, expect } from 'vitest'
import { extractTextFromTextFile } from '@/lib/parsers/text-parser'

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: 'text/plain' })
}

describe('extractTextFromTextFile', () => {
  it('returns plain text as-is for .txt', async () => {
    const file = makeFile('notes.txt', 'Hello world')
    expect(await extractTextFromTextFile(file)).toBe('Hello world')
  })

  it('returns markdown content as-is for .md', async () => {
    const file = makeFile('readme.md', '# Title\n\nBody text')
    expect(await extractTextFromTextFile(file)).toBe('# Title\n\nBody text')
  })

  it('strips HTML tags for .html files', async () => {
    const file = makeFile('page.html', '<h1>Title</h1><p>Body</p>')
    const result = await extractTextFromTextFile(file)
    expect(result).toContain('Title')
    expect(result).toContain('Body')
    expect(result).not.toContain('<h1>')
    expect(result).not.toContain('<p>')
  })

  it('returns code content as-is for .py', async () => {
    const file = makeFile('script.py', 'def hello():\n    print("hi")')
    expect(await extractTextFromTextFile(file)).toBe('def hello():\n    print("hi")')
  })

  it('returns code content as-is for .ts', async () => {
    const file = makeFile('index.ts', 'export const x = 1')
    expect(await extractTextFromTextFile(file)).toBe('export const x = 1')
  })
})
