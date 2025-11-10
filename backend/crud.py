from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload
from typing import Optional, Dict, List

try:
    from . import models, schemas
except ImportError:
    import models
    import schemas


# ==================== SESSION CRUD ====================

async def create_session(db: AsyncSession, title: str) -> models.Session:
    """Create a new mind map session"""
    session = models.Session(title=title)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(db: AsyncSession, session_id: int) -> Optional[models.Session]:
    """Get a session by ID"""
    result = await db.execute(
        select(models.Session).where(models.Session.id == session_id)
    )
    return result.scalar_one_or_none()


async def get_all_sessions(db: AsyncSession) -> List[models.Session]:
    """Get all sessions"""
    result = await db.execute(select(models.Session))
    return list(result.scalars().all())


async def update_session(db: AsyncSession, session_id: int, title: str) -> Optional[models.Session]:
    """Update session title"""
    session = await get_session(db, session_id)
    if not session:
        return None
    session.title = title
    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(db: AsyncSession, session_id: int) -> bool:
    """Delete a session (cascade will delete all nodes and edges)"""
    session = await get_session(db, session_id)
    if not session:
        return False
    await db.delete(session)
    await db.commit()
    return True


async def get_session_state(db: AsyncSession, session_id: int) -> schemas.SessionState:
    """Get complete session state with all nodes and edges"""
    # Get all nodes for this session
    nodes_result = await db.execute(
        select(models.Node).where(models.Node.session_id == session_id)
    )
    nodes = nodes_result.scalars().all()
    
    # Get all edges for this session
    edges_result = await db.execute(
        select(models.Edge).where(models.Edge.session_id == session_id)
    )
    edges = edges_result.scalars().all()
    
    # Convert to schemas
    node_schemas = [schemas.Node.model_validate(node) for node in nodes]
    edge_schemas = [schemas.Edge.model_validate(edge) for edge in edges]
    
    return schemas.SessionState(nodes=node_schemas, edges=edge_schemas)


# ==================== NODE CRUD ====================

async def create_node(
    db: AsyncSession, 
    session_id: int, 
    node_data: schemas.NodeCreate
) -> models.Node:
    """Create a new node in a session"""
    node = models.Node(
        session_id=session_id,
        content=node_data.content,
        x=node_data.x,
        y=node_data.y,
        width=node_data.width,
        height=node_data.height,
        style=node_data.style or {}
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node


async def get_node(db: AsyncSession, node_id: int) -> Optional[models.Node]:
    """Get a node by ID"""
    result = await db.execute(
        select(models.Node).where(models.Node.id == node_id)
    )
    return result.scalar_one_or_none()


async def get_nodes_by_session(db: AsyncSession, session_id: int) -> List[models.Node]:
    """Get all nodes for a session"""
    result = await db.execute(
        select(models.Node).where(models.Node.session_id == session_id)
    )
    return list(result.scalars().all())


async def update_node(
    db: AsyncSession, 
    node_id: int, 
    node_update: schemas.NodeUpdate
) -> Optional[models.Node]:
    """Update a node with partial data"""
    node = await get_node(db, node_id)
    if not node:
        return None
    
    # Update only provided fields
    update_data = node_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(node, field, value)
    
    await db.commit()
    await db.refresh(node)
    return node


async def update_node_partial(
    db: AsyncSession, 
    node_id: int, 
    patch: Dict
) -> Optional[models.Node]:
    """Update a node with a dictionary patch (for Socket.IO updates)"""
    node = await get_node(db, node_id)
    if not node:
        return None
    
    # Update only provided fields
    for field, value in patch.items():
        if hasattr(node, field):
            setattr(node, field, value)
    
    await db.commit()
    await db.refresh(node)
    return node


async def delete_node(db: AsyncSession, node_id: int) -> bool:
    """Delete a node (cascade will delete related edges)"""
    node = await get_node(db, node_id)
    if not node:
        return False
    
    # Explicitly delete all edges connected to this node first
    # This prevents SQLAlchemy from trying to set foreign keys to NULL
    # which violates the NOT NULL constraint
    await db.execute(
        delete(models.Edge).where(
            (models.Edge.source_id == node_id) | (models.Edge.target_id == node_id)
        )
    )
    
    # Now delete the node (database cascade will handle any remaining edges)
    await db.delete(node)
    await db.commit()
    return True


# ==================== EDGE CRUD ====================

async def create_edge(
    db: AsyncSession, 
    session_id: int, 
    edge_data: schemas.EdgeCreate
) -> models.Edge:
    """Create a new edge connecting two nodes"""
    # Verify both nodes exist and belong to the session
    source_node = await get_node(db, edge_data.source_id)
    target_node = await get_node(db, edge_data.target_id)
    
    if not source_node or not target_node:
        raise ValueError("Source or target node not found")
    
    if source_node.session_id != session_id or target_node.session_id != session_id:
        raise ValueError("Nodes must belong to the same session")
    
    # Check if edge already exists
    existing = await db.execute(
        select(models.Edge).where(
            models.Edge.session_id == session_id,
            models.Edge.source_id == edge_data.source_id,
            models.Edge.target_id == edge_data.target_id
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Edge already exists")
    
    edge = models.Edge(
        session_id=session_id,
        source_id=edge_data.source_id,
        target_id=edge_data.target_id
    )
    db.add(edge)
    await db.commit()
    await db.refresh(edge)
    return edge


async def get_edge(db: AsyncSession, edge_id: int) -> Optional[models.Edge]:
    """Get an edge by ID"""
    result = await db.execute(
        select(models.Edge).where(models.Edge.id == edge_id)
    )
    return result.scalar_one_or_none()


async def get_edges_by_session(db: AsyncSession, session_id: int) -> List[models.Edge]:
    """Get all edges for a session"""
    result = await db.execute(
        select(models.Edge).where(models.Edge.session_id == session_id)
    )
    return list(result.scalars().all())


async def get_edges_by_node(db: AsyncSession, node_id: int) -> List[models.Edge]:
    """Get all edges connected to a specific node (as source or target)"""
    result = await db.execute(
        select(models.Edge).where(
            (models.Edge.source_id == node_id) | (models.Edge.target_id == node_id)
        )
    )
    return list(result.scalars().all())


async def delete_edge(db: AsyncSession, edge_id: int) -> bool:
    """Delete an edge"""
    edge = await get_edge(db, edge_id)
    if not edge:
        return False
    await db.delete(edge)
    await db.commit()
    return True


async def delete_edges_by_node(db: AsyncSession, node_id: int) -> int:
    """Delete all edges connected to a node (used when deleting a node)"""
    result = await db.execute(
        delete(models.Edge).where(
            (models.Edge.source_id == node_id) | (models.Edge.target_id == node_id)
        )
    )
    await db.commit()
    return result.rowcount
