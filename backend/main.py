import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import socketio
from socketio import AsyncServer, ASGIApp
from database import AsyncSessionLocal
from sqlalchemy import text
import crud
import schemas
from models import Session

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    "https://mind-map-fvvh.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

# Initialize Socket.IO server with CORS
sio = AsyncServer(async_mode='asgi', cors_allowed_origins=ALLOWED_ORIGINS)

# Initialize FastAPI app
app = FastAPI(title="MindMap API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Wrap FastAPI with Socket.IO ASGI app
asgi_app = ASGIApp(sio, other_asgi_app=app)


# ==================== REST API ENDPOINTS ====================

@app.get('/')
async def root():
    """Root endpoint - API health check"""
    return {
        'message': 'MindMap API is running',
        'version': '1.0.0',
        'endpoints': {
            'sessions': '/api/sessions',
            'health': '/health'
        }
    }


@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {'status': 'healthy'}


class CreateSessionReq(BaseModel):
    title: str


@app.post('/api/sessions')
async def create_session(req: CreateSessionReq):
    """Create a new mind map session"""
    async with AsyncSessionLocal() as db:
        session = await crud.create_session(db, req.title)
        return {'id': session.id, 'title': session.title, 'created_at': session.created_at.isoformat()}


@app.get('/api/sessions/{session_id}')
async def get_session(session_id: int):
    """Get session details"""
    async with AsyncSessionLocal() as db:
        session = await crud.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return schemas.Session.model_validate(session).model_dump(mode='json')


@app.get('/api/sessions')
async def list_sessions():
    """List all sessions"""
    async with AsyncSessionLocal() as db:
        sessions = await crud.get_all_sessions(db)
        return [schemas.Session.model_validate(s).model_dump(mode='json') for s in sessions]


# ==================== SOCKET.IO EVENT HANDLERS ====================

@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f'✅ Client connected: {sid}')


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f'❌ Client disconnected: {sid}')


@sio.event
async def join_session(sid, data):
    """
    Handle client joining a session
    data: {session_id, user_id, user_name}
    """
    try:
        session_id = data.get('session_id')
        user_id = data.get('user_id')
        user_name = data.get('user_name')
        
        if not session_id:
            await sio.emit('error', {'message': 'session_id is required'}, to=sid)
            return
        
        # Join the session room
        room = f'session_{session_id}'
        sio.enter_room(sid, room)
        
        # Verify session exists, create if it doesn't
        async with AsyncSessionLocal() as db:
            session = await crud.get_session(db, session_id)
            if not session:
                # Auto-create session if it doesn't exist
                session = Session(id=session_id, title=f'Session {session_id}')
                db.add(session)
                await db.commit()
                # Update sequence to avoid conflicts with future auto-generated IDs
                await db.execute(text(f"SELECT setval('sessions_id_seq', GREATEST({session_id}, (SELECT MAX(id) FROM sessions)))"))
                await db.commit()
                await db.refresh(session)
                print(f'✅ Auto-created session {session_id}')
            
            # Get initial state and send to client
            state = await crud.get_session_state(db, session_id)
            await sio.emit('initial_state', state.model_dump(mode='json'), to=sid)
        
        # Notify other users in the room
        await sio.emit('user_joined', {
            'user_id': user_id,
            'user_name': user_name
        }, room=room, skip_sid=sid)
        
        print(f'✅ User {user_name} ({user_id}) joined session {session_id}')
        
    except Exception as e:
        print(f'❌ Error in join_session: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def leave_session(sid, data):
    """Handle client leaving a session"""
    try:
        session_id = data.get('session_id')
        if session_id:
            room = f"session_{session_id}"
            sio.leave_room(sid, room)
            print(f'✅ Client left session {session_id}')
    except Exception as e:
        print(f'❌ Error in leave_session: {e}')


# ==================== NODE OPERATIONS ====================

@sio.event
async def node_create(sid, data):
    """
    Create a new node
    data: {session_id, node: {content, x, y, width, height, style}}
    """
    try:
        session_id = data.get('session_id')
        node_data = data.get('node', {})
        
        if not session_id:
            await sio.emit('error', {'message': 'session_id is required'}, to=sid)
            return
        
        async with AsyncSessionLocal() as db:
            # Verify session exists
            session = await crud.get_session(db, session_id)
            if not session:
                await sio.emit('error', {'message': 'Session not found'}, to=sid)
                return
            
            # Create node
            node_create_schema = schemas.NodeCreate(**node_data)
            node = await crud.create_node(db, session_id, node_create_schema)
            node_schema = schemas.Node.model_validate(node)
            
            # Broadcast to all clients in the session
            room = f"session_{session_id}"
            await sio.emit('node_created', {'node': node_schema.model_dump(mode='json')}, room=room)
            
            print(f'✅ Node {node.id} created in session {session_id}')
            
    except Exception as e:
        print(f'❌ Error in node_create: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def node_update(sid, data):
    """
    Update a node
    data: {session_id, node_id, patch: {x, y, content, width, height, style}}
    """
    try:
        session_id = data.get('session_id')
        node_id = data.get('node_id')
        patch = data.get('patch', {})
        
        if not session_id or not node_id:
            await sio.emit('error', {'message': 'session_id and node_id are required'}, to=sid)
            return
        
        async with AsyncSessionLocal() as db:
            # Verify node exists and belongs to session
            node = await crud.get_node(db, node_id)
            if not node or node.session_id != session_id:
                await sio.emit('error', {'message': 'Node not found'}, to=sid)
                return
            
            # Update node
            updated_node = await crud.update_node_partial(db, node_id, patch)
            if not updated_node:
                await sio.emit('error', {'message': 'Failed to update node'}, to=sid)
                return
            
            node_schema = schemas.Node.model_validate(updated_node)
            
            # Broadcast to all clients in the session
            room = f"session_{session_id}"
            await sio.emit('node_updated', {'node': node_schema.model_dump(mode='json')}, room=room)
            
    except Exception as e:
        print(f'❌ Error in node_update: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def node_delete(sid, data):
    """
    Delete a node
    data: {session_id, node_id}
    """
    try:
        session_id = data.get('session_id')
        node_id = data.get('node_id')
        
        if not session_id or not node_id:
            await sio.emit('error', {'message': 'session_id and node_id are required'}, to=sid)
            return
        
        async with AsyncSessionLocal() as db:
            # Verify node exists and belongs to session
            node = await crud.get_node(db, node_id)
            if not node or node.session_id != session_id:
                await sio.emit('error', {'message': 'Node not found'}, to=sid)
                return
            
            # Delete node (cascade will delete edges)
            success = await crud.delete_node(db, node_id)
            if not success:
                await sio.emit('error', {'message': 'Failed to delete node'}, to=sid)
                return
            
            # Broadcast to all clients in the session
            room = f"session_{session_id}"
            await sio.emit('node_deleted', {'node_id': node_id}, room=room)
            
            print(f'✅ Node {node_id} deleted from session {session_id}')
            
    except Exception as e:
        print(f'❌ Error in node_delete: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


# ==================== EDGE OPERATIONS ====================

@sio.event
async def edge_create(sid, data):
    """
    Create a new edge
    data: {session_id, edge: {source_id, target_id}}
    """
    try:
        session_id = data.get('session_id')
        edge_data = data.get('edge', {})
        
        if not session_id:
            await sio.emit('error', {'message': 'session_id is required'}, to=sid)
            return
        
        async with AsyncSessionLocal() as db:
            # Verify session exists
            session = await crud.get_session(db, session_id)
            if not session:
                await sio.emit('error', {'message': 'Session not found'}, to=sid)
                return
            
            # Create edge
            edge_create_schema = schemas.EdgeCreate(**edge_data)
            edge = await crud.create_edge(db, session_id, edge_create_schema)
            edge_schema = schemas.Edge.model_validate(edge)
            
            # Broadcast to all clients in the session
            room = f"session_{session_id}"
            await sio.emit('edge_created', {'edge': edge_schema.model_dump(mode='json')}, room=room)
            
            print(f'✅ Edge {edge.id} created in session {session_id}')
            
    except ValueError as e:
        # Handle validation errors (duplicate edge, nodes not found, etc.)
        await sio.emit('error', {'message': str(e)}, to=sid)
    except Exception as e:
        print(f'❌ Error in edge_create: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def edge_delete(sid, data):
    """
    Delete an edge
    data: {session_id, edge_id}
    """
    try:
        session_id = data.get('session_id')
        edge_id = data.get('edge_id')
        
        if not session_id or not edge_id:
            await sio.emit('error', {'message': 'session_id and edge_id are required'}, to=sid)
            return
        
        async with AsyncSessionLocal() as db:
            # Verify edge exists and belongs to session
            edge = await crud.get_edge(db, edge_id)
            if not edge or edge.session_id != session_id:
                await sio.emit('error', {'message': 'Edge not found'}, to=sid)
                return
            
            # Delete edge
            success = await crud.delete_edge(db, edge_id)
            if not success:
                await sio.emit('error', {'message': 'Failed to delete edge'}, to=sid)
                return
            
            # Broadcast to all clients in the session
            room = f"session_{session_id}"
            await sio.emit('edge_deleted', {'edge_id': edge_id}, room=room)
            
            print(f'✅ Edge {edge_id} deleted from session {session_id}')
            
    except Exception as e:
        print(f'❌ Error in edge_delete: {e}')
        await sio.emit('error', {'message': str(e)}, to=sid)


# ==================== CURSOR TRACKING (Optional) ====================

@sio.event
async def cursor_move(sid, data):
    """
    Track user cursor position
    data: {session_id, user_id, user_name, x, y}
    """
    try:
        session_id = data.get('session_id')
        if not session_id:
            return
        
        room = f"session_{session_id}"
        # Broadcast cursor position to other users (excluding sender)
        await sio.emit('cursor_moved', data, room=room, skip_sid=sid)
        
    except Exception as e:
        print(f'❌ Error in cursor_move: {e}')


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(asgi_app, host="0.0.0.0", port=8000, log_level="info")
