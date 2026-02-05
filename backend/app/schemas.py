from pydantic import BaseModel
from datetime import datetime


class ScoreCreate(BaseModel):
    playerName: str
    numDisks: int
    moves: int
    clearTime: float
    timestamp: str


class Score(BaseModel):
    id: int
    playerName: str
    numDisks: int
    moves: int
    clearTime: float
    timestamp: str

    class Config:
        from_attributes = True
