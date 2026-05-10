'use client'
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item
}

function looksLikeBold(fontName: string): boolean {
  const lower = fontName.toLowerCase()
  return lower.includes('bold') || lower.includes('black') || lower.includes('heavy') || lower.includes('demi')
}

function looksLikeItalic(fontName: string): boolean {
  const lower = fontName.toLowerCase()
  return lower.includes('italic') || lower.includes('oblique')
}

const BULLET_CHARS = new Set(['•', '◦', '▪', '▸', '–', '-', '*', '·', '○', '●', '◉', '►', '▶', '‣'])

function isBulletLine(text: string): boolean {
  const trimmed = text.trimStart()
  return BULLET_CHARS.has(trimmed[0]) || /^[-*]\s/.test(trimmed)
}

function isNumberedList(text: string): boolean {
  return /^\d+[.)]\s/.test(text.trimStart())
}


interface RichLine {
  text: string
  fontSize: number
  bold: boolean
  italic: boolean
  x: number
  y: number
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const allLines: RichLine[][] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const tc = await page.getTextContent()

    const rows: Map<number, RichLine[]> = new Map()
    for (const raw of tc.items) {
      if (!isTextItem(raw)) continue
      const item = raw as TextItem
      if (!item.str.trim()) continue

      const fontSize = Math.abs(item.transform[3])
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      const fontName = item.fontName

      let bucket = y
      for (const [k] of rows) {
        if (Math.abs(k - y) <= 2) { bucket = k; break }
      }

      const rich: RichLine = {
        text: item.str,
        fontSize,
        bold: looksLikeBold(fontName),
        italic: looksLikeItalic(fontName),
        x,
        y,
      }

      if (!rows.has(bucket)) rows.set(bucket, [])
      rows.get(bucket)!.push(rich)
    }

    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0])
    allLines.push(sorted.map(([, items]) => {
      const sortedItems = items.sort((a, b) => a.x - b.x)
      const bold = sortedItems.some(i => i.bold)
      const italic = sortedItems.some(i => i.italic)
      const text = sortedItems.map(i => i.text).join('')
      return { text, fontSize: sortedItems[0].fontSize, bold, italic, x: sortedItems[0].x, y: sortedItems[0].y }
    }))
  }

  const mdLines: string[] = []

  for (const pageLines of allLines) {
    if (pageLines.length === 0) continue

    const fontSizes = pageLines.map(l => Math.round(l.fontSize))
    const freq = new Map<number, number>()
    for (const fs of fontSizes) freq.set(fs, (freq.get(fs) ?? 0) + 1)
    const bodySize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]

    for (const line of pageLines) {
      const text = line.text.trim()
      if (!text) continue

      const fs = Math.round(line.fontSize)
      const ratio = fs / bodySize

      if (ratio >= 2.0) {
        mdLines.push(`\n# ${text}\n`)
        continue
      }
      if (ratio >= 1.6) {
        mdLines.push(`\n## ${text}\n`)
        continue
      }
      if (ratio >= 1.35) {
        mdLines.push(`\n### ${text}\n`)
        continue
      }
      if (ratio >= 1.15 && line.bold) {
        mdLines.push(`\n#### ${text}\n`)
        continue
      }

      if (isBulletLine(text)) {
        const content = text.replace(/^[\s•◦▪▸–*·○●◉►▶‣-]+\s*/, '').trim()
        mdLines.push(`- ${content}`)
        continue
      }
      if (isNumberedList(text)) {
        mdLines.push(text)
        continue
      }

      if (line.bold && line.italic) {
        mdLines.push(`***${text}***`)
        continue
      }
      if (line.bold) {
        mdLines.push(`**${text}**`)
        continue
      }
      if (line.italic) {
        mdLines.push(`*${text}*`)
        continue
      }

      mdLines.push(text)
    }

    mdLines.push('\n---\n')
  }

  while (mdLines.length && mdLines[mdLines.length - 1].trim() === '---') mdLines.pop()

  return mdLines.join('\n')
}

export interface PdfImagePage {
  pageNum: number
  base64: string
}

export async function getPdfImagePages(file: File, maxPages = 5): Promise<PdfImagePage[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const IMAGE_OPS = new Set([
    pdfjsLib.OPS.paintImageXObject,
    pdfjsLib.OPS.paintImageXObjectRepeat,
    pdfjsLib.OPS.paintInlineImageXObject,
  ])

  const results: PdfImagePage[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages && results.length < maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum)

    const ops = await page.getOperatorList()
    const hasImages = ops.fnArray.some(fn => IMAGE_OPS.has(fn as number))
    if (!hasImages) continue

    const tc = await page.getTextContent()
    const textLen = tc.items.reduce(
      (sum, item) => sum + ('str' in item ? (item as TextItem).str.length : 0), 0
    )
    if (textLen > 200) continue

    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width  = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport}).promise
    const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1]
    canvas.width = 0 
    canvas.height = 0

    results.push({ pageNum, base64 })
  }

  return results
}
