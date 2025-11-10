import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Session } from '../../types'

interface SessionsState {
  sessions: Session[]
  currentSessionId: number | null
}

const initialState: SessionsState = {
  sessions: [],
  currentSessionId: null,
}

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.push(action.payload)
    },
    setCurrentSession: (state, action: PayloadAction<number | null>) => {
      state.currentSessionId = action.payload
    },
    updateSession: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.id)
      if (session) {
        session.title = action.payload.title
      }
    },
    deleteSession: (state, action: PayloadAction<number>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload)
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = null
      }
    },
  },
})

export const { setSessions, addSession, setCurrentSession, updateSession, deleteSession } = sessionsSlice.actions
export default sessionsSlice.reducer

