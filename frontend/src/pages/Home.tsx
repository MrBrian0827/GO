import React from "react";
import { gameList } from "../games/registry";

interface Props {
  onSelect: (id: string) => void;
}

const Home: React.FC<Props> = ({ onSelect }) => {
  return (
    <section className="home-grid">
      {gameList.map((game) => (
        <button key={game.id} type="button" className="game-card" onClick={() => onSelect(game.id)}>
          <div>
            <h2>{game.title}</h2>
            <p>{game.subtitle}</p>
            <p>{game.status === "ready" ? "可立即遊玩" : "Beta 功能"}</p>
          </div>
        </button>
      ))}
    </section>
  );
};

export default Home;
