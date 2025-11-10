"""
Example/test script for CRUD operations.
This demonstrates how to use all the CRUD functions.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal
from crud import (
    # Session CRUD
    create_session,
    get_session,
    get_all_sessions,
    update_session,
    delete_session,
    get_session_state,
    # Node CRUD
    create_node,
    get_node,
    get_nodes_by_session,
    update_node,
    update_node_partial,
    delete_node,
    # Edge CRUD
    create_edge,
    get_edge,
    get_edges_by_session,
    get_edges_by_node,
    delete_edge,
)
from schemas import NodeCreate, NodeUpdate, EdgeCreate


async def test_crud_operations():
    """Example of using all CRUD operations"""
    async with AsyncSessionLocal() as db:
        # ========== SESSION OPERATIONS ==========
        print("Creating session...")
        session = await create_session(db, title="Test Mind Map")
        print(f"✅ Created session: {session.id} - {session.title}")
        
        # ========== NODE OPERATIONS ==========
        print("\nCreating nodes...")
        node1_data = NodeCreate(content="Root Node", x=400, y=300, width=200, height=100)
        node1 = await create_node(db, session.id, node1_data)
        print(f"✅ Created node: {node1.id} - {node1.content}")
        
        node2_data = NodeCreate(content="Child Node 1", x=200, y=500, width=180, height=80)
        node2 = await create_node(db, session.id, node2_data)
        print(f"✅ Created node: {node2.id} - {node2.content}")
        
        node3_data = NodeCreate(content="Child Node 2", x=600, y=500, width=180, height=80)
        node3 = await create_node(db, session.id, node3_data)
        print(f"✅ Created node: {node3.id} - {node3.content}")
        
        # Update node
        print("\nUpdating node...")
        update_data = NodeUpdate(content="Updated Root Node", x=410, y=310)
        updated_node = await update_node(db, node1.id, update_data)
        print(f"✅ Updated node: {updated_node.content} at ({updated_node.x}, {updated_node.y})")
        
        # Partial update (for Socket.IO)
        print("\nPartial update (for real-time)...")
        partial_patch = {"x": 420, "y": 320}
        partially_updated = await update_node_partial(db, node1.id, partial_patch)
        print(f"✅ Partially updated node position: ({partially_updated.x}, {partially_updated.y})")
        
        # ========== EDGE OPERATIONS ==========
        print("\nCreating edges...")
        edge1_data = EdgeCreate(source_id=node1.id, target_id=node2.id)
        edge1 = await create_edge(db, session.id, edge1_data)
        print(f"✅ Created edge: {edge1.id} from {edge1.source_id} to {edge1.target_id}")
        
        edge2_data = EdgeCreate(source_id=node1.id, target_id=node3.id)
        edge2 = await create_edge(db, session.id, edge2_data)
        print(f"✅ Created edge: {edge2.id} from {edge2.source_id} to {edge2.target_id}")
        
        # ========== GET STATE ==========
        print("\nGetting session state...")
        state = await get_session_state(db, session.id)
        print(f"✅ Session has {len(state.nodes)} nodes and {len(state.edges)} edges")
        
        # Get all nodes
        all_nodes = await get_nodes_by_session(db, session.id)
        print(f"✅ Found {len(all_nodes)} nodes in session")
        
        # Get all edges
        all_edges = await get_edges_by_session(db, session.id)
        print(f"✅ Found {len(all_edges)} edges in session")
        
        # Get edges for a specific node
        node_edges = await get_edges_by_node(db, node1.id)
        print(f"✅ Node {node1.id} has {len(node_edges)} connected edges")
        
        # ========== CLEANUP (optional) ==========
        # Uncomment to delete everything
        # print("\nCleaning up...")
        # await delete_session(db, session.id)
        # print("✅ Deleted session and all related data")


if __name__ == "__main__":
    print("Testing CRUD operations...\n")
    asyncio.run(test_crud_operations())
    print("\n✅ All CRUD operations completed!")

