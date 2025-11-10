# MindMap Backend

FastAPI backend with PostgreSQL and Socket.IO support.

## Setup

1. Create a virtual environment (already created):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file from `.env.example` and configure your database:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations (when ready):
   ```bash
   alembic init alembic
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

5. Run the server:
   ```bash
   python main.py
   # or
   uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
   ```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check

## Socket.IO

The server runs Socket.IO on the same port as FastAPI. Connect from the frontend using:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:8000');
```

## Database

Configure your PostgreSQL connection in the `.env` file:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mindmap_db
```

