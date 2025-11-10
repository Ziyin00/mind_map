import { configureStore } from '@reduxjs/toolkit'
import nodesReducer from './slices/nodesSlice'
import edgesReducer from './slices/edgesSlice'
import sessionsReducer from './slices/sessionsSlice'

export const store = configureStore({
  reducer: {
    nodes: nodesReducer,
    edges: edgesReducer,
    sessions: sessionsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

