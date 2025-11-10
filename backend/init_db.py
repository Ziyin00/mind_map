"""
Database initialization script.
Creates all tables if they don't exist.
Run this once to set up your database schema.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base
from models import Session, Node, Edge


async def init_db():
    """Create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())

