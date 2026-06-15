import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export default function AutosavePlugin({ storageKey, onSaveChange }) {
  const [editor] = useLexicalComposerContext()
  const timer = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const state = editor.parseEditorState(saved)
        queueMicrotask(() => editor.setEditorState(state))
      } catch { /* corrupt — start fresh */ }
    }
    initialized.current = true
  }, [editor, storageKey])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (!initialized.current) return
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
      onSaveChange(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(editorState))
        onSaveChange(true)
      }, 600)
    })
  }, [editor, storageKey, onSaveChange])

  return null
}
