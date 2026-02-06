import './Game.css';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Score {
  playerName: string;
  numDisks: number;
  moves: number;
  clearTime: number;
  timestamp: string;
}

export function Game() {
  const navigate = useNavigate();
  const [poles, setPoles] = useState<number[][]>([[], [], []]);
  const [moves, setMoves] = useState(0);
  const [selectedDisk, setSelectedDisk] = useState<number | null>(null);
  const [selectedPole, setSelectedPole] = useState<number | null>(null);
  const [numDisks, setNumDisks] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [autoMoves, setAutoMoves] = useState<[number, number][]>([]);
  const [autoMoveIndex, setAutoMoveIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [wasAutoMode, setWasAutoMode] = useState(false);
  const DISK_HEIGHT = 24;
  const DISK_GAP = 6;
  const BASE_OFFSET = 8;

  const isGameWon = () => {
    return poles[2].length === numDisks;
  };

  const initializeGame = useCallback((disks: number) => {
    const initialPoles: number[][] = [[], [], []];
    for (let i = 1; i <= disks; i++) {
      initialPoles[0].push(i);
    }
    setPoles(initialPoles);
    setMoves(0);
    setSelectedDisk(null);
    setSelectedPole(null);
    setAutoMode(false);
    setAutoMoves([]);
    setAutoMoveIndex(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setWasAutoMode(false);
  }, []);

  useEffect(() => {
    if (gameStarted) {
      const timer = setTimeout(() => {
        initializeGame(numDisks);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, numDisks, initializeGame]);

  useEffect(() => {
    if (gameStarted && startTime && !autoMode) {
      const interval = setInterval(() => {
        setElapsedTime(prevTime => {
          // クリア状態でタイマーを停止
          if (poles[2].length === numDisks) {
            clearInterval(interval);
            return prevTime;
          }
          return Math.round((Date.now() - startTime) / 10) / 100;
        });
      }, 10);  // 10ms（0.01秒）ごとに更新
      return () => clearInterval(interval);
    }
  }, [gameStarted, startTime, autoMode, poles, numDisks]);

  useEffect(() => {
    const gameWon = poles[2].length === numDisks;
    if (gameWon && autoMode) {
      const timer = setTimeout(() => {
        setWasAutoMode(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [poles, numDisks, autoMode]);

  useEffect(() => {
    if (autoMode && autoMoveIndex < autoMoves.length) {
      const [from, to] = autoMoves[autoMoveIndex];

      const timer = setTimeout(() => {
        setPoles(prevPoles => {
          const newPoles = JSON.parse(JSON.stringify(prevPoles));
          const diskToMove = newPoles[from][0];

          if (diskToMove !== undefined) {
            newPoles[from].shift();
            newPoles[to].unshift(diskToMove);
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

  const moveDisk = useCallback((fromPole: number, toPole: number, isAuto: boolean = false): boolean => {
    if (fromPole === toPole) return false;

    // 現在の poles 状態で判定
    const diskToMove = poles[fromPole][0];

    if (!diskToMove) return false;

    if (poles[toPole].length === 0 || diskToMove < poles[toPole][0]) {
      // 移動可能
      setPoles(prevPoles => {
        const newPoles = JSON.parse(JSON.stringify(prevPoles));
        newPoles[fromPole].shift();
        newPoles[toPole].unshift(diskToMove);
        return newPoles;
      });
      return true;
    } else if (!isAuto) {
      alert("それより大きいディスクは置けません！");
    }
    return false;
  }, [poles]);

  const handlePoleClick = (poleIndex: number) => {
    if (!gameStarted || autoMode) return;

    if (selectedPole === null) {
      if (poles[poleIndex].length > 0) {
        setSelectedDisk(poles[poleIndex][0]);
        setSelectedPole(poleIndex);
      }
    } else {
      if (moveDisk(selectedPole, poleIndex)) {
        setMoves(prevMoves => prevMoves + 1);
      }
      setSelectedDisk(null);
      setSelectedPole(null);
    }
  };

  const handleDifficultySelect = (difficulty: number) => {
    setNumDisks(difficulty);
    setGameStarted(true);
  };

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
    initializeGame(numDisks);
    const movesList: [number, number][] = [];
    solveHanoi(numDisks, 0, 2, 1, movesList);
    setAutoMoves(movesList);
    setAutoMoveIndex(0);
    setAutoMode(true);
  };

  const saveScore = async (moveCount: number, clearTime: number): Promise<Score | null> => {
    try {
      const scoreData: Score = {
        playerName: playerName || 'Anonymous',
        numDisks,
        moves: moveCount,
        clearTime,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      if (response.ok) {
        const savedScore: Score = await response.json();
        console.log('スコアを保存しました:', savedScore);
        alert('スコアを保存しました！');
        setPlayerName('');
        return savedScore;
      } else {
        console.error('スコア保存に失敗しました');
        alert('スコア保存に失敗しました');
        return null;
      }
    } catch (error) {
      console.error('スコア保存エラー:', error);
      alert('スコア保存エラーが発生しました');
      return null;
    }
  };

  const diskPositions = new Map<number, { poleIndex: number; level: number }>();
  poles.forEach((pole, poleIndex) => {
    pole.forEach((diskSize, diskIndex) => {
      const level = pole.length - 1 - diskIndex;
      diskPositions.set(diskSize, { poleIndex, level });
    });
  });

  return (
    <div className="App">
      <h1>ハノイの塔にちょうせん！</h1>
      {!gameStarted ? (
        <div className="difficulty-selection">
          <h2>難易度を選んでね</h2>
          <button onClick={() => handleDifficultySelect(3)}>簡単 (3個)</button>
          <button onClick={() => handleDifficultySelect(4)}>普通 (4個)</button>
          <button onClick={() => handleDifficultySelect(5)}>難しい (5個)</button>
          <button onClick={() => navigate('/scores')} className="scores-button">スコアを見る</button>
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
          <p>経過時間: <span className="timer">{elapsedTime.toFixed(2)}</span> 秒</p>
          <div className="hanoi-board">
            {poles.map((_, poleIndex) => (
              <div
                key={poleIndex}
                className={`pole ${selectedPole === poleIndex ? 'selected-pole' : ''}`}
                onClick={() => handlePoleClick(poleIndex)}
              >
                <div className="pole-line"></div>
              </div>
            ))}
            <div className="disks-layer">
              {Array.from({ length: numDisks }, (_, index) => index + 1).map((diskSize) => {
                const position = diskPositions.get(diskSize);
                if (!position) return null;
                const leftPercent = (position.poleIndex + 0.5) * (100 / 3);
                const bottomPx = BASE_OFFSET + position.level * (DISK_HEIGHT + DISK_GAP);
                return (
                  <div
                    key={diskSize}
                    className={`disk disk-${diskSize} ${selectedDisk === diskSize && selectedPole === position.poleIndex ? 'selected' : ''}`}
                    style={{
                      width: `${diskSize * 20 + 40}px`,
                      left: `${leftPercent}%`,
                      bottom: `${bottomPx}px`,
                    }}
                  ></div>
                );
              })}
            </div>
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
              <div className="win-buttons">
                <button 
                  onClick={() => {
                    saveScore(moves, elapsedTime);
                    setGameStarted(false);
                  }}
                  disabled={wasAutoMode}
                >
                  スコア保存
                </button>
                <button onClick={() => {
                  initializeGame(numDisks);
                }}>もう一度遊ぶ</button>
              </div>
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
