'use client'
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item
}

/**
 * Heuristic: a font whose name contains "Bold" (or "Black"/"Heavy") is bold.
 * pdfjs exposes the font name as the family used internally, e.g.
 * "g_d0_f1" for embedded subsets - so we also rely on height ratios.
 */
function looksLikeBold(fontName: string): boolean {
  const lower = fontName.toLowerCase()
  return lower.includes('bold') || lower.includes('black') || lower.includes('heavy') || lower.includes('demi')
}

function looksLikeItalic(fontName: string): boolean {
  const lower = fontName.toLowerCase()
  return lower.includes('italic') || lower.includes('oblique')
}

// Bullet character variants that appear in PDFs
const BULLET_CHARS = new Set(['•', '◦', '▪', '▸', '–', '-', '*', '·', '○', '●', '◉', '►', '▶', '‣'])

function isBulletLine(text: string): boolean {
  const trimmed = text.trimStart()
  // Starts with a unicode bullet or a dash/asterisk followed by a space
  return BULLET_CHARS.has(trimmed[0]) || /^[-*]\s/.test(trimmed)
}

function isNumberedList(text: string): boolean {
  return /^\d+[.)]\s/.test(text.trimStart())
}

// ─── main extractor ──────────────────────────────────────────────────────────

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

    // Group items into visual lines by their Y coordinate (±2 pt tolerance)
    const rows: Map<number, RichLine[]> = new Map()
    for (const raw of tc.items) {
      if (!isTextItem(raw)) continue
      const item = raw as TextItem
      if (!item.str.trim()) continue

      // Transform matrix: [scaleX, skewX, skewY, scaleY, x, y]
      const fontSize = Math.abs(item.transform[3]) // scaleY ≈ fontSize
      const y = Math.round(item.transform[5])       // vertical position
      const x = item.transform[4]
      const fontName: string = (item as any).fontName ?? ''

      // Bucket by y (merge items within 2 pts of each other)
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

    // Sort buckets top-to-bottom (PDF y=0 is at bottom, so descending)
    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0])
    allLines.push(sorted.map(([, items]) => {
      // Merge items in the same row left-to-right
      const sortedItems = items.sort((a, b) => a.x - b.x)
      const bold = sortedItems.some(i => i.bold)
      const italic = sortedItems.some(i => i.italic)
      const text = sortedItems.map(i => i.text).join('')
      return { text, fontSize: sortedItems[0].fontSize, bold, italic, x: sortedItems[0].x, y: sortedItems[0].y }
    }))
  }

  // ─── Convert rich lines to Markdown ─────────────────────────────────────

  const mdLines: string[] = []

  for (const pageLines of allLines) {
    if (pageLines.length === 0) continue

    // Determine the modal (most common) body font size for this page
    const fontSizes = pageLines.map(l => Math.round(l.fontSize))
    const freq = new Map<number, number>()
    for (const fs of fontSizes) freq.set(fs, (freq.get(fs) ?? 0) + 1)
    const bodySize = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]

    for (const line of pageLines) {
      const text = line.text.trim()
      if (!text) continue

      const fs = Math.round(line.fontSize)
      const ratio = fs / bodySize

      // ── Headings based on font size ratio ──
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

      // ── Bullet / numbered lists ──
      if (isBulletLine(text)) {
        // Normalise the bullet char to '-' for clean Markdown
        const content = text.replace(/^[\s•◦▪▸–*·○●◉►▶‣-]+\s*/, '').trim()
        mdLines.push(`- ${content}`)
        continue
      }
      if (isNumberedList(text)) {
        mdLines.push(text) // already 1. 2. etc
        continue
      }

      // ── Bold / italic inline ──
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

      // ── Regular body text ──
      mdLines.push(text)
    }

    // Page break
    mdLines.push('\n---\n')
  }

  // Remove trailing page break
  while (mdLines.length && mdLines[mdLines.length - 1].trim() === '---') mdLines.pop()

  return mdLines.join('\n')
}

// ─── Image page extraction ────────────────────────────────────────────────────
// Returns base64 JPEG renders for pages that have embedded images but little text.
// These pages are described by Gemini Vision at upload time so their content is
// searchable (charts, diagrams, figures, scanned slides, etc.).

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

    // Fast path: skip pages with no image operators
    const ops = await page.getOperatorList()
    const hasImages = ops.fnArray.some(fn => IMAGE_OPS.has(fn as number))
    if (!hasImages) continue

    // Skip if the page already has enough text (images are supplementary, not primary)
    const tc = await page.getTextContent()
    const textLen = tc.items.reduce(
      (sum, item) => sum + ('str' in item ? (item as TextItem).str.length : 0), 0
    )
    if (textLen > 200) continue

    // Render page to JPEG canvas
    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width  = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
    const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1]
    canvas.width = 0   // free memory
    canvas.height = 0

    results.push({ pageNum, base64 })
  }

  return results
}
