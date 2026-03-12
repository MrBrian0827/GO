import React, { useEffect, useMemo, useState } from "react";
import type { GameEngine, GameStateBase } from "../../games/types";
import "../../styles/board.css";

interface Props {
  engine: GameEngine;
  state: GameStateBase;
  onStateChange: (state: GameStateBase) => void;
  onPass?: () => void;
  onReset?: () => void;
}

const BOARD_VIEWBOX = 680;

const ResponsiveGridBoard: React.FC<Props> = ({ engine, state, onStateChange, onPass, onReset }) => {
  const { size, board, lastMove, turn, gameOver, winner } = state;
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [hint, setHint] = useState("點一下選點，再點同一格確認落子");

  const padding = 48;
  const grid = (BOARD_VIEWBOX - padding * 2) / (size - 1);
  const boardSurfaceWidth = useMemo(() => (size <= 11 ? "100%" : `${Math.max(780, size * 42)}px`), [size]);

  const toPoint = (n: number) => padding + n * grid;

  useEffect(() => {
    setSelected(null);
  }, [turn, size, state.moves.length]);

  const findIntersection = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * BOARD_VIEWBOX;
    const py = ((event.clientY - rect.top) / rect.height) * BOARD_VIEWBOX;

    const cFloat = (px - padding) / grid;
    const rFloat = (py - padding) / grid;

    const col = Math.round(cFloat);
    const row = Math.round(rFloat);

    if (row < 0 || row >= size || col < 0 || col >= size) return null;

    const threshold = 0.56;
    if (Math.abs(cFloat - col) > threshold || Math.abs(rFloat - row) > threshold) return null;

    return { row, col };
  };

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (gameOver) return;
    const point = findIntersection(event);
    if (!point) {
      setSelected(null);
      setHint("已取消選點");
      return;
    }

    if (!engine.isLegal(state, point.row, point.col)) {
      setSelected(null);
      setHint("此點不可下");
      return;
    }

    if (selected && selected.row === point.row && selected.col === point.col) {
      onStateChange(engine.applyMove(state, point.row, point.col));
      setSelected(null);
      setHint("已送出落子");
      return;
    }

    if (selected) {
      setSelected(null);
      setHint("已取消選點，請重新選擇");
      return;
    }

    setSelected(point);
    setHint(`已選擇 (${point.row}, ${point.col})，再次點同格確認`);
  };

  return (
    <div className="board-layout">
      <div className="board-panel">
        <div className="board-stage">
          <div className="board-surface" style={{ width: boardSurfaceWidth }}>
            <svg className="go-board" viewBox={`0 0 ${BOARD_VIEWBOX} ${BOARD_VIEWBOX}`} onPointerDown={handlePointer}>
              <rect x="0" y="0" width={BOARD_VIEWBOX} height={BOARD_VIEWBOX} rx="16" ry="16" fill="#d8aa61" />

              {Array.from({ length: size }, (_, i) => (
                <g key={`line-${i}`}>
                  <line x1={toPoint(0)} y1={toPoint(i)} x2={toPoint(size - 1)} y2={toPoint(i)} className="grid-line" />
                  <line x1={toPoint(i)} y1={toPoint(0)} x2={toPoint(i)} y2={toPoint(size - 1)} className="grid-line" />
                </g>
              ))}

              {selected && (
                <circle cx={toPoint(selected.col)} cy={toPoint(selected.row)} r={grid * 0.48} className="selection-ring" />
              )}

              {board.map((row, r) =>
                row.map((cell, c) => {
                  if (!cell) return null;
                  const highlight = !!lastMove && lastMove.row === r && lastMove.col === c;
                  const fill = cell === "B" ? "#111" : cell === "W" ? "#f8f8f8" : "#2a1905";
                  return (
                    <g key={`${r}-${c}`}>
                      <circle cx={toPoint(c)} cy={toPoint(r)} r={grid * 0.42} fill={fill} stroke="#111" strokeWidth={1} />
                      {highlight && <circle cx={toPoint(c)} cy={toPoint(r)} r={grid * 0.12} fill="#f59e0b" />}
                      {cell.length > 1 && (
                        <text x={toPoint(c)} y={toPoint(r) + 4} textAnchor="middle" fontSize={grid * 0.32} fill="#fff">
                          {cell}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        </div>
      </div>

      <aside className="board-info">
        <h3>對局資訊</h3>
        <p>手數：{state.moves.length}</p>
        <p>回合：{turn === "B" ? "黑" : "白"}</p>
        <p className="confirm-hint">{hint}</p>
        <div className="row-gap">
          {engine.canPass && (
            <button type="button" onClick={onPass} disabled={gameOver}>
              Pass
            </button>
          )}
          {!!onReset && (
            <button type="button" onClick={onReset} disabled={gameOver}>
              重新開始棋局
            </button>
          )}
        </div>
        {winner && <p className="winner">勝者：{winner === "D" ? "平手" : winner === "B" ? "黑" : "白"}</p>}
      </aside>
    </div>
  );
};

export default ResponsiveGridBoard;
