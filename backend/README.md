# Tower of Hanoi - バックエンド セットアップガイド

## 概要

Python + FastAPI + SQLite で実装されたバックエンド API

## ファイル構成

```bash
backend/
├── __init__.py
├── requirements.txt
└── app/
    ├── __init__.py
    ├── main.py          # FastAPI アプリケーション
    ├── database.py      # SQLite 設定
    ├── schemas.py       # Pydantic スキーマ
    └── crud.py          # データベース操作
```

## セットアップ手順

### 1. 必要なパッケージをインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. API サーバーを起動

```bash
python -m uvicorn app.main:app --reload --port 8000
```

サーバーが起動すると、以下のメッセージが表示されます：

```bash
INFO:     Application startup complete.
```

### 3. フロントエンド開発サーバーを起動（別のターミナル）

```bash
npm run dev
```

## API エンドポイント

### スコア保存

- **URL**: `/api/scores`
- **メソッド**: POST
- **リクエスト例**:

```json
{
  "playerName": "太郎",
  "numDisks": 3,
  "moves": 7,
  "clearTime": 45.5,
  "timestamp": "2026-02-05T10:30:00Z"
}
```

### スコア取得

- **URL**: `/api/scores`
- **メソッド**: GET
- **レスポンス例**:

```json
[
  {
    "id": 1,
    "playerName": "太郎",
    "numDisks": 3,
    "moves": 7,
    "clearTime": 45.5,
    "timestamp": "2026-02-05T10:30:00"
  }
]
```

## 開発環境の設定

### Vite プロキシ設定

Vite がフロントエンド開発時に `/api` リクエストを `http://localhost:8000` にプロキシします。
（vite.config.ts で設定済み）

## データベース

- **種類**: SQLite
- **ファイル**: `backend/scores.db`
- **テーブル**: `scores`
  - id (Integer, Primary Key)
  - playerName (String)
  - numDisks (Integer)
  - moves (Integer)
  - clearTime (Float)
  - timestamp (DateTime)

## トラブルシューティング

### モジュールが見つからない場合

backend ディレクトリから uvicorn を実行してください：

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### ポートがすでに使用中の場合

別のポート番号を指定してください：

```bash
python -m uvicorn app.main:app --reload --port 8001
```

この場合、vite.config.ts のプロキシ設定も更新してください。
