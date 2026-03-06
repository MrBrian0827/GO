import React, { useEffect, useId, useMemo, useState } from "react";
import Stone from "./Stone";
import type { GameState } from "./goLogic";
import "../styles/board.css";

interface BoardProps {
  state: GameState;
  onPlay: (row: number, col: number) => void;
  onPass: () => void;
  onReset?: () => void;
  showCoords?: boolean;
  readOnly?: boolean;
  stoneTheme?: "classic" | "contrast";
}

const BOARD_VIEWBOX = 680;

function makeColumnLabel(index: number): string {
  const letters = "ABCDEFGHJKLMNOPQRST";
  return letters[index] ?? String(index + 1);
}

const Board: React.FC<BoardProps> = ({
  state,
  onPlay,
  onPass,
  onReset,
  showCoords = true,
  readOnly = false,
  stoneTheme = "classic"
}) => {
  const { size, board, lastMove, turn, captures, moveNumber, passCount, gameOver, winner } = state;
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [confirmHint, setConfirmHint] = useState("點一下選點，再點同一格確認落子");

  const padding = 48;
  const grid = (BOARD_VIEWBOX - padding * 2) / (size - 1);
  const woodGradientId = useId().replace(/:/g, "");
  const woodTextureId = useId().replace(/:/g, "");
  const boardSurfaceWidth = useMemo(() => Math.max(360, size * 42), [size]);

  const toPoint = (n: number) => padding + n * grid;

  useEffect(() => {
    setSelected(null);
  }, [turn, size, moveNumber]);

  const findIntersection = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    // 以顯示比例換算座標，避免任何螢幕尺寸/縮放造成偏移
    const px = ((event.clientX - rect.left) / rect.width) * BOARD_VIEWBOX;
    const py = ((event.clientY - rect.top) / rect.height) * BOARD_VIEWBOX;

    const cFloat = (px - padding) / grid;
    const rFloat = (py - padding) / grid;

    const col = Math.round(cFloat);
    const row = Math.round(rFloat);

    if (row < 0 || row >= size || col < 0 || col >= size) return null;

    // 觸控時放寬到接近格點就吸附，提高手機命中率
    const threshold = 0.56;
    if (Math.abs(cFloat - col) > threshold || Math.abs(rFloat - row) > threshold) return null;

    return { row, col };
  };

  const handleBoardPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || gameOver) return;

    const point = findIntersection(event);
    if (!point) {
      setSelected(null);
      setConfirmHint("已取消選點");
      return;
    }

    if (board[point.row][point.col] !== null) {
      setSelected(null);
      setConfirmHint("此點已有棋子，請改選其他位置");
      return;
    }

    if (selected && selected.row === point.row && selected.col === point.col) {
      onPlay(point.row, point.col);
      setSelected(null);
      setConfirmHint("已送出落子");
      return;
    }

    // 已選狀態下點其他格，視為取消，避免誤觸
    if (selected) {
      setSelected(null);
      setConfirmHint("已取消選點，請重新選擇");
      return;
    }

    setSelected(point);
    setConfirmHint(`已選擇 (${point.row}, ${point.col})，再次點同格確認`);
  };

  return (
    <div className="board-layout">
      <div className="board-panel">
        <div className="board-stage">
          <div className="board-surface" style={{ width: `${boardSurfaceWidth}px` }}>
            <svg
              className="go-board"
              viewBox={`0 0 ${BOARD_VIEWBOX} ${BOARD_VIEWBOX}`}
              onPointerDown={handleBoardPointer}
              role="button"
              aria-label="go-board"
            >
              <defs>
                <linearGradient id={woodGradientId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e8c785" />
                  <stop offset="55%" stopColor="#d8aa61" />
                  <stop offset="100%" stopColor="#be8a45" />
                </linearGradient>
                <pattern id={woodTextureId} width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M0 6 H12" stroke="rgba(110,63,12,0.12)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width={BOARD_VIEWBOX} height={BOARD_VIEWBOX} rx="16" ry="16" fill={`url(#${woodGradientId})`} />
              <rect x="0" y="0" width={BOARD_VIEWBOX} height={BOARD_VIEWBOX} rx="16" ry="16" fill={`url(#${woodTextureId})`} />

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

              {selected && (
                <circle
                  cx={toPoint(selected.col)}
                  cy={toPoint(selected.row)}
                  r={grid * 0.48}
                  className="selection-ring"
                />
              )}

              {selected && board[selected.row][selected.col] === null && (
                <Stone
                  color={turn}
                  x={toPoint(selected.col)}
                  y={toPoint(selected.row)}
                  size={grid}
                  preview
                  theme={stoneTheme}
                />
              )}

              {board.map((row, r) =>
                row.map((cell, c) => {
                  if (!cell) return null;
                  const highlight = !!lastMove && lastMove.row === r && lastMove.col === c;
                  return (
                    <Stone
                      key={`${r}-${c}`}
                      color={cell}
                      x={toPoint(c)}
                      y={toPoint(r)}
                      size={grid}
                      highlight={highlight}
                      theme={stoneTheme}
                    />
                  );
                })
              )}
            </svg>
          </div>
        </div>
      </div>

      <aside className="board-info">
        <h3>對局資訊</h3>
        <p>手數：{moveNumber}</p>
        <p>回合：{turn === "B" ? "黑" : "白"}</p>
        <p>提子：黑 {captures.B} / 白 {captures.W}</p>
        <p>連續 Pass：{passCount}</p>
        <p className="confirm-hint">{confirmHint}</p>
        <div className="row-gap">
          <button type="button" onClick={onPass} disabled={readOnly || gameOver}>
            Pass
          </button>
          {!!onReset && (
            <button type="button" onClick={onReset} disabled={readOnly}>
              重新開始棋局
            </button>
          )}
        </div>
        {gameOver && <p className="winner">終局：{winner === "D" ? "和局" : winner === "B" ? "黑勝" : "白勝"}</p>}
      </aside>
    </div>
  );
};

export default Board;
