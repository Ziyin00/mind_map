import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { useSocketStore } from '../store/socketStore'
import type { Node, Edge } from '../types'
import {
  setNodes,
  addNode as addNodeAction,
  updateNode as updateNodeAction,
  deleteNode as deleteNodeAction,
} from '../store/slices/nodesSlice'
import {
  setEdges,
  addEdge as addEdgeAction,
  deleteEdge as deleteEdgeAction,
  deleteEdgesByNode,
} from '../store/slices/edgesSlice'

export const useMindMapCRUD = () => {
  const dispatch = useAppDispatch()
  const { socket, currentSessionId } = useSocketStore()
  const nodes = useAppSelector((state) => state.nodes.nodes)
  const edges = useAppSelector((state) => state.edges.edges)

  // Initialize state from server
  const initializeState = useCallback(
    (state: { nodes: Node[]; edges: Edge[] }) => {
      dispatch(setNodes(state.nodes))
      dispatch(setEdges(state.edges))
    },
    [dispatch]
  )

  // Node CRUD
  const createNode = useCallback(
    (nodeData: Partial<Node>) => {
      if (!socket || !currentSessionId) return

      const payload = {
        content: nodeData.content || 'New Node',
        x: nodeData.x || 400,
        y: nodeData.y || 300,
        width: nodeData.width || 200,
        height: nodeData.height || 100,
        style: nodeData.style || {},
      }

      socket.emit('node_create', {
        session_id: currentSessionId,
        node: payload,
      })
    },
    [socket, currentSessionId]
  )

  const updateNode = useCallback(
    (nodeId: number, updates: Partial<Node>) => {
      if (!socket || !currentSessionId) return

      socket.emit('node_update', {
        session_id: currentSessionId,
        node_id: nodeId,
        patch: updates,
      })
    },
    [socket, currentSessionId]
  )

  const deleteNode = useCallback(
    (nodeId: number) => {
      if (!socket || !currentSessionId) return

      socket.emit('node_delete', {
        session_id: currentSessionId,
        node_id: nodeId,
      })
    },
    [socket, currentSessionId]
  )

  // Edge CRUD
  const createEdge = useCallback(
    (sourceId: number, targetId: number) => {
      if (!socket || !currentSessionId) return

      socket.emit('edge_create', {
        session_id: currentSessionId,
        edge: {
          source_id: sourceId,
          target_id: targetId,
        },
      })
    },
    [socket, currentSessionId]
  )

  const deleteEdge = useCallback(
    (edgeId: number) => {
      if (!socket || !currentSessionId) return

      socket.emit('edge_delete', {
        session_id: currentSessionId,
        edge_id: edgeId,
      })
    },
    [socket, currentSessionId]
  )

  // Socket event handlers (to be called from component)
  const handleNodeCreated = useCallback(
    (node: Node) => {
      dispatch(addNodeAction(node))
    },
    [dispatch]
  )

  const handleNodeUpdated = useCallback(
    (node: Node) => {
      dispatch(updateNodeAction({ id: node.id, updates: node }))
    },
    [dispatch]
  )

  const handleNodeDeleted = useCallback(
    (nodeId: number) => {
      dispatch(deleteNodeAction(nodeId))
      // Also delete all edges connected to this node
      dispatch(deleteEdgesByNode(nodeId))
    },
    [dispatch]
  )

  const handleEdgeCreated = useCallback(
    (edge: Edge) => {
      dispatch(addEdgeAction(edge))
    },
    [dispatch]
  )

  const handleEdgeDeleted = useCallback(
    (edgeId: number) => {
      dispatch(deleteEdgeAction(edgeId))
    },
    [dispatch]
  )

  return {
    nodes,
    edges,
    initializeState,
    createNode,
    updateNode,
    deleteNode,
    createEdge,
    deleteEdge,
    handleNodeCreated,
    handleNodeUpdated,
    handleNodeDeleted,
    handleEdgeCreated,
    handleEdgeDeleted,
  }
}

