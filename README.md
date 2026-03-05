# GO - 線上圍棋學習與對弈平台

本專案是使用 `React + TypeScript + Vite`（前端）與 `Node.js + Express + SQLite + WebSocket`（後端）打造的圍棋學習與對弈平台骨架，目標為類似 OGS 的基礎功能：教學、題庫、本地/AI/線上對弈、SGF 匯入匯出與回放。

## 1. 安裝教學

### 環境需求
- Node.js 20+
- npm 10+

### 下載專案
```bash
git clone <你的-repo-url>.git
cd GO
```

### 安裝前端依賴
```bash
cd frontend
npm install
```

### 安裝後端依賴
```bash
cd ../backend
npm install
```

## 2. 執行方法

### 開發模式（本機）
開兩個終端機：

終端機 A（後端）
```bash
cd backend
npm run dev
```
預設埠：`http://localhost:3001`

終端機 B（前端）
```bash
cd frontend
npm run dev
```
預設埠：`http://localhost:5173`

### 生產模式（單服務）
1. 先建置前端：
```bash
cd frontend
npm run build
```
2. 啟動後端（會同時提供 API + WebSocket，並嘗試服務 `frontend/dist`）
```bash
cd ../backend
npm start
```

## 3. 專案架構說明

```text
GO/
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    index.html
    src/
      main.tsx
      App.tsx
      components/
        Board.tsx
        Stone.tsx
        Tutorial.tsx
        Puzzle.tsx
        AIPlayer.ts
        goLogic.ts
      network/
        api.ts
        websocket.ts
      sgf/
        importSgf.ts
        exportSgf.ts
      styles/
        board.css
        stone.css
  backend/
    package.json
    src/
      server/
        index.js
      routes/
        game.js
        tutorial.js
        puzzle.js
      controllers/
        gameController.js
        tutorialController.js
        puzzleController.js
      models/
        gameModel.js
        puzzleModel.js
      websocket/
        wsServer.js
  render.yaml
  .gitignore
  README.md
```

## 4. 各主要檔案用途

- `frontend/src/components/goLogic.ts`：核心圍棋規則（氣、棋群、提子、禁自殺、Ko、Pass、終局判定）。
- `frontend/src/components/Board.tsx`：SVG 棋盤渲染、座標顯示、最後一步高亮、提子/回合資訊。
- `frontend/src/components/AIPlayer.ts`：初學者 AI（合法隨機、優先吃子、避免非法手）。
- `frontend/src/components/Tutorial.tsx`：5 課程教學（文字 + 互動落子 + 提示）。
- `frontend/src/components/Puzzle.tsx`：初級/中級題庫（提示與解答）。
- `frontend/src/sgf/importSgf.ts`、`exportSgf.ts`：SGF 匯入匯出。
- `frontend/src/network/websocket.ts`：線上對局 WebSocket 客戶端。
- `backend/src/server/index.js`：Express 啟動、路由掛載、WebSocket 伺服器整合。
- `backend/src/websocket/wsServer.js`：房間管理、即時落子/Pass、觀戰廣播。
- `backend/src/models/gameModel.js`：SQLite 初始化（users/games）與資料操作。
- `backend/src/controllers/gameController.js`：註冊/登入/JWT、房間建立與查詢。

## 5. 核心設計與技術原因

- 前後端分離：方便獨立開發與部署，前端專注互動體驗，後端處理帳號、資料、同步。
- React + TypeScript：元件化與型別保護，降低規則與狀態管理錯誤。
- SVG 棋盤：可精準控制座標、互動區域與高亮動畫，適合圍棋格點場景。
- Express + WebSocket：REST 負責帳號/內容，WebSocket 負責對局低延遲同步。
- SQLite：部署簡單、免額外 DB 服務，適合 MVP 與教學平台。
- SGF：確保棋譜可交換，支援匯入/匯出與回放。

## 6. 功能對照（目前骨架）

- 棋盤系統：支援 5/7/9/13/19，座標、輪流、最後一步高亮、提子數、回合顯示。
- 規則：氣、提子、禁自殺、Ko、Pass、連續兩次 Pass 終局。
- 模式：本地雙人、對 AI、線上對弈、教學、題庫、棋譜回放。
- 教學：5 課程入口與互動提示。
- 題庫：初級/中級題目、提示與解答按鈕。
- AI：合法隨機並優先吃子。
- SGF：匯入/匯出、前進/後退回放。
- 線上對弈：WebSocket 房間、雙方落子、觀戰。
- KataGo 分析：目前為預留，可後續整合引擎服務。

## 7. Render 部署

專案已提供 `render.yaml`，可直接在 Render 建立 Blueprint：

1. 將此專案 push 到 GitHub。
2. 到 Render 選擇 `New +` -> `Blueprint`。
3. 選擇你的 GitHub `GO` repo。
4. Render 會讀取 `render.yaml` 建立服務。

### 注意事項
- 若要分離前後端成兩個 Render 服務，可再拆成 `Web Service (backend)` + `Static Site (frontend)`。
- 若前端需要呼叫遠端 API，請設定 `VITE_API_URL` 與 `VITE_WS_URL`。

## 8. 推到 GitHub（GitHub Desktop）

1. 開啟 GitHub Desktop 並選擇 `GO` 資料夾。
2. 檢查變更檔案。
3. 輸入 commit 訊息，例如：`feat: init online go learning platform scaffold`
4. Commit 到目前分支。
5. Push 到遠端。

---

你可以直接以此骨架開始迭代：
- 強化算地與貼目規則
- 完整帳號系統（refresh token、權限）
- 排位分、對局匹配、聊天室
- KataGo 分析服務整合（獨立 engine worker）
