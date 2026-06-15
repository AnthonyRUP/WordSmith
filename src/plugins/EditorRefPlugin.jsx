import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export default function EditorRefPlugin({ editorRef }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => { editorRef.current = editor }, [editor, editorRef])
  return null
}