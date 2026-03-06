import React from "react";
import "../styles/stone.css";

interface StoneProps {
  color: "B" | "W";
  x: number;
  y: number;
  size: number;
  highlight?: boolean;
  preview?: boolean;
  theme?: "classic" | "contrast";
}

const Stone: React.FC<StoneProps> = ({ color, x, y, size, highlight = false, preview = false, theme = "classic" }) => {
  return (
    <g className={`stone ${color === "B" ? "black" : "white"} theme-${theme} ${preview ? "preview" : ""}`}>
      <circle cx={x} cy={y} r={size * 0.42} />
      {highlight && <circle className="last-move" cx={x} cy={y} r={size * 0.14} />}
    </g>
  );
};

export default Stone;
