import mammoth from 'mammoth'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  UnderlineType, ShadingType, LineRuleType, convertInchesToTwip,
} from 'docx'

// ── Import ────────────────────────────────────────────────────────────────────

export async function docxToHtml(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.convertToHtml({ arrayBuffer })
  return value || '<p><br/></p>'
}

// ── Export ────────────────────────────────────────────────────────────────────

const HEADING_LEVEL = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
}

// 1.5x line height (240 = single), 8pt space after (1pt = 20 twips)
const DEFAULT_SPACING = { line: 360, lineRule: LineRuleType.AUTO, after: 160 }

const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

function parseStyle(styleStr) {
  if (!styleStr) return {}
  const map = {}
  styleStr.split(';').forEach(rule => {
    const idx = rule.indexOf(':')
    if (idx < 0) return
    map[rule.slice(0, idx).trim()] = rule.slice(idx + 1).trim()
  })
  return map
}

function hexColor(val) {
  if (!val) return undefined
  if (val.startsWith('#')) return val.slice(1).toUpperCase()
  return undefined
}

function ptToHalfPt(val) {
  const m = val?.match(/^(\d+(?:\.\d+)?)pt$/)
  return m ? Math.round(parseFloat(m[1]) * 2) : undefined
}

// Walk an inline subtree and return TextRun[]
function inlineRuns(node, ctx = {}) {
  if (node.nodeType === 3) {
    const text = node.textContent
    if (!text) return []
    const run = { text }
    if (ctx.bold) run.bold = true
    if (ctx.italic) run.italics = true
    if (ctx.underline) run.underline = { type: UnderlineType.SINGLE }
    if (ctx.strike) run.strike = true
    if (ctx.color) run.color = ctx.color
    if (ctx.size) run.size = ctx.size
    if (ctx.font) run.font = { name: ctx.font }
    if (ctx.highlight) run.shading = { type: ShadingType.SOLID, fill: ctx.highlight }
    return [new TextRun(run)]
  }
  if (node.nodeType !== 1) return []

  const tag = node.tagName.toLowerCase()
  const style = parseStyle(node.getAttribute('style'))
  const next = { ...ctx }

  if (tag === 'strong' || tag === 'b') next.bold = true
  if (tag === 'em' || tag === 'i') next.italic = true
  if (tag === 'u') next.underline = true
  if (tag === 's' || tag === 'del' || tag === 'strike') next.strike = true
  if (style['color']) next.color = hexColor(style['color'])
  if (style['background-color']) next.highlight = hexColor(style['background-color'])
  if (style['font-size']) next.size = ptToHalfPt(style['font-size'])
  if (style['font-family']) next.font = style['font-family'].replace(/['"]/g, '').split(',')[0].trim()

  // Skip anchor text content but still render text inside links
  const runs = []
  for (const child of node.childNodes) runs.push(...inlineRuns(child, next))
  return runs
}

function blockAlign(el) {
  const style = parseStyle(el.getAttribute?.('style'))
  return ALIGN[style['text-align']] ?? undefined
}

// Convert a block-level DOM element → Paragraph[]
function convertBlock(el) {
  const tag = el.tagName?.toLowerCase()
  if (!tag) return []

  if (HEADING_LEVEL[tag]) {
    return [new Paragraph({
      heading: HEADING_LEVEL[tag],
      alignment: blockAlign(el),
      spacing: DEFAULT_SPACING,
      children: inlineRuns(el),
    })]
  }

  if (tag === 'ul' || tag === 'ol') {
    const items = []
    el.querySelectorAll(':scope > li').forEach(li => {
      items.push(new Paragraph({
        children: inlineRuns(li),
        spacing: DEFAULT_SPACING,
        bullet: tag === 'ul' ? { level: 0 } : undefined,
      }))
    })
    return items
  }

  if (tag === 'blockquote') {
    return [new Paragraph({
      children: inlineRuns(el),
      indent: { left: convertInchesToTwip(0.5) },
      alignment: blockAlign(el),
      spacing: DEFAULT_SPACING,
    })]
  }

  if (tag === 'hr') {
    return [new Paragraph({
      children: [new TextRun({ text: '' })],
      border: { bottom: { style: 'single', size: 6, space: 1, color: '999999' } },
      spacing: DEFAULT_SPACING,
    })]
  }

  if (tag === 'pre' || tag === 'code') {
    return [new Paragraph({
      children: inlineRuns(el),
      spacing: DEFAULT_SPACING,
    })]
  }

  // p, div, span-as-block, etc.
  return [new Paragraph({
    children: inlineRuns(el),
    alignment: blockAlign(el),
    spacing: DEFAULT_SPACING,
  })]
}

export async function htmlToDocx(innerHtml, filename) {
  const dom = new DOMParser().parseFromString(`<body>${innerHtml}</body>`, 'text/html')
  const children = []
  for (const el of dom.body.children) children.push(...convertBlock(el))
  if (children.length === 0) children.push(new Paragraph({ children: [] }))

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { size: 22, font: { name: 'Calibri' } },
          paragraph: { spacing: DEFAULT_SPACING },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
          margin: {
            top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1), right: convertInchesToTwip(1),
          },
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, ensureExt(filename, 'docx'))
}

// ── HTML export ───────────────────────────────────────────────────────────────

export function downloadHtml(innerHtml, filename) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${innerHtml}</body></html>`
  triggerDownload(new Blob([html], { type: 'text/html' }), ensureExt(filename, 'html'))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureExt(name, ext) {
  return (name || 'Untitled').replace(/\.(docx|html?)$/i, '') + '.' + ext
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
