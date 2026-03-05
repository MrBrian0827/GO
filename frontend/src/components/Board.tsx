import React from "react";
import Stone from "./Stone";
import type { GameState } from "./goLogic";
import "../styles/board.css";

interface BoardProps {
  state: GameState;
  onPlay: (row: number, col: number) => void;
  onPass: () => void;
  showCoords?: boolean;
  readOnly?: boolean;
}

const BOARD_PIXEL = 680;

function makeColumnLabel(index: number): string {
  const letters = "ABCDEFGHJKLMNOPQRST";
  return letters[index] ?? String(index + 1);
}

const Board: React.FC<BoardProps> = ({
  state,
  onPlay,
  onPass,
  showCoords = true,
  readOnly = false
}) => {
  const { size, board, lastMove, turn, captures, moveNumber, passCount, gameOver, winner } = state;
  const padding = 48;
  const grid = (BOARD_PIXEL - padding * 2) / (size - 1);

  const toPoint = (n: number) => padding + n * grid;

  const handleBoardClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || gameOver) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - padding) / grid);
    const row = Math.round((y - padding) / grid);

    if (row >= 0 && row < size && col >= 0 && col < size) {
      onPlay(row, col);
    }
  };

  return (
    <div className="board-layout">
      <div className="board-panel">
        <svg className="go-board" viewBox={`0 0 ${BOARD_PIXEL} ${BOARD_PIXEL}`} onClick={handleBoardClick}>
          <defs>
            <linearGradient id="woodGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e8c785" />
              <stop offset="55%" stopColor="#d8aa61" />
              <stop offset="100%" stopColor="#be8a45" />
            </linearGradient>
            <pattern id="woodTexture" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 6 H12" stroke="rgba(110,63,12,0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={BOARD_PIXEL} height={BOARD_PIXEL} rx="16" ry="16" className="wood-bg" />
          <rect x="0" y="0" width={BOARD_PIXEL} height={BOARD_PIXEL} rx="16" ry="16" fill="url(#woodTexture)" />

          {Array.from({ length: size }, (_, i) => (
            <g key={`line-${i}`}>
              <line x1={toPoint(0)} y1={toPoint(i)} x2={toPoint(size - 1)} y2={toPoint(i)} className="grid-line" />
              <line x1={toPoint(i)} y1={toPoint(0)} x2={toPoint(i)} y2={toPoint(size - 1)} className="grid-line" />
            </g>
          ))}

          {showCoords &&
            Array.from({ length: size }, (_, i) => (
              <g key={`coord-${i}`}>
                <text x={toPoint(i)} y={24} className="coord-text">
                  {makeColumnLabel(i)}
                </text>
                <text x={22} y={toPoint(i) + 5} className="coord-text">
                  {size - i}
                </text>
              </g>
            ))}

          {board.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              const highlight = !!lastMove && lastMove.row === r && lastMove.col === c;
              return <Stone key={`${r}-${c}`} color={cell} x={toPoint(c)} y={toPoint(r)} size={grid} highlight={highlight} />;
            })
          )}
        </svg>
      </div>

      <div className="board-info">
        <h3>對局資訊</h3>
        <p>回合：{moveNumber}</p>
        <p>目前執子：{turn === "B" ? "黑" : "白"}</p>
        <p>黑提子：{captures.B}</p>
        <p>白提子：{captures.W}</p>
        <p>連續 Pass：{passCount}</p>
        <button type="button" onClick={onPass} disabled={readOnly || gameOver}>
          Pass
        </button>
        {gameOver && <p className="winner">終局：{winner === "D" ? "和局" : winner === "B" ? "黑勝" : "白勝"}</p>}
      </div>
    </div>
  );
};

export default Board;
