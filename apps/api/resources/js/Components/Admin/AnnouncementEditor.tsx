import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AnnouncementEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive = false, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={clsx(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-950 transition',
        isActive
          ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50',
      )}
    >
      {children}
    </button>
  );
}

export default function AnnouncementEditor({
  id,
  value,
  onChange,
  placeholder = 'Tulis isi berita di sini...',
}: AnnouncementEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'cms-editor__content min-h-[320px] px-5 py-4 focus:outline-none text-base leading-8 text-emerald-950',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const nextValue = value || '<p></p>';

    if (currentHtml !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL tautan', previousUrl || 'https://');

    if (url === null) {
      return;
    }

    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const setImage = () => {
    if (!editor) {
      return;
    }

    const url = window.prompt('Masukkan URL gambar');

    if (!url || url.trim() === '') {
      return;
    }

    editor.chain().focus().setImage({ src: url.trim(), alt: 'Gambar berita' }).run();
  };

  if (!editor) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Memuat editor berita...
      </div>
    );
  }

  return (
    <div className="cms-editor overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <ToolbarButton
          label="Heading 1"
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet List"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered List"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Align Left"
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Align Center"
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Align Right"
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton label="Link" isActive={editor.isActive('link')} onClick={setLink}>
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Image URL" onClick={setImage}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </ToolbarButton>
      </div>

      <EditorContent id={id} editor={editor} />
    </div>
  );
}
