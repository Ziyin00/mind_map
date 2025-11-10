import { create } from 'zustand'
import type { Socket } from 'socket.io-client'
import type { UserCursor } from '../types'

export interface OnlineUser {
  user_id: string
  user_name: string
}

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  currentSessionId: number | null
  userId: string | null
  userName: string | null
  userCursors: Map<string, UserCursor>
  onlineUsers: OnlineUser[]
  setSocket: (socket: Socket | null) => void
  setConnected: (connected: boolean) => void
  setCurrentSession: (sessionId: number | null) => void
  setUser: (userId: string, userName: string) => void
  updateUserCursor: (userId: string, cursor: UserCursor) => void
  removeUserCursor: (userId: string) => void
  clearCursors: () => void
  addOnlineUser: (user: OnlineUser) => void
  removeOnlineUser: (userId: string) => void
  setOnlineUsers: (users: OnlineUser[]) => void
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  isConnected: false,
  currentSessionId: null,
  userId: null,
  userName: null,
  userCursors: new Map(),
  onlineUsers: [],
  
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  setUser: (userId, userName) => set({ userId, userName }),
  
  updateUserCursor: (userId, cursor) => set((state) => {
    const newCursors = new Map(state.userCursors)
    newCursors.set(userId, cursor)
    return { userCursors: newCursors }
  }),
  
  removeUserCursor: (userId) => set((state) => {
    const newCursors = new Map(state.userCursors)
    newCursors.delete(userId)
    return { userCursors: newCursors }
  }),
  
  clearCursors: () => set({ userCursors: new Map() }),
  
  addOnlineUser: (user) => set((state) => {
    const exists = state.onlineUsers.some(u => u.user_id === user.user_id)
    if (exists) return state
    return { onlineUsers: [...state.onlineUsers, user] }
  }),
  
  removeOnlineUser: (userId) => set((state) => ({
    onlineUsers: state.onlineUsers.filter(u => u.user_id !== userId)
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}))

