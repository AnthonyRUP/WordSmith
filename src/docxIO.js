// Import/export helpers for real Microsoft .docx files.
import mammoth from "mammoth";
import { asBlob } from "html-docx-js-typescript";

// Convert an uploaded .docx File into HTML we can drop into the editor.
export async function docxToHtml(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.convertToHtml({ arrayBuffer });
  return value || "<p><br/></p>";
}

// Wrap the editor's HTML with print-friendly styling and download as .docx.
export async function htmlToDocx(innerHtml, filename) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family: Calibri, sans-serif; font-size: 11pt;">
    ${innerHtml}
    </body></html>`;
  const blob = await asBlob(html);
  triggerDownload(blob, ensureExt(filename, "docx"));
}

export function downloadHtml(innerHtml, filename) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title></head><body>${innerHtml}</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  triggerDownload(blob, ensureExt(filename, "html"));
}

function ensureExt(name, ext) {
  const base = (name || "Untitled").replace(/\.(docx|html?)$/i, "");
  return `${base}.${ext}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
