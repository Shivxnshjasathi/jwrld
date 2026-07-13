'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Cell = {
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

const LEVELS = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 16, cols: 16, mines: 40 },
};

export default function MinesweeperPage() {
  const router = useRouter();
  const [level, setLevel] = useState<keyof typeof LEVELS>('Beginner');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [time, setTime] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize a blank grid
  const initializeGrid = useCallback(() => {
    const { rows, cols } = LEVELS[level];
    const newGrid: Cell[][] = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isOpen: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
    setGrid(newGrid);
    setStatus('idle');
    setTime(0);
    setFlagsPlaced(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [level]);

  useEffect(() => {
    initializeGrid();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initializeGrid]);

  const plantMines = (firstY: number, firstX: number) => {
    const { rows, cols, mines } = LEVELS[level];
    const newGrid = [...grid.map(row => [...row])];
    
    let minesPlanted = 0;
    while (minesPlanted < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      // Don't place mine on the first clicked cell or if it already has a mine
      if (!newGrid[r][c].isMine && (r !== firstY || c !== firstX)) {
        newGrid[r][c].isMine = true;
        minesPlanted++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols) {
                if (newGrid[r + dr][c + dc].isMine) count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }
    
    setGrid(newGrid);
    return newGrid;
  };

  const startGame = (firstY: number, firstX: number) => {
    setStatus('playing');
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
    return plantMines(firstY, firstX);
  };

  const handleCellClick = (r: number, c: number) => {
    if (status === 'won' || status === 'lost') return;
    if (grid[r][c].isOpen) return;

    if (flagMode) {
      handleRightClick(r, c, new Event('dummy') as any);
      return;
    }

    if (grid[r][c].isFlagged) return;

    let currentGrid = grid;
    if (status === 'idle') {
      currentGrid = startGame(r, c);
    }

    const newGrid = [...currentGrid.map(row => [...row])];

    if (newGrid[r][c].isMine) {
      // Game Over
      newGrid[r][c].isOpen = true;
      setStatus('lost');
      if (timerRef.current) clearInterval(timerRef.current);
      // Reveal all mines
      for (let i = 0; i < newGrid.length; i++) {
        for (let j = 0; j < newGrid[0].length; j++) {
          if (newGrid[i][j].isMine) newGrid[i][j].isOpen = true;
        }
      }
      setGrid(newGrid);
      return;
    }

    // Flood fill to open adjacent 0-mine cells
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [currR, currC] = stack.pop()!;
      if (!newGrid[currR][currC].isOpen && !newGrid[currR][currC].isFlagged) {
        newGrid[currR][currC].isOpen = true;
        if (newGrid[currR][currC].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nextR = currR + dr;
              const nextC = currC + dc;
              if (
                nextR >= 0 && nextR < newGrid.length &&
                nextC >= 0 && nextC < newGrid[0].length
              ) {
                stack.push([nextR, nextC]);
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);
    checkWin(newGrid);
  };

  const handleRightClick = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost') return;
    if (grid[r][c].isOpen) return;

    const newGrid = [...grid.map(row => [...row])];
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
    setFlagsPlaced(prev => newGrid[r][c].isFlagged ? prev + 1 : prev - 1);
  };

  const checkWin = (currentGrid: Cell[][]) => {
    let closedCount = 0;
    for (let r = 0; r < currentGrid.length; r++) {
      for (let c = 0; c < currentGrid[0].length; c++) {
        if (!currentGrid[r][c].isOpen) closedCount++;
      }
    }
    if (closedCount === LEVELS[level].mines) {
      setStatus('won');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const getNumberColor = (num: number) => {
    const colors = [
      '', '#3B82F6', '#10B981', '#EF4444', 
      '#8B5CF6', '#F59E0B', '#14B8A6', '#000000', '#6B7280'
    ];
    return colors[num];
  };

  return (
    <div className="flex flex-col min-h-dvh bg-[#0A0618] relative font-sans">
      <div className="flex items-center justify-between px-5 pt-14 pb-4 relative z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="flex gap-2">
           <button 
             onClick={() => setLevel('Beginner')}
             className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${level === 'Beginner' ? 'bg-primary text-black' : 'bg-white/10 text-white/50'}`}
           >
             EASY
           </button>
           <button 
             onClick={() => setLevel('Intermediate')}
             className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ${level === 'Intermediate' ? 'bg-primary text-black' : 'bg-white/10 text-white/50'}`}
           >
             HARD
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 w-full">
        
        {/* Game Stats */}
        <div className="flex justify-between w-full max-w-[400px] mb-6 px-4 py-3 bg-[#1A1A24] rounded-2xl border border-white/10 shadow-lg">
          <div className="flex flex-col items-center">
             <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Mines</span>
             <span className="text-white font-mono text-[24px] text-red-400 font-bold leading-none mt-1">
               {Math.max(0, LEVELS[level].mines - flagsPlaced).toString().padStart(2, '0')}
             </span>
          </div>
          
          <button onClick={initializeGrid} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center active:scale-95 transition-transform">
             <span className="text-[28px]">
               {status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂'}
             </span>
          </button>

          <div className="flex flex-col items-center">
             <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Time</span>
             <span className="text-white font-mono text-[24px] text-red-400 font-bold leading-none mt-1">
               {time.toString().padStart(3, '0')}
             </span>
          </div>
        </div>

        {/* Flag Mode Toggle (Mobile Friendly) */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="text-white/50 text-[13px] font-medium">Action:</span>
          <div className="flex bg-[#1A1A24] rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setFlagMode(false)} 
              className={`px-4 py-1.5 rounded-md text-[13px] font-bold flex items-center gap-1 ${!flagMode ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-white/40'}`}
            >
              <span className="material-symbols-outlined text-[16px]">touch_app</span> Dig
            </button>
            <button 
              onClick={() => setFlagMode(true)} 
              className={`px-4 py-1.5 rounded-md text-[13px] font-bold flex items-center gap-1 ${flagMode ? 'bg-[#EF4444] text-white shadow-sm' : 'text-white/40'}`}
            >
              <span className="material-symbols-outlined text-[16px]">flag</span> Flag
            </button>
          </div>
        </div>

        {/* The Grid */}
        <div className="bg-white p-2 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
          <div 
            className="grid gap-[2px] bg-gray-300"
            style={{ gridTemplateColumns: `repeat(${LEVELS[level].cols}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) => 
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleRightClick(r, c, e)}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[16px] sm:text-[20px] font-bold 
                    ${cell.isOpen ? 'bg-gray-200' : 'bg-gray-400 active:bg-gray-300 hover:bg-gray-300 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.2),inset_2px_2px_0px_rgba(255,255,255,0.4)]'}
                    ${cell.isOpen && cell.isMine ? 'bg-red-500' : ''}
                  `}
                  style={{ color: cell.isOpen ? getNumberColor(cell.neighborMines) : undefined }}
                >
                  {cell.isOpen 
                    ? (cell.isMine ? '💣' : (cell.neighborMines > 0 ? cell.neighborMines : '')) 
                    : (cell.isFlagged ? '🚩' : '')}
                </button>
              ))
            )}
          </div>
        </div>

        {status === 'won' && (
          <div className="mt-8 text-center animate-bounce">
            <h2 className="text-3xl font-black text-[#4ECDC4] drop-shadow-md">YOU WIN!</h2>
            <p className="text-white/70 mt-1 font-medium">Cleared in {time} seconds</p>
          </div>
        )}
        
      </div>
    </div>
  );
}
