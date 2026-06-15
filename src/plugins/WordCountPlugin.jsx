import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

export default function WordCountPlugin({ onChange }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent()
        const words = (text.trim().match(/\S+/g) || []).length
        onChange({ words, chars: text.replace(/\n/g, '').length })
      })
    })
  }, [editor, onChange])
  return null
}
