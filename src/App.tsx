import './App.css';

import React, { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    if (gameStarted) {
      initializeGame(numDisks);
    }
  }, [gameStarted, numDisks]);

  // 自動モードのディスク移動ロジック
  useEffect(() => {
    if (autoMode && autoMoveIndex < autoMoves.length) {
      const [from, to] = autoMoves[autoMoveIndex];

      setPoles(prevPoles => {
        const newPoles = JSON.parse(JSON.stringify(prevPoles));
        const diskToMove = newPoles[from][newPoles[from].length - 1];

        if (diskToMove) {
          newPoles[from].pop();
          newPoles[to].push(diskToMove);
          setMoves(prevMoves => prevMoves + 1);
        }
        return newPoles;
      });

      const timer = setTimeout(() => {
        setAutoMoveIndex(prevIndex => prevIndex + 1);
      }, 800);

      return () => clearTimeout(timer);
    } else if (autoMode && autoMoveIndex === autoMoves.length) {
      setAutoMode(false);
    }
  }, [autoMode, autoMoves, autoMoveIndex]);

  const initializeGame = (disks: number) => {
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
  };

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
    if (!gameStarted || autoMode) return; // ゲームが開始されていない場合、またはAutoモード中は手動操作を無効

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

  const isGameWon = () => {
    return poles[2].length === numDisks;
  };

  const handleDifficultySelect = (difficulty: number) => {
    setNumDisks(difficulty);
    setGameStarted(true);
  };

  // ハノイの塔を自動で解く再帰関数
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

  return (
    <div className="App">
      <h1>ハノイの塔にちょうせん！</h1>
      {!gameStarted ? (
        <div className="difficulty-selection">
          <h2>難易度を選んでね</h2>
          <button onClick={() => handleDifficultySelect(3)}>簡単 (3個)</button>
          <button onClick={() => handleDifficultySelect(4)}>普通 (4個)</button>
          <button onClick={() => handleDifficultySelect(5)}>難しい (5個)</button>
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
              <button onClick={() => initializeGame(numDisks)}>もう一度遊ぶ</button>
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
