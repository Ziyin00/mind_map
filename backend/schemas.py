from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime


# ==================== SESSION SCHEMAS ====================

class SessionBase(BaseModel):
    title: str


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    title: Optional[str] = None


class Session(SessionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ==================== NODE SCHEMAS ====================

class NodeBase(BaseModel):
    content: str = ""
    x: int = 100
    y: int = 100
    width: int = 200
    height: int = 100
    style: Optional[Dict] = {}


class NodeCreate(NodeBase):
    pass


class NodeUpdate(BaseModel):
    content: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    style: Optional[Dict] = None


class Node(NodeBase):
    id: int
    session_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class EdgeBase(BaseModel):
    source_id: int
    target_id: int


class EdgeCreate(EdgeBase):
    pass


class Edge(BaseModel):
    id: int
    session_id: int
    source_id: int
    target_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SessionState(BaseModel):
    nodes: List[Node] = []
    edges: List[Edge] = []


class UserCursor(BaseModel):
    user_id: str
    user_name: str
    x: float
    y: float
