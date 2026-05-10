'use client'

export function extractTextFromCsv(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) ?? '')
    reader.onerror = () => reject(new Error('Failed to read CSV'))
    reader.readAsText(file, 'utf-8')
  })
}
