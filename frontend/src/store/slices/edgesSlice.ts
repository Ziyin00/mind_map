import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Edge } from '../../types'

interface EdgesState {
  edges: Edge[]
}

const initialState: EdgesState = {
  edges: [],
}

const edgesSlice = createSlice({
  name: 'edges',
  initialState,
  reducers: {
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload
    },
    addEdge: (state, action: PayloadAction<Edge>) => {
      state.edges.push(action.payload)
    },
    deleteEdge: (state, action: PayloadAction<number>) => {
      state.edges = state.edges.filter(e => e.id !== action.payload)
    },
    deleteEdgesByNode: (state, action: PayloadAction<number>) => {
      state.edges = state.edges.filter(
        e => e.source_id !== action.payload && e.target_id !== action.payload
      )
    },
  },
})

export const { setEdges, addEdge, deleteEdge, deleteEdgesByNode } = edgesSlice.actions
export default edgesSlice.reducer

