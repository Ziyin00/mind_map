# Real-Time Collaborative Mind Mapping System - Complete Explanation

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Redux     │  │   Zustand     │  │   React Hooks    │  │
│  │   Store     │  │   Socket Store│  │   & Components   │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │            │
│         └─────────────────┴────────────────────┘            │
│                             │                                │
│                    Socket.IO Client                          │
└─────────────────────────────┼────────────────────────────────┘
                              │
                    WebSocket Connection
                              │
┌─────────────────────────────┼────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Socket.IO  │  │   FastAPI    │  │   CRUD Functions │  │
│  │   Server    │  │   REST API   │  │   (async)        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │            │
│         └─────────────────┴────────────────────┘            │
│                             │                                │
│                    SQLAlchemy (Async)                        │
└─────────────────────────────┼────────────────────────────────┘
                              │
                    PostgreSQL Database
```

---

## 📊 Step 1: Database Layer (Foundation)

### Database Schema

**Location:** `backend/models.py`

The system uses 3 main tables:

#### 1. **Sessions Table**

```python
- id: Primary key
- title: Session name
- created_at: Timestamp
- updated_at: Timestamp
```

**Purpose:** Each mind map is a "session" that can have multiple users collaborating.

#### 2. **Nodes Table**

```python
- id: Primary key
- session_id: Foreign key → Sessions
- content: Text content of the node
- x, y: Position on canvas
- width, height: Node dimensions
- style: JSON object for styling
- created_at, updated_at: Timestamps
```

**Purpose:** Represents individual mind map nodes (the boxes/cards).

#### 3. **Edges Table**

```python
- id: Primary key
- session_id: Foreign key → Sessions
- source_id: Foreign key → Nodes (the "from" node)
- target_id: Foreign key → Nodes (the "to" node)
- created_at: Timestamp
```

**Purpose:** Represents connections/links between nodes (arrows).

**Key Relationships:**

- When a **Session** is deleted → All **Nodes** and **Edges** are deleted (CASCADE)
- When a **Node** is deleted → All connected **Edges** are deleted (CASCADE)
- Each **Edge** must have both source and target nodes

---

## 🔧 Step 2: Backend Layer - Database Connection

### Database Setup (`backend/database.py`)

```python
DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/mindmap_db"
```

**Key Components:**

1. **AsyncEngine**: Creates connection pool to PostgreSQL
2. **AsyncSessionLocal**: Factory for creating database sessions
3. **Base**: Base class for all SQLAlchemy models

**Why Async?**

- Handles multiple concurrent requests efficiently
- Non-blocking I/O operations
- Better performance for real-time applications

---

## 🗄️ Step 3: Backend Layer - CRUD Operations

### CRUD Functions (`backend/crud.py`)

**Session Operations:**

- `create_session()` - Create new mind map session
- `get_session()` - Retrieve session by ID
- `get_all_sessions()` - List all sessions

**Node Operations:**

- `create_node()` - Add new node to session
- `get_node()` - Get node by ID
- `get_nodes_by_session()` - Get all nodes in a session
- `update_node_partial()` - Update node properties (position, content, etc.)
- `delete_node()` - Remove node (automatically deletes connected edges)

**Edge Operations:**

- `create_edge()` - Create connection between two nodes
- `get_edge()` - Get edge by ID
- `get_edges_by_session()` - Get all edges in a session
- `delete_edge()` - Remove edge
- `delete_edges_by_node()` - Remove all edges connected to a node

**State Management:**

- `get_session_state()` - Get complete state (all nodes + edges) for a session

**How It Works:**

1. All functions are `async` - they use `await` for database operations
2. Each function uses `AsyncSession` from database
3. Changes are committed with `await db.commit()`
4. Data is refreshed with `await db.refresh()` to get updated values

---

## 🚀 Step 4: Backend Layer - REST API

### FastAPI Endpoints (`backend/main.py`)

**Health Check:**

- `GET /` - API information
- `GET /health` - Health status

**Session Management:**

- `POST /api/sessions` - Create new session

  ```json
  Request: { "title": "My Mind Map" }
  Response: { "id": 1, "title": "My Mind Map", "created_at": "..." }
  ```

- `GET /api/sessions` - List all sessions
- `GET /api/sessions/{id}` - Get specific session

**Purpose:** Provides HTTP API for session management (useful for admin, external tools, etc.)

---

## 🔌 Step 5: Backend Layer - Socket.IO Server

### Socket.IO Setup (`backend/main.py`)

**Initialization:**

```python
sio = AsyncServer(async_mode='asgi', cors_allowed_origins='*')
asgi_app = ASGIApp(sio, other_asgi_app=app)
```

**Connection Events:**

1. **`connect`** - When a client connects

   - Logs connection
   - Ready to receive events

2. **`disconnect`** - When a client disconnects
   - Logs disconnection
   - Cleanup happens automatically

**Session Management:**

3. **`join_session`** - Client joins a mind map session

   ```
   Client sends: { session_id, user_id, user_name }
   Server:
     1. Validates session exists
     2. Adds client to session room
     3. Sends initial_state (all nodes + edges)
     4. Notifies other users in room
   ```

4. **`leave_session`** - Client leaves session
   ```
   Client sends: { session_id }
   Server: Removes client from session room
   ```

**Node Operations:**

5. **`node_create`** - Create new node

   ```
   Client sends: { session_id, node: { content, x, y, width, height, style } }
   Server:
     1. Validates session
     2. Creates node in database
     3. Broadcasts 'node_created' to all clients in session room
   ```

6. **`node_update`** - Update node (position, content, etc.)

   ```
   Client sends: { session_id, node_id, patch: { x, y, content, ... } }
   Server:
     1. Validates node exists and belongs to session
     2. Updates node in database
     3. Broadcasts 'node_updated' to all clients
   ```

7. **`node_delete`** - Delete node
   ```
   Client sends: { session_id, node_id }
   Server:
     1. Validates node exists
     2. Deletes node (cascade deletes edges)
     3. Broadcasts 'node_deleted' to all clients
   ```

**Edge Operations:**

8. **`edge_create`** - Create connection between nodes

   ```
   Client sends: { session_id, edge: { source_id, target_id } }
   Server:
     1. Validates both nodes exist in session
     2. Checks for duplicate edges
     3. Creates edge in database
     4. Broadcasts 'edge_created' to all clients
   ```

9. **`edge_delete`** - Remove connection
   ```
   Client sends: { session_id, edge_id }
   Server:
     1. Validates edge exists
     2. Deletes edge
     3. Broadcasts 'edge_deleted' to all clients
   ```

**Real-time Collaboration:**

10. **`cursor_move`** - Track user cursor (optional feature)
    ```
    Client sends: { session_id, user_id, user_name, x, y }
    Server: Broadcasts to other users in session
    ```

**Key Concepts:**

- **Rooms**: Socket.IO uses "rooms" to group clients. Each session has its own room: `session_{session_id}`
- **Broadcasting**: When an event happens, server broadcasts to all clients in the room (except sender if using `skip_sid`)
- **Error Handling**: All events have try-catch blocks and emit error messages to clients

---

## 🎨 Step 6: Frontend Layer - State Management

### Redux Store (`frontend/src/store/`)

**Structure:**

```
store/
├── store.ts          # Main store configuration
├── hooks.ts          # Typed hooks (useAppDispatch, useAppSelector)
├── slices/
│   ├── nodesSlice.ts # Node state management
│   ├── edgesSlice.ts # Edge state management
│   └── sessionsSlice.ts # Session state management
└── socketStore.ts    # Zustand store for Socket.IO
```

**Redux Slices:**

1. **Nodes Slice** (`nodesSlice.ts`)

   ```typescript
   State: {
     nodes: Node[]          // Array of all nodes
     selectedNodeId: number | null  // Currently selected node
   }

   Actions:
   - setNodes(nodes)        // Initialize/replace all nodes
   - addNode(node)          // Add new node
   - updateNode({id, updates}) // Update node properties
   - deleteNode(nodeId)     // Remove node
   - selectNode(nodeId)     // Select/deselect node
   ```

2. **Edges Slice** (`edgesSlice.ts`)

   ```typescript
   State: {
     edges: Edge[]  // Array of all edges
   }

   Actions:
   - setEdges(edges)        // Initialize/replace all edges
   - addEdge(edge)          // Add new edge
   - deleteEdge(edgeId)     // Remove edge
   - deleteEdgesByNode(nodeId) // Remove all edges connected to node
   ```

**Zustand Store** (`socketStore.ts`)

```typescript
State: {
  socket: Socket | null; // Socket.IO client instance
  isConnected: boolean; // Connection status
  currentSessionId: number | null; // Active session ID
  userId: string | null; // Current user ID
  userName: string | null; // Current user name
  userCursors: Map<string, UserCursor>; // Other users' cursors
}
```

**Why Two Stores?**

- **Redux**: For complex state with time-travel debugging, middleware support
- **Zustand**: For simple Socket.IO connection state (lighter, easier to use)

---

## 🎣 Step 7: Frontend Layer - CRUD Hook

### useMindMapCRUD Hook (`frontend/src/hooks/useMindMapCRUD.ts`)

**Purpose:** Centralized hook that handles all CRUD operations and Socket.IO communication.

**Functions:**

1. **`initializeState({ nodes, edges })`**

   - Called when receiving initial state from server
   - Dispatches `setNodes` and `setEdges` to Redux

2. **`createNode(nodeData)`**

   - Emits `node_create` event to server
   - Server broadcasts to all clients
   - Other clients receive `node_created` event

3. **`updateNode(nodeId, updates)`**

   - Emits `node_update` event
   - Used when dragging nodes or editing content

4. **`deleteNode(nodeId)`**

   - Emits `node_delete` event
   - Also removes connected edges from Redux store

5. **`createEdge(sourceId, targetId)`**

   - Emits `edge_create` event
   - Creates connection between two nodes

6. **`deleteEdge(edgeId)`**
   - Emits `edge_delete` event

**Event Handlers (called when receiving server events):**

- `handleNodeCreated(node)` - Adds node to Redux
- `handleNodeUpdated(node)` - Updates node in Redux
- `handleNodeDeleted(nodeId)` - Removes node and connected edges
- `handleEdgeCreated(edge)` - Adds edge to Redux
- `handleEdgeDeleted(edgeId)` - Removes edge from Redux

---

## 🖼️ Step 8: Frontend Layer - Main Component

### MindMap Component (`frontend/src/MindMap.tsx`)

**Component Structure:**

```
MindMap
├── Toolbar (Top)
│   ├── Add Node button
│   ├── Create Link button
│   ├── Connection status
│   └── User name
│
└── Canvas (Main area)
    ├── Edges Layer (SVG lines)
    ├── Nodes Layer (Interactive nodes)
    ├── Empty state message
    └── Connecting indicator
```

**State Management:**

```typescript
Local State:
- viewportOffset: { x, y }      // Canvas scroll position
- isDragging: boolean            // Canvas dragging state
- connectingFrom: number | null   // Node ID when creating link
- isInitializing: boolean        // Loading state
- error: string | null           // Error message

Redux State (via hooks):
- nodes: Node[]                  // From nodesSlice
- edges: Edge[]                  // From edgesSlice
- selectedNodeId: number | null  // From nodesSlice

Zustand State:
- isConnected: boolean           // Socket.IO connection
- userName: string               // Current user
```

**Lifecycle:**

1. **Component Mounts**

   ```typescript
   useEffect(() => {
     // 1. Get user name from localStorage or prompt
     // 2. Create Socket.IO connection
     // 3. Set up event listeners
     // 4. Emit 'join_session'
     // 5. Receive 'initial_state' and populate Redux
   }, []);
   ```

2. **User Interactions:**

   **Add Node:**

   - Click "Add Node" button
   - Calls `createNode()` from hook
   - Hook emits `node_create` to server
   - Server broadcasts to all clients
   - All clients (including sender) receive `node_created`
   - Hook calls `handleNodeCreated()` → Redux updated
   - Component re-renders with new node

   **Drag Node:**

   - Mouse down on node → `handleNodeDragStart()`
   - Mouse move → `updateNode()` called repeatedly
   - Each update emits `node_update` to server
   - Server broadcasts to all clients
   - All clients see node moving in real-time

   **Edit Node:**

   - Double-click node → Edit mode
   - Type content → Local state updated
   - Blur/Enter → `updateNode()` called
   - Server broadcasts update

   **Delete Node:**

   - Click delete button (X) on selected node
   - Confirm dialog
   - `deleteNode()` called
   - Server deletes node and connected edges
   - Broadcasts `node_deleted` to all clients
   - Frontend removes node and edges from Redux

   **Create Edge:**

   - Click "Create Link" button
   - Click first node → `connectingFrom` set
   - Click second node → `createEdge()` called
   - Server validates and creates edge
   - Broadcasts to all clients

   **Canvas Dragging:**

   - Mouse down on empty canvas
   - Mouse move → Update `viewportOffset`
   - All nodes/edges move visually (CSS transform)
   - No server communication needed (local UI state)

---

## 🔄 Step 9: Complete Data Flow Example

### Example: User Creates a Node

```
1. USER ACTION
   User clicks "Add Node" button
   ↓

2. FRONTEND - Component
   handleCreateNode() called
   ↓

3. FRONTEND - Hook
   useMindMapCRUD.createNode({ x, y, content })
   ↓

4. FRONTEND - Socket.IO Client
   socket.emit('node_create', {
     session_id: 1,
     node: { content: 'New Node', x: 400, y: 300, ... }
   })
   ↓

5. NETWORK - WebSocket
   Message sent over WebSocket connection
   ↓

6. BACKEND - Socket.IO Server
   @sio.event node_create handler receives event
   ↓

7. BACKEND - Validation
   - Check session exists
   - Validate node data
   ↓

8. BACKEND - Database
   crud.create_node(db, session_id, node_data)
   - SQL: INSERT INTO nodes ...
   - COMMIT transaction
   ↓

9. BACKEND - Broadcast
   sio.emit('node_created', { node: node_data }, room='session_1')
   ↓

10. NETWORK - WebSocket
    Message broadcasted to all clients in session_1 room
    ↓

11. FRONTEND - All Clients (including sender)
    socket.on('node_created', ({ node }) => { ... })
    ↓

12. FRONTEND - Hook Handler
    handleNodeCreated(node) called
    ↓

13. FRONTEND - Redux
    dispatch(addNodeAction(node))
    Redux state updated: nodes = [...nodes, newNode]
    ↓

14. FRONTEND - React
    Component re-renders (because Redux state changed)
    ↓

15. UI UPDATE
    New node appears on canvas for all users
```

---

## 🌐 Step 10: Real-Time Collaboration Flow

### Multiple Users Scenario

**User A and User B both in Session 1:**

```
User A Actions:
1. Creates Node 1 → Server broadcasts → User B sees Node 1 appear
2. Moves Node 1 → Server broadcasts → User B sees Node 1 move
3. Creates Node 2 → Server broadcasts → User B sees Node 2 appear

User B Actions:
1. Creates Edge between Node 1 and Node 2
   → Server validates both nodes exist
   → Server broadcasts → User A sees edge appear
2. Edits Node 1 content
   → Server broadcasts → User A sees content update

Both users see real-time updates because:
- Each action emits Socket.IO event
- Server broadcasts to all clients in session room
- All clients update their Redux state
- React re-renders components
```

**Room Management:**

```python
# When user joins session
room = f'session_{session_id}'  # e.g., "session_1"
sio.enter_room(sid, room)

# When broadcasting
await sio.emit('node_created', data, room=room)
# All clients in room receive the event
```

---

## 🎯 Step 11: Key Design Patterns

### 1. **Single Source of Truth**

- Database is the ultimate source of truth
- All operations go through backend
- Frontend Redux stores are "caches" of server state

### 2. **Optimistic Updates**

- Frontend updates immediately (for responsiveness)
- Server validates and broadcasts
- If server rejects, frontend receives error

### 3. **Event-Driven Architecture**

- All real-time updates use Socket.IO events
- Decoupled: Frontend doesn't need to know about other clients
- Scalable: Server manages all coordination

### 4. **Separation of Concerns**

- **Backend**: Data validation, persistence, coordination
- **Frontend**: UI, user interactions, local state
- **Socket.IO**: Real-time communication layer

### 5. **Error Handling**

- Try-catch blocks in all backend handlers
- Error events sent to clients
- Frontend shows error messages
- Loading states during operations

---

## 🔐 Step 12: Security & Validation

**Backend Validation:**

- Session existence checked before operations
- Node/edge ownership verified (belongs to session)
- Duplicate edge prevention
- Foreign key constraints in database

**Frontend Validation:**

- Socket connection checked before operations
- Session ID required for all operations
- User confirmation for destructive actions

---

## 📦 Step 13: File Structure Summary

```
MindMap/
├── backend/
│   ├── main.py           # FastAPI app + Socket.IO handlers
│   ├── models.py         # Database models (Session, Node, Edge)
│   ├── schemas.py        # Pydantic schemas (validation)
│   ├── crud.py           # Database CRUD operations
│   ├── database.py       # Database connection setup
│   ├── requirements.txt  # Python dependencies
│   └── .env              # Environment variables
│
└── frontend/
    ├── src/
    │   ├── MindMap.tsx           # Main component
    │   ├── App.tsx               # App wrapper
    │   ├── main.tsx              # Entry point
    │   ├── components/
    │   │   ├── NodeComponent.tsx # Node UI
    │   │   ├── EdgeComponent.tsx # Edge UI
    │   │   └── ErrorBoundary.tsx # Error handling
    │   ├── hooks/
    │   │   └── useMindMapCRUD.ts # CRUD operations hook
    │   ├── store/
    │   │   ├── store.ts          # Redux store
    │   │   ├── socketStore.ts    # Zustand store
    │   │   └── slices/           # Redux slices
    │   └── types/
    │       └── index.ts           # TypeScript types
    │
    └── package.json       # Node dependencies
```

---

## 🚀 Step 14: How to Run the System

**1. Start Backend:**

```bash
cd backend
source venv/bin/activate
python run.py
# Server runs on http://localhost:8000
```

**2. Start Frontend:**

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

**3. Access Application:**

- Open browser to http://localhost:5173
- Enter your name when prompted
- Start creating nodes and connections!

---

## 🎓 Summary

This is a **full-stack, real-time collaborative application** that:

1. **Stores data** in PostgreSQL database
2. **Serves API** via FastAPI (REST + WebSocket)
3. **Manages real-time** communication via Socket.IO
4. **Provides UI** via React + TypeScript
5. **Manages state** via Redux + Zustand
6. **Synchronizes** all clients in real-time

**Key Innovation:** Every user action is:

- Validated by backend
- Stored in database
- Broadcasted to all clients
- Reflected in real-time UI

This creates a seamless collaborative experience where multiple users can work on the same mind map simultaneously!
