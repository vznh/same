'use client'

import { UINode } from '@/models/uiNode'

export default function RenderNode({ node }: { node: UINode }) {
  return render(node)
}

function render(node: UINode): JSX.Element {
  switch (node.type) {
    case 'Stack': {
      const dir = node.props?.direction === 'horizontal' ? 'flex-row' : 'flex-col'
      const gap = node.props?.gap ? `gap-[${node.props?.gap}px]` : 'gap-3'
      return (
        <div className={`flex ${dir} ${gap} ${node.props?.className || ''}`.trim()}>
          {node.children?.map((c, i) => <RenderNode key={i} node={c} />)}
        </div>
      )
    }
    case 'Box':
      return <div className={node.props?.className}>{node.children?.map((c, i) => <RenderNode key={i} node={c} />)}</div>
    case 'Heading': {
      const L = `h${node.props?.level || 2}` as keyof JSX.IntrinsicElements
      return <L className={node.props?.className}>{node.props.text}</L>
    }
    case 'Text':
      return <p className={node.props?.className}>{node.props.text}</p>
    case 'Button':
      return node.props?.href ? (
        <a href={node.props.href} className={`inline-block px-3 py-1 rounded ${variant(node.props?.variant)} ${node.props?.className || ''}`.trim()}>{node.props.text}</a>
      ) : (
        <button className={`px-3 py-1 rounded ${variant(node.props?.variant)} ${node.props?.className || ''}`.trim()}>{node.props.text}</button>
      )
    case 'Input':
      return <input placeholder={node.props?.placeholder} className={`px-3 py-1 rounded border ${node.props?.className || ''}`} />
    case 'Image':
      return <img src={node.props.src} alt={node.props?.alt || ''} className={node.props?.className} />
    case 'List': {
      const Tag = node.props?.ordered ? 'ol' : 'ul'
      return (
        <Tag className={node.props?.className}>
          {node.children?.map((li, i) => <li key={i}><p className={li.props?.className}>{li.props.text}</p></li>)}
        </Tag>
      )
    }
    case 'Divider':
      return <div className={`h-px w-full bg-gray-200 ${node.props?.className || ''}`} />
  }
}

function variant(v?: 'primary' | 'secondary' | 'link') {
  switch (v) {
    case 'secondary':
      return 'bg-gray-100 text-gray-800 border'
    case 'link':
      return 'text-blue-600 underline'
    case 'primary':
    default:
      return 'bg-blue-600 text-white'
  }
}

