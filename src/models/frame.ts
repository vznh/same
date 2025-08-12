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
  placement?: Placement
}

export type UpdateFramePayload = Partial<
  Pick<FrameDTO, 'title' | 'x' | 'y' | 'width' | 'height' | 'type'>
>

// Discriminated union of actions the AI can request
export type FrameAction =
  | { type: 'create'; payload: CreateFramePayload }
  | { type: 'createMany'; payloads: CreateFramePayload[] }
  | { type: 'createAndConnect'; payloads: CreateFramePayload[]; pairs: { aIndex: number; bIndex: number }[] }
  | { type: 'update'; id: FrameId; updates: UpdateFramePayload }
  | { type: 'updateContent'; id: FrameId; content: unknown }
  | { type: 'updateData'; id: FrameId; data: Record<string, unknown> }
  | { type: 'move'; id: FrameId; x?: number; y?: number; placement?: Placement }
  | { type: 'resize'; id: FrameId; width: number; height: number }
  | { type: 'bringToFront'; id: FrameId }
  | { type: 'sendToBack'; id: FrameId }
  | { type: 'select'; id: FrameId; multiSelect?: boolean }
  | { type: 'clearSelection' }
  | { type: 'delete'; id: FrameId }
  | { type: 'selectMany'; ids: FrameId[] }
  | { type: 'deleteMany'; ids: FrameId[] }
  | { type: 'moveMany'; moves: ({ id: FrameId; x?: number; y?: number; placement?: Placement })[] }
  | { type: 'connect'; pairs: { a: FrameId; b: FrameId }[] }

export type Placement =
  | { type: 'viewportCenter' }
  | { type: 'relativeToFrame'; ref: { by: 'id' | 'title'; value: string }; align: 'rightOf' | 'leftOf' | 'above' | 'below' | 'center'; gap?: number }

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
      if ((key === 'x' || key === 'y') && 'placement' in payload) continue
      if (!(key in payload)) return fail(`create.payload.${key} is required`)
    }
    if (
      !isString(payload.title) ||
      ((payload.x === undefined || payload.y === undefined) && !isObject(payload.placement)) ||
      (payload.x !== undefined && !isNumber(payload.x)) ||
      (payload.y !== undefined && !isNumber(payload.y)) ||
      !isNumber(payload.width) ||
      !isNumber(payload.height) ||
      !isFrameType(payload.frameType)
    ) return fail('create.payload has invalid field types')
    if (payload.placement !== undefined && !isPlacement(payload.placement)) return fail('create.payload.placement invalid')
    return ok({ type: 'create', payload: payload as unknown as CreateFramePayload })
  }

  if (actionType === 'createMany') {
    const payloads = (c as any).payloads
    if (!Array.isArray(payloads) || payloads.length === 0) return fail('createMany.payloads must be non-empty array')
    for (const p of payloads) {
      if (!isObject(p)) return fail('createMany.payloads[i] must be object')
      const valid = validateFrameAction({ type: 'create', payload: p })
      if (!valid.ok) return fail(`createMany.payloads invalid: ${valid.error}`)
    }
    return ok({ type: 'createMany', payloads } as any)
  }

  if (actionType === 'createAndConnect') {
    const { payloads, pairs } = c as any
    if (!Array.isArray(payloads) || payloads.length === 0) return fail('createAndConnect.payloads must be non-empty array')
    for (const p of payloads) {
      if (!isObject(p)) return fail('createAndConnect.payloads[i] must be object')
      const valid = validateFrameAction({ type: 'create', payload: p })
      if (!valid.ok) return fail(`createAndConnect.payloads invalid: ${valid.error}`)
    }
    if (!Array.isArray(pairs)) return fail('createAndConnect.pairs must be array')
    for (const pr of pairs) {
      if (!isObject(pr) || !isNumber((pr as any).aIndex) || !isNumber((pr as any).bIndex)) return fail('createAndConnect.pairs[i] must have aIndex and bIndex numbers')
      if ((pr as any).aIndex < 0 || (pr as any).aIndex >= payloads.length) return fail('createAndConnect.pairs[i].aIndex out of range')
      if ((pr as any).bIndex < 0 || (pr as any).bIndex >= payloads.length) return fail('createAndConnect.pairs[i].bIndex out of range')
      if ((pr as any).aIndex === (pr as any).bIndex) return fail('createAndConnect cannot connect a frame to itself')
    }
    return ok({ type: 'createAndConnect', payloads, pairs } as any)
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

  if (actionType === 'updateContent') {
    const id = c.id
    if (!isString(id)) return fail('updateContent.id must be a string')
    return ok({ type: 'updateContent', id: id as string, content: (c as any).content })
  }

  if (actionType === 'updateData') {
    const id = c.id
    const data = (c as any).data
    if (!isString(id)) return fail('updateData.id must be a string')
    if (!isObject(data)) return fail('updateData.data must be an object')
    return ok({ type: 'updateData', id: id as string, data })
  }

  if (actionType === 'move') {
    const { id, x, y, placement } = c as any
    if (!isString(id)) return fail('move.id must be a string')
    if (placement !== undefined) {
      if (!isPlacement(placement)) return fail('move.placement invalid')
      return ok({ type: 'move', id: id as string, placement })
    }
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

  if (actionType === 'selectMany') {
    const { ids } = c
    if (!Array.isArray(ids) || ids.some(id => !isString(id))) return fail('selectMany.ids must be string[]')
    return ok({ type: 'selectMany', ids: ids as string[] })
  }

  if (actionType === 'deleteMany') {
    const { ids } = c
    if (!Array.isArray(ids) || ids.some(id => !isString(id))) return fail('deleteMany.ids must be string[]')
    return ok({ type: 'deleteMany', ids: ids as string[] })
  }

  if (actionType === 'moveMany') {
    const { moves } = c as any
    if (!Array.isArray(moves)) return fail('moveMany.moves must be array')
    for (const m of moves) {
      if (!isObject(m) || !isString((m as any).id)) return fail('moveMany.moves[i].id must be string')
      if ((m as any).placement !== undefined && !isPlacement((m as any).placement)) return fail('moveMany.moves[i].placement invalid')
      if ((m as any).placement === undefined && (!isNumber((m as any).x) || !isNumber((m as any).y))) return fail('moveMany.moves[i] must have x and y when placement is absent')
    }
    return ok({ type: 'moveMany', moves: moves as any })
  }

  if (actionType === 'connect') {
    const { pairs } = c as any
    if (!Array.isArray(pairs)) return fail('connect.pairs must be array')
    for (const p of pairs) {
      if (!isObject(p) || !isString((p as any).a) || !isString((p as any).b)) return fail('connect.pairs[i] must have a and b strings')
    }
    return ok({ type: 'connect', pairs: pairs as { a: string; b: string }[] })
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

function isPlacement(value: unknown): value is Placement {
  if (!isObject(value)) return false
  const t = (value as any).type
  if (t === 'viewportCenter') return true
  if (t === 'relativeToFrame') {
    const v = value as any
    const ref = v.ref
    if (!ref || (ref.by !== 'id' && ref.by !== 'title') || !isString(ref.value)) return false
    if (!['rightOf', 'leftOf', 'above', 'below', 'center'].includes(v.align)) return false
    if (v.gap !== undefined && !isNumber(v.gap)) return false
    return true
  }
  return false
}

