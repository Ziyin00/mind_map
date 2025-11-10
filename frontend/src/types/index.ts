export type Node = {
  id: number
  session_id: number
  content: string
  x: number
  y: number
  width: number
  height: number
  style: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export type Edge = {
  id: number
  session_id: number
  source_id: number
  target_id: number
  created_at: string
}

export type Session = {
  id: number
  title: string
  created_at: string
  updated_at?: string
}

export type SessionState = {
  nodes: Node[]
  edges: Edge[]
}

export type UserCursor = {
  user_id: string
  user_name: string
  x: number
  y: number
}

