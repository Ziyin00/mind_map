# MindMap - Real-Time Collaborative Mind Mapping Application

A full-stack real-time collaborative mind mapping application built with React, FastAPI, Socket.IO, PostgreSQL, Redux, and Zustand.

## Features

- ✅ Real-time collaboration with Socket.IO
- ✅ Create, read, update, delete nodes
- ✅ Create and delete edges (connections between nodes)
- ✅ Drag and drop nodes
- ✅ Edit node content inline
- ✅ Canvas panning
- ✅ User presence tracking
- ✅ State management with Redux Toolkit and Zustand
- ✅ PostgreSQL database with async operations

## Tech Stack

### Frontend
- React 19 + TypeScript
- Redux Toolkit (for nodes, edges, sessions)
- Zustand (for Socket.IO and UI state)
- Tailwind CSS + shadcn/ui
- Socket.IO Client

### Backend
- FastAPI
- Socket.IO (python-socketio)
- SQLAlchemy (async)
- PostgreSQL
- Pydantic

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 12+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up database:
```bash
# Create PostgreSQL database
createdb mindmap_db

# Or using psql:
psql -c "CREATE DATABASE mindmap_db;"

# Update .env file with your database connection:
# DATABASE_URL=postgresql+asyncpg://username@localhost:5432/mindmap_db
```

5. Initialize database tables:
```bash
python init_db.py
```

6. Run the server:
```bash
python run.py
# Or
uvicorn main:asgi_app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Start the backend server first
2. Start the frontend development server
3. Open `http://localhost:5173` in your browser
4. Enter your name when prompted
5. You'll be connected to session 1 (default)

### Creating Nodes
- Click "Add Node" button in the toolbar
- Double-click a node to edit its content
- Press Enter or click outside to save

### Moving Nodes
- Click and drag nodes to reposition them

### Creating Connections
- Click "Create Link" button
- Click on the source node
- Click on the target node
- The connection will be created

### Deleting
- Select a node (click on it)
- Click the × button that appears
- Confirm deletion

### Canvas Navigation
- Click and drag on empty canvas to pan around

## API Endpoints

### REST API
- `POST /api/sessions` - Create a new session
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/{session_id}` - Get session details

### Socket.IO Events

#### Client → Server
- `join_session` - Join a mind map session
- `node_create` - Create a new node
- `node_update` - Update a node
- `node_delete` - Delete a node
- `edge_create` - Create an edge
- `edge_delete` - Delete an edge
- `cursor_move` - Send cursor position

#### Server → Client
- `initial_state` - Initial session state (nodes + edges)
- `node_created` - Node created event
- `node_updated` - Node updated event
- `node_deleted` - Node deleted event
- `edge_created` - Edge created event
- `edge_deleted` - Edge deleted event
- `user_joined` - User joined the session
- `cursor_moved` - Cursor position update
- `error` - Error message

## Project Structure

```
MindMap/
├── backend/
│   ├── main.py              # FastAPI + Socket.IO server
│   ├── crud.py              # Database CRUD operations
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic schemas
│   ├── database.py           # Database configuration
│   ├── init_db.py            # Database initialization
│   ├── test_crud.py          # CRUD testing script
│   └── requirements.txt      # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── store/            # Redux store and Zustand
    │   │   ├── store.ts
    │   │   ├── socketStore.ts
    │   │   └── slices/
    │   ├── hooks/             # Custom hooks
    │   │   └── useMindMapCRUD.ts
    │   ├── components/       # React components
    │   │   ├── NodeComponent.tsx
    │   │   └── EdgeComponent.tsx
    │   ├── types/             # TypeScript types
    │   ├── MindMap.tsx        # Main component
    │   └── App.tsx
    └── package.json
```

## Development

### Testing CRUD Operations
```bash
cd backend
python test_crud.py
```

### Database Migrations
Currently using direct table creation. For production, consider using Alembic:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## License

MIT

