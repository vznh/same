// models/uiNode – strict JSON schema for generated UI that can be rendered safely

export type UINode =
  | StackNode
  | BoxNode
  | HeadingNode
  | TextNode
  | ButtonNode
  | InputNode
  | ImageNode
  | ListNode
  | DividerNode

export interface BaseNode {
  type: string
}

export interface StackNode extends BaseNode {
  type: 'Stack'
  props?: {
    direction?: 'vertical' | 'horizontal'
    gap?: number
    className?: string
  }
  children?: UINode[]
}

export interface BoxNode extends BaseNode {
  type: 'Box'
  props?: {
    className?: string
  }
  children?: UINode[]
}

export interface HeadingNode extends BaseNode {
  type: 'Heading'
  props: {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    text: string
    className?: string
  }
}

export interface TextNode extends BaseNode {
  type: 'Text'
  props: {
    text: string
    className?: string
  }
}

export interface ButtonNode extends BaseNode {
  type: 'Button'
  props: {
    text: string
    variant?: 'primary' | 'secondary' | 'link'
    href?: string
    className?: string
  }
}

export interface InputNode extends BaseNode {
  type: 'Input'
  props: {
    placeholder?: string
    className?: string
  }
}

export interface ImageNode extends BaseNode {
  type: 'Image'
  props: {
    src: string
    alt?: string
    className?: string
  }
}

export interface ListNode extends BaseNode {
  type: 'List'
  props?: { ordered?: boolean; className?: string }
  children?: TextNode[]
}

export interface DividerNode extends BaseNode {
  type: 'Divider'
  props?: { className?: string }
}

export type ValidateUINodeResult = { ok: true; node: UINode } | { ok: false; error: string }

export function validateUINode(candidate: unknown): ValidateUINodeResult {
  try {
    const res = validateNode(candidate)
    if (!res) return { ok: false, error: 'Invalid node' }
    return { ok: true, node: res }
  } catch (e) {
    return { ok: false, error: 'Invalid node' }
  }
}

function validateNode(node: any): UINode | null {
  if (!node || typeof node !== 'object') return null
  switch (node.type) {
    case 'Stack':
      if (node.children && !Array.isArray(node.children)) return null
      return {
        type: 'Stack',
        props: sanitize(node.props, ['direction', 'gap', 'className']),
        children: Array.isArray(node.children) ? node.children.map(validateNode).filter(Boolean) as UINode[] : undefined,
      }
    case 'Box':
      return {
        type: 'Box',
        props: sanitize(node.props, ['className']),
        children: Array.isArray(node.children) ? node.children.map(validateNode).filter(Boolean) as UINode[] : undefined,
      }
    case 'Heading':
      if (!node.props || typeof node.props.text !== 'string') return null
      const lvl = node.props.level
      if (lvl !== undefined && ![1,2,3,4,5,6].includes(lvl)) return null
      return { type: 'Heading', props: sanitize(node.props, ['level', 'text', 'className']) }
    case 'Text':
      if (!node.props || typeof node.props.text !== 'string') return null
      return { type: 'Text', props: sanitize(node.props, ['text', 'className']) }
    case 'Button':
      if (!node.props || typeof node.props.text !== 'string') return null
      return { type: 'Button', props: sanitize(node.props, ['text', 'variant', 'href', 'className']) }
    case 'Input':
      return { type: 'Input', props: sanitize(node.props, ['placeholder', 'className']) }
    case 'Image':
      if (!node.props || typeof node.props.src !== 'string') return null
      return { type: 'Image', props: sanitize(node.props, ['src', 'alt', 'className']) }
    case 'List':
      if (node.children && !Array.isArray(node.children)) return null
      const children = Array.isArray(node.children) ? node.children.map(validateNode).filter((n): n is TextNode => !!n && n.type==='Text') : undefined
      return { type: 'List', props: sanitize(node.props, ['ordered', 'className']), children }
    case 'Divider':
      return { type: 'Divider', props: sanitize(node.props, ['className']) }
    default:
      return null
  }
}

function sanitize<T extends object>(obj: any, allowed: (keyof T | string)[]): any {
  const res: any = {}
  if (!obj || typeof obj !== 'object') return res
  for (const k of allowed) {
    if (k in obj) res[k as string] = obj[k as string]
  }
  return res
}

