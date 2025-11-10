from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Session(Base):
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    nodes = relationship("Node", back_populates="session", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="session", cascade="all, delete-orphan")


class Node(Base):
    __tablename__ = 'nodes'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    content = Column(Text, default='')
    x = Column(Integer, default=100)
    y = Column(Integer, default=100)
    width = Column(Integer, default=200)
    height = Column(Integer, default=100)
    style = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="nodes")
    # Use passive_deletes=True to let database handle cascade, not SQLAlchemy
    source_edges = relationship("Edge", foreign_keys="Edge.source_id", back_populates="source_node", passive_deletes=True)
    target_edges = relationship("Edge", foreign_keys="Edge.target_id", back_populates="target_node", passive_deletes=True)


class Edge(Base):
    __tablename__ = 'edges'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    source_id = Column(Integer, ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False)
    target_id = Column(Integer, ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("Session", back_populates="edges")
    source_node = relationship("Node", foreign_keys=[source_id], back_populates="source_edges")
    target_node = relationship("Node", foreign_keys=[target_id], back_populates="target_edges")
