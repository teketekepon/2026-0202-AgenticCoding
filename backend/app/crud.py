from sqlalchemy.orm import Session
from app.database import ScoreDB
from app.schemas import ScoreCreate, Score
from datetime import datetime


def create_score(db: Session, score: ScoreCreate) -> Score:
    """スコアをデータベースに保存"""
    db_score = ScoreDB(
        playerName=score.playerName,
        numDisks=score.numDisks,
        moves=score.moves,
        clearTime=score.clearTime,
        timestamp=datetime.fromisoformat(score.timestamp.replace("Z", "+00:00"))
    )
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score


def get_scores(db: Session) -> list[Score]:
    """全スコアを取得"""
    scores = db.query(ScoreDB).all()
    return scores
