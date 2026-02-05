from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone, timedelta

# 日本標準時（JST）のタイムゾーン
JST = timezone(timedelta(hours=9))

def get_jst_now():
    """日本標準時の現在時刻を取得"""
    return datetime.now(JST)

# SQLite データベースの設定
DATABASE_URL = "sqlite:///./scores.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class ScoreDB(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    playerName = Column(String, index=True)
    numDisks = Column(Integer)
    moves = Column(Integer)
    clearTime = Column(Float)
    timestamp = Column(DateTime, default=get_jst_now)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
