import React, { useState } from "react";
import Home from "./pages/Home";
import GamePage from "./pages/GamePage";
import "./styles/board.css";

type View = { screen: "home" } | { screen: "game"; gameId: string };

const App: React.FC = () => {
  const [view, setView] = useState<View>({ screen: "home" });

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>多棋類遊戲與學習平台</h1>
        <p>支援圍棋、象棋、將棋、五子棋、黑白棋與暗棋的學習與對弈。</p>
        <details className="resource-menu">
          <summary>推薦資源</summary>
          <div className="resource-list">
            <a href="https://www.youtube.com/@%E6%BD%98%E6%BD%98%E5%9C%8D%E6%A3%8B" target="_blank" rel="noreferrer">
              推薦圍棋教學 YT
            </a>
            <a href="https://www.goproblems.com/" target="_blank" rel="noreferrer">
              開源題庫學習
            </a>
            <a href="https://www.cosumi.net/en/" target="_blank" rel="noreferrer">
              功能參考來源
            </a>
          </div>
        </details>
      </header>

      {view.screen === "home" && <Home onSelect={(id) => setView({ screen: "game", gameId: id })} />}
      {view.screen === "game" && <GamePage gameId={view.gameId} onBack={() => setView({ screen: "home" })} />}
    </main>
  );
};

export default App;
