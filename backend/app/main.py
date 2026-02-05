from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ScoreCreate, Score
from app.crud import create_score, get_scores

app = FastAPI(title="Tower of Hanoi API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発環境用。本番環境では具体的なオリジンを指定してください
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """ルートエンドポイント"""
    return {"message": "Tower of Hanoi API"}


@app.post("/api/scores")
def save_score(score: ScoreCreate, db: Session = Depends(get_db)) -> Score:
    """スコアを保存"""
    try:
        db_score = create_score(db, score)
        return {
            "id": db_score.id,
            "playerName": db_score.playerName,
            "numDisks": db_score.numDisks,
            "moves": db_score.moves,
            "clearTime": db_score.clearTime,
            "timestamp": db_score.timestamp.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scores")
def fetch_scores(db: Session = Depends(get_db)) -> list[Score]:
    """全スコアを取得"""
    try:
        scores = get_scores(db)
        return [
            {
                "id": score.id,
                "playerName": score.playerName,
                "numDisks": score.numDisks,
                "moves": score.moves,
                "clearTime": score.clearTime,
                "timestamp": score.timestamp.isoformat()
            }
            for score in scores
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
