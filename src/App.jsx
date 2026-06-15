import React, { useEffect, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { CodeNode } from '@lexical/code'
import { $generateNodesFromDOM } from '@lexical/html'
import { $getRoot } from 'lexical'

import Toolbar from './Toolbar.jsx'
import AutosavePlugin from './plugins/AutosavePlugin.jsx'
import WordCountPlugin from './plugins/WordCountPlugin.jsx'
import EditorRefPlugin from './plugins/EditorRefPlugin.jsx'
import { docxToHtml } from './docxIO.js'

const STORAGE_KEY = 'wordsmith:doc'
const NAME_KEY = 'wordsmith:name'

const editorConfig = {
  namespace: 'WordSmith',
  nodes: [HeadingNode, QuoteNode, CodeNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, HorizontalRuleNode],
  onError: (err) => console.error(err),
}

export default function App() {
  const editorRef = useRef(null)
  const fileRef = useRef(null)
  const [docName, setDocName] = useState(() => localStorage.getItem(NAME_KEY) || 'Untitled document')
  const [counts, setCounts] = useState({ words: 0, chars: 0 })
  const [zoom, setZoom] = useState(100)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    localStorage.setItem(NAME_KEY, docName)
  }, [docName])

  const openFile = () => fileRef.current?.click()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const html = await docxToHtml(file)
      const editor = editorRef.current
      if (!editor) return
      editor.update(() => {
        const parser = new DOMParser()
        const dom = parser.parseFromString(html, 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)
        const root = $getRoot()
        root.clear()
        if (nodes.length > 0) root.append(...nodes)
      })
      setDocName(file.name.replace(/\.docx$/i, ''))
    } catch (err) {
      alert("Couldn't open that file. Make sure it's a valid .docx.\n\n" + err)
    }
  }

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="app">
        <div className="titlebar">
          <span className="brand">WordSmith</span>
          <input
            className="docname"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Document name"
          />
          <span className="spacer" />
          <span className="hint">{saved ? 'All changes saved' : 'Saving…'}</span>
        </div>

        <Toolbar docName={docName} onOpen={openFile} />

        <input ref={fileRef} type="file" accept=".docx" className="hidden-input" onChange={handleFile} />

        <div className="surface">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="page"
                style={{ transform: `scale(${zoom / 100})` }}
                spellCheck
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <EditorRefPlugin editorRef={editorRef} />
        <AutosavePlugin storageKey={STORAGE_KEY} onSaveChange={setSaved} />
        <WordCountPlugin onChange={setCounts} />

        <div className="statusbar">
          <span>{counts.words} words</span>
          <span>{counts.chars} characters</span>
          <span className="spacer" />
          <span>Zoom</span>
          <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
            {[50, 75, 90, 100, 125, 150, 200].map((z) => (
              <option key={z} value={z}>{z}%</option>
            ))}
          </select>
        </div>
      </div>
    </LexicalComposer>
  )
}
