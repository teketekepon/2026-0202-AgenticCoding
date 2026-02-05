import './ScoresPage.css';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Score {
  id: number;
  playerName: string;
  numDisks: number;
  moves: number;
  clearTime: number;
  timestamp: string;
}

export function ScoresPage() {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch('/api/scores');
        if (response.ok) {
          const data = await response.json();
          setScores(data);
        } else {
          setError('スコア取得に失敗しました');
        }
      } catch (error) {
        console.error('スコア取得エラー:', error);
        setError('スコア取得エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="scores-page">
      <h1>ハノイの塔 - スコア一覧</h1>
      
      {loading && <p className="loading">読み込み中...</p>}
      
      {error && <p className="error">{error}</p>}
      
      {!loading && scores.length > 0 ? (
        <table className="scores-table">
          <thead>
            <tr>
              <th>プレイヤー名</th>
              <th>難易度</th>
              <th>手数</th>
              <th>クリアタイム</th>
              <th>日時</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => (
              <tr key={index}>
                <td>{score.playerName}</td>
                <td>{score.numDisks} 個</td>
                <td>{score.moves}</td>
                <td>{score.clearTime.toFixed(2)} 秒</td>
                <td>{new Date(score.timestamp).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>スコアはまだ保存されていません</p>
      )}
      
      <button onClick={() => navigate('/')} className="back-button">ゲームに戻る</button>
    </div>
  );
}
