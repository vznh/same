// models/frame – shared types for frame CRUD and AI actions

export type FrameType = 'text' | 'image' | 'browser' | 'custom'

export type FrameId = string

// Serializable representation (omits React.ReactNode content)
export interface FrameDTO {
  id: FrameId
  title: string
  x: number
  y: number
  width: number
  height: number
  type: FrameType
  zIndex: number
  isSelected: boolean
}

// Payloads
export interface CreateFramePayload {
  title: string
  x: number
  y: number
  width: number
  height: number
  frameType: FrameType
}

export type UpdateFramePayload = Partial<
  Pick<FrameDTO, 'title' | 'x' | 'y' | 'width' | 'height' | 'type'>
>

// Discriminated union of actions the AI can request
export type FrameAction =
  | { type: 'create'; payload: CreateFramePayload }
  | { type: 'update'; id: FrameId; updates: UpdateFramePayload }
  | { type: 'move'; id: FrameId; x: number; y: number }
  | { type: 'resize'; id: FrameId; width: number; height: number }
  | { type: 'bringToFront'; id: FrameId }
  | { type: 'sendToBack'; id: FrameId }
  | { type: 'select'; id: FrameId; multiSelect?: boolean }
  | { type: 'clearSelection' }
  | { type: 'delete'; id: FrameId }

export type ValidateActionResult =
  | { ok: true; action: FrameAction }
  | { ok: false; error: string }

// Runtime validator to safely accept untrusted input (e.g., LLM JSON)
export function validateFrameAction(candidate: unknown): ValidateActionResult {
  if (typeof candidate !== 'object' || candidate === null) {
    return { ok: false, error: 'Action must be an object' }
  }

  const c = candidate as Record<string, unknown>
  const actionType = c.type

  if (actionType === 'create') {
    const payload = c.payload as Record<string, unknown>
    if (!isObject(payload)) return fail('create.payload must be an object')
    const required = ['title', 'x', 'y', 'width', 'height', 'frameType'] as const
    for (const key of required) {
      if (!(key in payload)) return fail(`create.payload.${key} is required`)
    }
    if (
      !isString(payload.title) ||
      !isNumber(payload.x) ||
      !isNumber(payload.y) ||
      !isNumber(payload.width) ||
      !isNumber(payload.height) ||
      !isFrameType(payload.frameType)
    ) return fail('create.payload has invalid field types')
    return ok({ type: 'create', payload: payload as unknown as CreateFramePayload })
  }

  if (actionType === 'update') {
    const id = c.id
    const updates = c.updates as Record<string, unknown>
    if (!isString(id)) return fail('update.id must be a string')
    if (!isObject(updates)) return fail('update.updates must be an object')
    const allowedKeys = ['title', 'x', 'y', 'width', 'height', 'type']
    for (const key of Object.keys(updates)) {
      if (!allowedKeys.includes(key)) return fail(`update.updates.${key} is not allowed`)
    }
    if (updates.title !== undefined && !isString(updates.title)) return fail('update.updates.title must be string')
    if (updates.x !== undefined && !isNumber(updates.x)) return fail('update.updates.x must be number')
    if (updates.y !== undefined && !isNumber(updates.y)) return fail('update.updates.y must be number')
    if (updates.width !== undefined && !isNumber(updates.width)) return fail('update.updates.width must be number')
    if (updates.height !== undefined && !isNumber(updates.height)) return fail('update.updates.height must be number')
    if (updates.type !== undefined && !isFrameType(updates.type)) return fail('update.updates.type must be FrameType')
    return ok({ type: 'update', id: id as string, updates: updates as UpdateFramePayload })
  }

  if (actionType === 'move') {
    const { id, x, y } = c
    if (!isString(id)) return fail('move.id must be a string')
    if (!isNumber(x) || !isNumber(y)) return fail('move.x/move.y must be numbers')
    return ok({ type: 'move', id: id as string, x: x as number, y: y as number })
  }

  if (actionType === 'resize') {
    const { id, width, height } = c
    if (!isString(id)) return fail('resize.id must be a string')
    if (!isNumber(width) || !isNumber(height)) return fail('resize.width/resize.height must be numbers')
    return ok({ type: 'resize', id: id as string, width: width as number, height: height as number })
  }

  if (actionType === 'bringToFront') {
    const { id } = c
    if (!isString(id)) return fail('bringToFront.id must be a string')
    return ok({ type: 'bringToFront', id: id as string })
  }

  if (actionType === 'sendToBack') {
    const { id } = c
    if (!isString(id)) return fail('sendToBack.id must be a string')
    return ok({ type: 'sendToBack', id: id as string })
  }

  if (actionType === 'select') {
    const { id, multiSelect } = c
    if (!isString(id)) return fail('select.id must be a string')
    if (multiSelect !== undefined && typeof multiSelect !== 'boolean') return fail('select.multiSelect must be boolean')
    return ok({ type: 'select', id: id as string, multiSelect: multiSelect as boolean | undefined })
  }

  if (actionType === 'clearSelection') {
    return ok({ type: 'clearSelection' })
  }

  if (actionType === 'delete') {
    const { id } = c
    if (!isString(id)) return fail('delete.id must be a string')
    return ok({ type: 'delete', id: id as string })
  }

  return { ok: false, error: 'Unknown action type' }
}

// Helpers
function ok(action: FrameAction): ValidateActionResult {
  return { ok: true, action }
}

function fail(error: string): ValidateActionResult {
  return { ok: false, error }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isFrameType(value: unknown): value is FrameType {
  return value === 'text' || value === 'image' || value === 'browser' || value === 'custom'
}

