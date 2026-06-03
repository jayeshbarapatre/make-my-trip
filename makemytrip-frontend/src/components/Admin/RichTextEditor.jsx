import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useState } from 'react'
import styles from './RichTextEditor.module.css'

const RichTextEditor = ({ value, onChange, onImageSelect }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const addImage = (imageUrl) => {
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setIsImageModalOpen(false)
  }

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.toolbar}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Ordered List"
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleLink({ href: prompt('URL:') }).run()}
          className={editor.isActive('link') ? 'active' : ''}
          title="Add Link"
        >
          Link
        </button>
        <button onClick={() => setIsImageModalOpen(true)} title="Add Image">
          Image
        </button>
        <button
          onClick={() => editor.chain().focus().clearNodes().run()}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      <EditorContent editor={editor} className={styles.editor} />

      {isImageModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Insert Image</h3>
            <input
              type="text"
              placeholder="Paste image URL"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  addImage(e.target.value)
                  e.target.value = ''
                }
              }}
              autoFocus
            />
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => setIsImageModalOpen(false)}>Cancel</button>
              {onImageSelect && (
                <button onClick={() => onImageSelect((img) => addImage(img))}>
                  From Media Library
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor
