import React, { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
  $isTextNode,
} from 'lexical'
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, $isListNode, ListNode } from '@lexical/list'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode'
import { $setBlocksType, $patchStyleText } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text'
import { $createCodeNode, $isCodeNode } from '@lexical/code'
import { $getNearestNodeOfType } from '@lexical/utils'

const FONTS = ['Calibri','Arial','Georgia','Times New Roman','Courier New','Verdana','Trebuchet MS','Comic Sans MS']
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36]

export default function Toolbar({ onOpen, onExportDocx, onExportHtml, onPrint }) {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState({})

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return

        const anchorNode = selection.anchor.getNode()
        const element = anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow()

        let isBullet = false
        let isOrdered = false
        const nearestList = $getNearestNodeOfType(anchorNode, ListNode)
        if (nearestList) {
          isBullet = nearestList.getListType() === 'bullet'
          isOrdered = nearestList.getListType() === 'number'
        }

        const fmt = element.getFormatType ? element.getFormatType() : ''
        setActive({
          bold: selection.hasFormat('bold'),
          italic: selection.hasFormat('italic'),
          underline: selection.hasFormat('underline'),
          strikeThrough: selection.hasFormat('strikethrough'),
          insertUnorderedList: isBullet,
          insertOrderedList: isOrdered,
          justifyLeft: fmt === 'left' || fmt === '',
          justifyCenter: fmt === 'center',
          justifyRight: fmt === 'right',
          justifyFull: fmt === 'justify',
        })
      })
    })
  }, [editor])

  const exec = useCallback((cmd, val) => {
    switch (cmd) {
      case '__new':
        if (confirm('Start a new blank document? Unsaved changes will be lost.')) {
          editor.update(() => {
            const root = $getRoot()
            root.clear()
            root.append($createParagraphNode())
          })
        }
        break
      case 'undo': editor.dispatchCommand(UNDO_COMMAND, undefined); break
      case 'redo': editor.dispatchCommand(REDO_COMMAND, undefined); break
      case 'bold': editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'); break
      case 'italic': editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'); break
      case 'underline': editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'); break
      case 'strikeThrough': editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'); break
      case 'justifyLeft': editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'); break
      case 'justifyCenter': editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'); break
      case 'justifyRight': editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'); break
      case 'justifyFull': editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'); break
      case 'insertUnorderedList': editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined); break
      case 'insertOrderedList': editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined); break
      case 'outdent': editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined); break
      case 'indent': editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined); break
      case 'insertHorizontalRule': editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); break
      case 'createLink': {
        const url = prompt('Link URL:')
        if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url })
        break
      }
      case 'formatBlock':
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return
          const v = val.toUpperCase()
          if (v === 'P') $setBlocksType(selection, () => $createParagraphNode())
          else if (v === 'H1') $setBlocksType(selection, () => $createHeadingNode('h1'))
          else if (v === 'H2') $setBlocksType(selection, () => $createHeadingNode('h2'))
          else if (v === 'H3') $setBlocksType(selection, () => $createHeadingNode('h3'))
          else if (v === 'BLOCKQUOTE') $setBlocksType(selection, () => $createQuoteNode())
          else if (v === 'PRE') $setBlocksType(selection, () => $createCodeNode())
        })
        break
      case 'fontName':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) $patchStyleText(selection, { 'font-family': val })
        })
        break
      case 'fontSize':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) $patchStyleText(selection, { 'font-size': val + 'pt' })
        })
        break
      case 'foreColor':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) $patchStyleText(selection, { color: val })
        })
        break
      case 'hiliteColor':
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) $patchStyleText(selection, { 'background-color': val })
        })
        break
      case 'removeFormat':
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return
          selection.getNodes().forEach(node => {
            if ($isTextNode(node)) { node.setFormat(0); node.setStyle('') }
          })
          $setBlocksType(selection, () => $createParagraphNode())
        })
        break
    }
  }, [editor])

  const apply = (cmd, val) => (e) => { e.preventDefault(); exec(cmd, val) }
  const btn = (on) => 'tool icon' + (on ? ' active' : '')

  return (
    <div className="ribbon" onMouseDown={(e) => e.preventDefault()}>
      <div className="group">
        <button className="tool" title="New" onMouseDown={apply('__new')}>New</button>
        <button className="tool" title="Open .docx" onMouseDown={(e) => { e.preventDefault(); onOpen() }}>Open</button>
        <button className="tool" title="Save as .docx" onMouseDown={(e) => { e.preventDefault(); onExportDocx() }}>.docx</button>
        <button className="tool" title="Save as HTML" onMouseDown={(e) => { e.preventDefault(); onExportHtml() }}>.html</button>
        <button className="tool" title="Print / PDF" onMouseDown={(e) => { e.preventDefault(); onPrint() }}>Print</button>
      </div>

      <div className="group">
        <button className="tool" title="Undo" onMouseDown={apply('undo')}>↶</button>
        <button className="tool" title="Redo" onMouseDown={apply('redo')}>↷</button>
      </div>

      <div className="group">
        <select className="tool style-select" title="Paragraph style" value="" onChange={(e) => { exec('formatBlock', e.target.value); e.target.value = '' }} onMouseDown={(e) => e.stopPropagation()}>
          <option value="" disabled>Style</option>
          <option value="P">Normal</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
          <option value="BLOCKQUOTE">Quote</option>
          <option value="PRE">Code</option>
        </select>
        <select className="tool font-select" title="Font" defaultValue="Calibri" onChange={(e) => exec('fontName', e.target.value)} onMouseDown={(e) => e.stopPropagation()}>
          {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
        <select className="tool size-select" title="Font size" defaultValue="11" onChange={(e) => exec('fontSize', e.target.value)} onMouseDown={(e) => e.stopPropagation()}>
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="group">
        <button className={btn(active.bold)} title="Bold" onMouseDown={apply('bold')}><b>B</b></button>
        <button className={btn(active.italic)} title="Italic" onMouseDown={apply('italic')}><i>I</i></button>
        <button className={btn(active.underline)} title="Underline" onMouseDown={apply('underline')}><u>U</u></button>
        <button className={btn(active.strikeThrough)} title="Strikethrough" onMouseDown={apply('strikeThrough')}><s>S</s></button>
        <label className="color" title="Text color">
          A
          <input type="color" defaultValue="#000000" onChange={(e) => exec('foreColor', e.target.value)} onMouseDown={(e) => e.stopPropagation()} />
        </label>
        <label className="color" title="Highlight" style={{ background: '#fff3a0' }}>
          ▌
          <input type="color" defaultValue="#ffff00" onChange={(e) => exec('hiliteColor', e.target.value)} onMouseDown={(e) => e.stopPropagation()} />
        </label>
        <button className="tool" title="Clear formatting" onMouseDown={apply('removeFormat')}>⌫A</button>
      </div>

      <div className="group">
        <button className={btn(active.justifyLeft)} title="Align left" onMouseDown={apply('justifyLeft')}>⯇</button>
        <button className={btn(active.justifyCenter)} title="Center" onMouseDown={apply('justifyCenter')}>≡</button>
        <button className={btn(active.justifyRight)} title="Align right" onMouseDown={apply('justifyRight')}>⯈</button>
        <button className={btn(active.justifyFull)} title="Justify" onMouseDown={apply('justifyFull')}>☰</button>
      </div>

      <div className="group">
        <button className={btn(active.insertUnorderedList)} title="Bullets" onMouseDown={apply('insertUnorderedList')}>• ☰</button>
        <button className={btn(active.insertOrderedList)} title="Numbering" onMouseDown={apply('insertOrderedList')}>1. ☰</button>
        <button className="tool" title="Decrease indent" onMouseDown={apply('outdent')}>⇤</button>
        <button className="tool" title="Increase indent" onMouseDown={apply('indent')}>⇥</button>
      </div>

      <div className="group">
        <button className="tool" title="Insert link" onMouseDown={(e) => { e.preventDefault(); exec('createLink') }}>🔗</button>
        <button className="tool" title="Horizontal line" onMouseDown={apply('insertHorizontalRule')}>―</button>
      </div>
    </div>
  )
}
