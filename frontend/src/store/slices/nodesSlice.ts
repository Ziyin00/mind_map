import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Node } from '../../types'

interface NodesState {
  nodes: Node[]
  selectedNodeId: number | null
}

const initialState: NodesState = {
  nodes: [],
  selectedNodeId: null,
}

const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload
    },
    addNode: (state, action: PayloadAction<Node>) => {
      state.nodes.push(action.payload)
    },
    updateNode: (state, action: PayloadAction<{ id: number; updates: Partial<Node> }>) => {
      const index = state.nodes.findIndex(n => n.id === action.payload.id)
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], ...action.payload.updates }
      }
    },
    deleteNode: (state, action: PayloadAction<number>) => {
      state.nodes = state.nodes.filter(n => n.id !== action.payload)
      if (state.selectedNodeId === action.payload) {
        state.selectedNodeId = null
      }
    },
    selectNode: (state, action: PayloadAction<number | null>) => {
      state.selectedNodeId = action.payload
    },
    moveNode: (state, action: PayloadAction<{ id: number; x: number; y: number }>) => {
      const node = state.nodes.find(n => n.id === action.payload.id)
      if (node) {
        node.x = action.payload.x
        node.y = action.payload.y
      }
    },
  },
})

export const { setNodes, addNode, updateNode, deleteNode, selectNode, moveNode } = nodesSlice.actions
export default nodesSlice.reducer

