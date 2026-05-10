'use client'

export async function extractTextFromTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) { resolve(''); return }

      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (ext === '.html') {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        resolve(doc.body.textContent ?? '')
        return
      }
      resolve(text)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}
