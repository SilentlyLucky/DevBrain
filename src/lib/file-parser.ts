'use client'

export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.docx',
  '.txt', '.md',
  '.csv',
  '.html',
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.c', '.cpp', '.go', '.rs',
] as const

export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number]

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  if (idx === -1) return ''
  return filename.slice(idx).toLowerCase()
}

export function isSupportedFile(file: File): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(getFileExtension(file.name))
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = getFileExtension(file.name)

  switch (ext) {
    case '.pdf': {
      const { extractTextFromPdf } = await import('@/lib/pdf-parser')
      return extractTextFromPdf(file)
    }
    case '.docx': {
      const { extractTextFromDocx } = await import('@/lib/parsers/docx-parser')
      return extractTextFromDocx(file)
    }
    case '.csv': {
      const { extractTextFromCsv } = await import('@/lib/parsers/csv-parser')
      return extractTextFromCsv(file)
    }
    default: {
      const { extractTextFromTextFile } = await import('@/lib/parsers/text-parser')
      return extractTextFromTextFile(file)
    }
  }
}
