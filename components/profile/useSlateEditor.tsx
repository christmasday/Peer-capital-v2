import React, { useMemo, useCallback } from "react"
import { createEditor, Descendant, Element as SlateElement, Text as SlateText, Node, Transforms, Editor, BaseElement, BaseText } from "slate"
import { Slate, Editable, withReact, ReactEditor, useSlate } from "slate-react"
import { withHistory } from "slate-history"

export interface SlateEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

// --- Custom Types for Slate ---
type CustomElement = { type: string; children: Descendant[]; [key: string]: any }
type CustomText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; [key: string]: any }

// --- Toolbar Button ---
const ToolbarButton = ({ format, icon, active, onMouseDown }: any) => (
  <button
    type="button"
    className={`px-2 py-1 rounded ${active ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-100 text-gray-700'}`}
    onMouseDown={onMouseDown}
    aria-label={format}
  >
    {icon}
  </button>
)

// --- Toolbar ---
const Toolbar = () => {
  const editor = useSlate()
  return (
    <div className="flex gap-1 border-b mb-2 pb-1">
      <ToolbarButton
        format="bold"
        icon={<b>B</b>}
        active={isMarkActive(editor, 'bold')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleMark(editor, 'bold') }}
      />
      <ToolbarButton
        format="italic"
        icon={<i>I</i>}
        active={isMarkActive(editor, 'italic')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleMark(editor, 'italic') }}
      />
      <ToolbarButton
        format="underline"
        icon={<u>U</u>}
        active={isMarkActive(editor, 'underline')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleMark(editor, 'underline') }}
      />
      <ToolbarButton
        format="heading-one"
        icon={<span style={{fontWeight:700}}>H1</span>}
        active={isBlockActive(editor, 'heading-one')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleBlock(editor, 'heading-one') }}
      />
      <ToolbarButton
        format="heading-two"
        icon={<span style={{fontWeight:700}}>H2</span>}
        active={isBlockActive(editor, 'heading-two')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleBlock(editor, 'heading-two') }}
      />
      <ToolbarButton
        format="numbered-list"
        icon={<span>1.</span>}
        active={isBlockActive(editor, 'numbered-list')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleBlock(editor, 'numbered-list') }}
      />
      <ToolbarButton
        format="bulleted-list"
        icon={<span>&bull;</span>}
        active={isBlockActive(editor, 'bulleted-list')}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); toggleBlock(editor, 'bulleted-list') }}
      />
    </div>
  )
}

// --- Helpers for marks and blocks ---
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor) as CustomText | null
  return marks ? marks[format] === true : false
}
const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']
const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === format,
  })
  return !!match
}
const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes((n as CustomElement).type),
    split: true,
  })
  let newType = isActive ? 'paragraph' : isList ? 'list-item' : format
  Transforms.setNodes(editor, { type: newType } as Partial<CustomElement>)
  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

// --- Rendering ---
const Element = (props: any) => {
  const { attributes, children, element } = props
  switch ((element as CustomElement).type) {
    case 'heading-one':
      return <h1 {...attributes} className="text-2xl font-bold my-2">{children}</h1>
    case 'heading-two':
      return <h2 {...attributes} className="text-xl font-semibold my-2">{children}</h2>
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc ml-6">{children}</ul>
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal ml-6">{children}</ol>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes}>{children}</p>
  }
}
const Leaf = (props: any) => {
  let { attributes, children, leaf } = props
  if ((leaf as CustomText).bold) children = <strong>{children}</strong>
  if ((leaf as CustomText).italic) children = <em>{children}</em>
  if ((leaf as CustomText).underline) children = <u>{children}</u>
  return <span {...attributes}>{children}</span>
}

// --- Main Editor ---
function deserialize(html: string): Descendant[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const body = doc.body
  const children = Array.from(body.childNodes)
  if (children.length === 0) return [{ type: "paragraph", children: [{ text: "" }] } as CustomElement]
  return children.map(node => nodeToSlate(node))
}
function nodeToSlate(node: any): Descendant {
  if (node.nodeType === 3) {
    return { text: node.textContent } as CustomText
  } else if (node.nodeType === 1) {
    const children = Array.from(node.childNodes).map(nodeToSlate)
    switch (node.nodeName) {
      case "STRONG":
      case "B":
        return { type: "paragraph", children: [{ text: node.textContent, bold: true } as CustomText] } as CustomElement
      case "EM":
      case "I":
        return { type: "paragraph", children: [{ text: node.textContent, italic: true } as CustomText] } as CustomElement
      case "U":
        return { type: "paragraph", children: [{ text: node.textContent, underline: true } as CustomText] } as CustomElement
      case "LI":
        return { type: "list-item", children } as CustomElement
      case "UL":
        return { type: "bulleted-list", children } as CustomElement
      case "OL":
        return { type: "numbered-list", children } as CustomElement
      case "H1":
        return { type: "heading-one", children } as CustomElement
      case "H2":
        return { type: "heading-two", children } as CustomElement
      case "P":
      default:
        return { type: "paragraph", children } as CustomElement
    }
  }
  return { text: "" } as CustomText
}
function serialize(nodes: Descendant[]): string {
  return nodes.map(n => Node.string(n)).join("\n")
}

export function SlateEditor({ value, onChange, readOnly }: SlateEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor() as ReactEditor)), [])
  const initialValue = useMemo(() => {
    try {
      return value ? deserialize(value) : [{ type: "paragraph", children: [{ text: "" }] } as CustomElement]
    } catch {
      return [{ type: "paragraph", children: [{ text: "" }] } as CustomElement]
    }
  }, [value])

  const handleChange = useCallback(
    (val: Descendant[]) => {
      if (onChange) {
        // For simplicity, store as plain text
        onChange(Node.string({ children: val } as any))
      }
    },
    [onChange]
  )

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
      {!readOnly && <Toolbar />}
      <Editable
        readOnly={readOnly}
        placeholder="Enter text..."
        renderElement={Element}
        renderLeaf={Leaf}
        spellCheck
        autoFocus
      />
    </Slate>
  )
} 