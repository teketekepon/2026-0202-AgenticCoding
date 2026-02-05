import './App.css';

import { useCallback, useEffect, useState } from 'react';

interface Score {
  playerName: string;
  numDisks: number;
  moves: number;
  clearTime: number;
  timestamp: string;
}

function App() {
  const [poles, setPoles] = useState<number[][]>([[], [], []]);
  const [moves, setMoves] = useState(0);
  const [selectedDisk, setSelectedDisk] = useState<number | null>(null);
  const [selectedPole, setSelectedPole] = useState<number | null>(null);
  const [numDisks, setNumDisks] = useState(3); // ディスクの数
  const [gameStarted, setGameStarted] = useState(false);
  const [autoMode, setAutoMode] = useState(false); // 自動モードの状態
  const [autoMoves, setAutoMoves] = useState<[number, number][]>([]); // 自動モードでの移動の配列
  const [autoMoveIndex, setAutoMoveIndex] = useState(0); // 自動移動の現在のインデックス
  const [startTime, setStartTime] = useState<number | null>(null); // ゲーム開始時刻
  const [elapsedTime, setElapsedTime] = useState(0); // 経過時間（秒）
  const [playerName, setPlayerName] = useState(''); // プレイヤー名
  const [scores, setScores] = useState<Score[]>([]); // スコアリスト
  const [showScores, setShowScores] = useState(false); // スコア表示フラグ

  const isGameWon = () => {
    return poles[2].length === numDisks;
  };

  const initializeGame = useCallback((disks: number) => {
    const initialPoles: number[][] = [[], [], []];
    for (let i = disks; i > 0; i--) {
      initialPoles[0].push(i);
    }
    setPoles(initialPoles);
    setMoves(0);
    setSelectedDisk(null);
    setSelectedPole(null);
    setAutoMode(false); // ゲームリセット時にAutoモードを無効化
    setAutoMoves([]);
    setAutoMoveIndex(0);
    setStartTime(Date.now()); // ゲーム開始時刻を記録
    setElapsedTime(0);
  }, []);

  useEffect(() => {
    if (gameStarted) {
      const timer = setTimeout(() => {
        initializeGame(numDisks);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, numDisks, initializeGame]);

  // 経過時間を毎秒更新するEffect
  useEffect(() => {
    const gameWon = poles[2].length === numDisks;
    if (gameStarted && startTime && !gameWon && !autoMode) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStarted, startTime, autoMode, poles, numDisks]);

  useEffect(() => {
    if (autoMode && autoMoveIndex < autoMoves.length) {
      const [from, to] = autoMoves[autoMoveIndex];

      // 自動モードのディスク移動ロジック
      const timer = setTimeout(() => {
        setPoles(prevPoles => {
          const newPoles = JSON.parse(JSON.stringify(prevPoles));
          const diskToMove = newPoles[from][newPoles[from].length - 1];

          if (diskToMove) {
            newPoles[from].pop();
            newPoles[to].push(diskToMove);
          }
          return newPoles;
        });

        setMoves(prevMoves => prevMoves + 1);
        setAutoMoveIndex(prevIndex => prevIndex + 1);
      }, 800);

      return () => clearTimeout(timer);
    } else if (autoMode && autoMoveIndex === autoMoves.length) {
      const timer = setTimeout(() => {
        setAutoMode(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoMode, autoMoves, autoMoveIndex]);

  const moveDisk = useCallback((fromPole: number, toPole: number, isAuto: boolean = false) => {
    if (fromPole === toPole) return;

    setPoles(prevPoles => {
      const newPoles = JSON.parse(JSON.stringify(prevPoles));
      const diskToMove = newPoles[fromPole][newPoles[fromPole].length - 1];

      if (!diskToMove) return prevPoles;

      if (newPoles[toPole].length === 0 || diskToMove < newPoles[toPole][newPoles[toPole].length - 1]) {
        newPoles[fromPole].pop();
        newPoles[toPole].push(diskToMove);
        setMoves(prevMoves => prevMoves + 1);
        return newPoles;
      } else if (!isAuto) {
        alert("それより大きいディスクは置けません！");
      }
      return prevPoles;
    });
  }, []);

  const handlePoleClick = (poleIndex: number) => {
    if (!gameStarted || autoMode) return; // ゲームが開始されていないか、またはAutoモード中は処理を無効

    if (selectedPole === null) {
      // ディスクを選択
      if (poles[poleIndex].length > 0) {
        setSelectedDisk(poles[poleIndex][poles[poleIndex].length - 1]);
        setSelectedPole(poleIndex);
      }
    } else {
      // ディスクを移動
      moveDisk(selectedPole, poleIndex);
      setSelectedDisk(null);
      setSelectedPole(null);
    }
  };

  const handleDifficultySelect = (difficulty: number) => {
    setNumDisks(difficulty);
    setGameStarted(true);
  };

  // ハノイの塔を自動で解く漸化関数
  const solveHanoi = (disks: number, from: number, to: number, aux: number, movesList: [number, number][]) => {
    if (disks === 1) {
      movesList.push([from, to]);
      return;
    }
    solveHanoi(disks - 1, from, aux, to, movesList);
    movesList.push([from, to]);
    solveHanoi(disks - 1, aux, to, from, movesList);
  };

  const startAutoMode = () => {
    initializeGame(numDisks); // ゲームを初期状態に戻す
    const movesList: [number, number][] = [];
    solveHanoi(numDisks, 0, 2, 1, movesList);
    setAutoMoves(movesList);
    setAutoMoveIndex(0);
    setAutoMode(true);
  };

  // スコアをDBに保存する関数
  const saveScore = async (moveCount: number, clearTime: number) => {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName || 'Anonymous',
          numDisks,
          moves: moveCount,
          clearTime, // クリアタイム（秒）
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log('スコアを保存しました');
        alert('スコアを保存しました！');
        setPlayerName(''); // リセット
      } else {
        console.error('スコア保存に失敗しました');
        alert('スコア保存に失敗しました');
      }
    } catch (error) {
      console.error('スコア保存エラー:', error);
      alert('スコア保存エラーが発生しました');
    }
  };

  // スコアを取得する関数
  const fetchScores = async () => {
    try {
      const response = await fetch('/api/scores');
      if (response.ok) {
        const data = await response.json();
        setScores(data);
        setShowScores(true);
      } else {
        console.error('スコア取得に失敗しました');
      }
    } catch (error) {
      console.error('スコア取得エラー:', error);
    }
  };

  return (
    <div className="App">
      <h1>ハノイの塔にちょうせん！</h1>
      {!gameStarted ? (
        <div className="difficulty-selection">
          <h2>難易度を選んでね</h2>
          <button onClick={() => handleDifficultySelect(3)}>簡単 (3個)</button>
          <button onClick={() => handleDifficultySelect(4)}>普通 (4個)</button>
          <button onClick={() => handleDifficultySelect(5)}>難しい (5個)</button>
          <button onClick={fetchScores} className="scores-button">スコアを見る</button>

          {showScores && (
            <div className="scores-section">
              <h2>スコア一覧</h2>
              <button onClick={() => setShowScores(false)}>閉じる</button>
              {scores.length > 0 ? (
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
                <p>スコアはまだ保存されていません</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <p>目標：一番左の棒にあるお皿を、右の棒に全部移そう！</p>
          <p>ルール：</p>
          <ul>
            <li>一度に一枚のお皿しか動かせないよ。</li>
            <li>小さいお皿の上に、大きいお皿は置けないよ。</li>
            <li>お皿は動かすか、置くか、しかできないよ。</li>
          </ul>
          <p>動かした回数: {moves}</p>
          <p>経過時間: {elapsedTime} 秒</p>
          <div className="hanoi-board">
            {poles.map((pole, poleIndex) => (
              <div
                key={poleIndex}
                className={`pole ${selectedPole === poleIndex ? 'selected-pole' : ''}`}
                onClick={() => handlePoleClick(poleIndex)}
              >
                <div className="pole-line"></div>
                {pole.map((diskSize, diskIndex) => (
                  <div
                    key={diskIndex}
                    className={`disk disk-${diskSize} ${selectedDisk === diskSize && selectedPole === poleIndex ? 'selected' : ''}`}
                    style={{ width: `${diskSize * 20 + 40}px` }}
                  ></div>
                ))}
              </div>
            ))}
          </div>
          {isGameWon() && (
            <div className="win-message">
              <p>おめでとう！クリアしたよ！</p>
              <p>動かした回数: {moves} 回</p>
              <p>クリアタイム: {elapsedTime} 秒</p>
              <div className="score-input">
                <input
                  type="text"
                  placeholder="プレイヤー名を入力してください"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                />
              </div>
              <button onClick={() => {
                saveScore(moves, elapsedTime);
                initializeGame(numDisks);
              }}>スコア保存してもう一度遊ぶ</button>
              <button onClick={() => initializeGame(numDisks)}>スコアなしでもう一度遊ぶ</button>
            </div>
          )}
          <div className="game-controls">
            <button onClick={startAutoMode} disabled={autoMode}>Autoで解く</button>
            <button onClick={() => initializeGame(numDisks)} disabled={autoMode}>ゲームをリセット</button>
            <button onClick={() => setGameStarted(false)} disabled={autoMode}>難易度選択に戻る</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;