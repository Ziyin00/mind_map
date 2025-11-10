import React, { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { useSocketStore } from './store/socketStore'
import { useMindMapCRUD } from './hooks/useMindMapCRUD'
import { selectNode } from './store/slices/nodesSlice'
import { NodeComponent } from './components/NodeComponent'
import { EdgeComponent } from './components/EdgeComponent'
import { Modal } from './components/Modal'
import { ToastContainer } from './components/Toast'
import { ProfileSidebar } from './components/ProfileSidebar'
import { useToastStore } from './store/toastStore'
import { Plus, Link2, Wifi, WifiOff, User, Sparkles, Trash2 } from 'lucide-react'
import type { Node, Edge } from './types'

export default function MindMap() {
  const dispatch = useAppDispatch()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<number | null>(null)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  
  const { toasts, removeToast } = useToastStore()
  const addToast = useToastStore((state) => state.addToast)

  const nodes = useAppSelector((state) => state.nodes.nodes)
  const edges = useAppSelector((state) => state.edges.edges)
  const selectedNodeId = useAppSelector((state) => state.nodes.selectedNodeId)

  const {
    isConnected,
    userName,
    userId,
    setSocket,
    setConnected,
    setCurrentSession,
    setUser,
    onlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setOnlineUsers,
  } = useSocketStore()

  const {
    initializeState,
    createNode,
    updateNode,
    deleteNode,
    createEdge,
    handleNodeCreated,
    handleNodeUpdated,
    handleNodeDeleted,
    handleEdgeCreated,
    handleEdgeDeleted,
  } = useMindMapCRUD()

  // Initialize Socket.IO
  useEffect(() => {
    let socketInstance: ReturnType<typeof io> | null = null
    
    try {
      setIsInitializing(true)
      setError(null)
      
      const sessionId = 1 // TODO: Get from URL or props
      const userId = `user_${Date.now()}`
      
      // Use localStorage for name or prompt
      const savedName = localStorage.getItem('mindmap_user_name')
      let userName = savedName
      
      if (!userName) {
        userName = prompt('Enter your name:') || 'Anonymous'
        localStorage.setItem('mindmap_user_name', userName)
      }

      setUser(userId, userName)
      setCurrentSession(sessionId)

      socketInstance = io('http://localhost:8000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      setSocket(socketInstance)

      socketInstance.on('connect', () => {
        setConnected(true)
        setIsInitializing(false)
        addToast('Connected to server', 'success')
        socketInstance?.emit('join_session', {
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
        })
        // Add current user to online users
        addOnlineUser({ user_id: userId, user_name: userName })
      })

      socketInstance.on('connect_error', (err) => {
        console.error('Connection error:', err)
        setError('Failed to connect to server. Make sure the backend is running on http://localhost:8000')
        setIsInitializing(false)
        addToast('Connection failed', 'error', 5000)
      })

      socketInstance.on('disconnect', () => {
        setConnected(false)
        addToast('Disconnected from server', 'warning')
      })

      socketInstance.on('initial_state', (state: { nodes: Node[]; edges: Edge[] }) => {
        console.log('📦 Received initial state:', state)
        if (state && (state.nodes || state.edges)) {
          initializeState({
            nodes: state.nodes || [],
            edges: state.edges || []
          })
        }
        setIsInitializing(false)
      })

      socketInstance.on('user_joined', (data: { user_id: string; user_name: string }) => {
        addOnlineUser({ user_id: data.user_id, user_name: data.user_name })
        if (data.user_id !== userId) {
          addToast(`${data.user_name} joined the session`, 'info', 2000)
        }
      })

      socketInstance.on('node_created', ({ node }: { node: Node }) => {
        handleNodeCreated(node)
        addToast('New node created by another user', 'info')
      })

      socketInstance.on('node_updated', ({ node }: { node: Node }) => {
        handleNodeUpdated(node)
      })

      socketInstance.on('node_deleted', ({ node_id }: { node_id: number }) => {
        handleNodeDeleted(node_id)
        addToast('Node deleted by another user', 'warning')
      })

      socketInstance.on('edge_created', ({ edge }: { edge: Edge }) => {
        handleEdgeCreated(edge)
        addToast('New connection created', 'info')
      })

      socketInstance.on('edge_deleted', ({ edge_id }: { edge_id: number }) => {
        handleEdgeDeleted(edge_id)
      })

      socketInstance.on('error', ({ message }: { message: string }) => {
        console.error('Socket.IO error:', message)
        setError(message)
        addToast(message, 'error', 5000)
      })

      return () => {
        if (socketInstance) {
          socketInstance.disconnect()
        }
        setSocket(null)
        setConnected(false)
      }
    } catch (err) {
      console.error('Error initializing:', err)
      setError('Failed to initialize. Please refresh the page.')
      setIsInitializing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Canvas dragging
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - viewportOffset.x, y: e.clientY - viewportOffset.y })
      dispatch(selectNode(null))
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewportOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  // Node dragging
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    const startX = e.clientX
    const startY = e.clientY
    const startNodeX = node.x
    const startNodeY = node.y

    const onMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      updateNode(nodeId, {
        x: startNodeX + dx,
        y: startNodeY + dy,
      })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Node CRUD
  const handleCreateNode = () => {
    const x = 400 + viewportOffset.x
    const y = 300 + viewportOffset.y
    createNode({ x, y, content: '' })
    addToast('Node created successfully', 'success')
  }

  const handleUpdateNode = (id: number, updates: Partial<Node>) => {
    updateNode(id, updates)
    if (updates.content !== undefined) {
      addToast('Node updated', 'info', 2000)
    }
  }

  const handleDeleteNode = (id: number) => {
    deleteNode(id)
    dispatch(selectNode(null))
    addToast('Node deleted', 'success')
  }

  const handleDeleteClick = (id: number) => {
    setNodeToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (nodeToDelete) {
      handleDeleteNode(nodeToDelete)
      setNodeToDelete(null)
    }
  }

  const handleSelectNode = (id: number) => {
    dispatch(selectNode(id))
  }

  // Edge creation
  const handleNodeClick = (nodeId: number) => {
    if (connectingFrom === null) {
      setConnectingFrom(nodeId)
      addToast('Select another node to connect', 'info', 2000)
    } else if (connectingFrom !== nodeId) {
      createEdge(connectingFrom, nodeId)
      setConnectingFrom(null)
      addToast('Nodes connected', 'success')
    }
  }

  // Get node by ID helper
  const getNodeById = (id: number) => nodes.find((n) => n.id === id)

  // Show loading or error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 via-transparent to-orange-50/20 animate-gradient-shift pointer-events-none"></div>
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md border-2 border-red-200/50 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border-2 border-red-300/50 shadow-lg">
              <WifiOff className="text-red-600" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connection Error</h2>
              <p className="text-xs text-gray-500 mt-1">Unable to reach server</p>
            </div>
          </div>
          <p className="text-gray-600 mb-7 text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-5 py-3 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-800 hover:via-slate-900 hover:to-black transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-2xl active:scale-95 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10">Retry Connection</span>
          </button>
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 animate-gradient-shift pointer-events-none"></div>
        <div className="text-center relative z-10">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700"></div>
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-slate-700 animate-pulse" size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-gray-700 font-semibold text-base mb-1">Connecting...</p>
          <p className="text-gray-500 text-sm">Setting up your workspace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 animate-gradient-shift pointer-events-none"></div>
      
      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 shadow-lg relative z-10 px-6 py-4 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-1 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Sparkles className="text-white group-hover:text-blue-200 transition-colors" size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">MindMap</span>
        </div>

        <div className="h-7 w-px bg-gray-200 mx-1" />

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreateNode}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-800 hover:via-slate-900 hover:to-black transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-2xl hover:shadow-slate-900/30 active:scale-95 relative overflow-hidden"
            title="Add a new node"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <Plus size={17} strokeWidth={3} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Add Node</span>
          </button>
          
          <button
            onClick={() => setConnectingFrom(connectingFrom ? null : selectedNodeId || null)}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold relative overflow-hidden ${
              connectingFrom
                ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/50 hover:border-gray-300 active:scale-95'
            }`}
            disabled={!selectedNodeId && !connectingFrom}
            title={connectingFrom ? 'Cancel linking mode' : 'Link two nodes together'}
          >
            {connectingFrom && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
            <Link2 size={17} strokeWidth={3} className={`relative z-10 ${connectingFrom ? 'group-hover:rotate-180 transition-transform duration-500' : ''}`} />
            <span className="relative z-10">{connectingFrom ? 'Cancel' : 'Link'}</span>
          </button>

          {selectedNodeId && (
            <button
              onClick={() => handleDeleteClick(selectedNodeId)}
              className="group flex items-center gap-1.5 px-3.5 py-2.5 text-red-600 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 rounded-xl transition-all duration-300 border border-red-100 hover:border-red-300 hover:shadow-lg active:scale-95"
              title="Delete selected node"
            >
              <Trash2 size={16} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Status & User Info */}
        <div className="ml-auto flex items-center gap-3">
          <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-sm ${
            isConnected 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-300/50 shadow-sm hover:shadow-md' 
              : 'bg-gradient-to-br from-red-50 to-red-100/80 text-red-700 border border-red-300/50 shadow-sm'
          }`}>
            {isConnected ? (
              <div className="relative">
                <Wifi size={15} className="text-emerald-600 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
              </div>
            ) : (
              <WifiOff size={15} className="text-red-600" />
            )}
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          
          {userName && (
            <button
              onClick={() => setShowProfileSidebar(true)}
              className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-br from-gray-50 to-gray-100/80 rounded-xl text-xs text-gray-700 border border-gray-200/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200/80 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="font-semibold">{userName}</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing canvas-bg relative z-0"
        style={{ 
          minHeight: '400px'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* Edges Layer */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px)`,
            width: '100%',
            height: '100%',
          }}
        >
          {edges.map((edge) => (
            <EdgeComponent
              key={edge.id}
              edge={edge}
              sourceNode={getNodeById(edge.source_id)}
              targetNode={getNodeById(edge.target_id)}
            />
          ))}
        </div>

        {/* Nodes Layer */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px)`,
            width: '100%',
            height: '100%',
          }}
        >
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => {
                handleSelectNode(node.id)
                if (connectingFrom) {
                  handleNodeClick(node.id)
                }
              }}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteClick}
              onDragStart={handleNodeDragStart}
            />
          ))}
        </div>

        {/* Empty state */}
        {nodes.length === 0 && edges.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center shadow-2xl border-2 border-white/50 animate-pulse-slow"></div>
                <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-inner">
                  <Plus className="text-slate-600" size={32} strokeWidth={2.5} />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl animate-pulse-slow"></div>
              </div>
              <p className="text-gray-700 font-bold mb-2 text-lg bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Start your mind map</p>
              <p className="text-sm text-gray-500">Click "Add Node" to create your first node</p>
              <div className="mt-4 flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Connecting indicator */}
        {connectingFrom && (
          <div className="absolute top-6 left-6 bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 border-2 border-amber-300/60 text-amber-900 px-5 py-3 rounded-xl text-sm z-50 shadow-2xl backdrop-blur-md animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-75"></div>
              </div>
              <span className="font-semibold">Select another node to connect</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setNodeToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Node"
        message="Are you sure you want to delete this node? This action cannot be undone."
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        onlineUsers={onlineUsers}
      />
    </div>
  )
}

