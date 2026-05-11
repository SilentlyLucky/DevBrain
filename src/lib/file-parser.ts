'use client'

import { SUPPORTED_EXTENSIONS } from '@/types'

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
