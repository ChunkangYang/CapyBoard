# 桌遊大師 (Infinity Board)

一個強大的 Web App 桌遊設計平台，讓每個人都能設計並試玩自己的桌遊。

## 線上 Demo

**GitHub Pages：** https://cky19.github.io/InfinityBoard

## 功能總覽

### 遊戲編輯器
- 拖拉式元件編輯（Token、卡片、骰子）
- Token 自訂圖示（Emoji / 文字）
- 棋盤格線系統與吸附功能，可自訂棋盤尺寸
- 棋盤背景色彩與遊戲主題色彩設定
- 佈局持久化（工作區位置存入 GameModule）

### 規則編輯器
- 完整動作類型：gainToken、spendToken、tradeToken、rollDice、drawCard、moveToken、addScore、setVariable、addVariable、triggerRule、winGame、loseGame
- 條件類型：hasTokenCount、hasScore、playerTurnCount、tokenAtPosition、hasVariable
- 條件組合：AND / OR 邏輯，支援無限嵌套
- 觸發鏈：一個規則觸發另一個規則（防無限遞迴，最大深度 5）
- 規則優先順序設定
- 每回合行動次數限制（actionsPerTurn）

### 遊戲執行
- 完整回合流程：開始回合 → 執行動作 → 結束回合 → 換人
- 玩家狀態即時面板（Token、分數、回合數）
- 牌堆系統（CardPile，支援隨機抽牌）
- 自訂遊戲變數（血量、魔力等）
- 勝利 / 失敗條件多樣化
- 遊戲結束畫面
- 骰子擲骰動畫

### 測試 & 偵錯
- 快速測試模式（編輯器內右側 Drawer，不用切 tab）
- 倒退最多 20 步（rewind）
- 直接修改玩家分數 / Token（測試用 state editor）
- 遊戲規則自動驗證（頂部警告列：無勝利條件、無法執行的動作等）

### 模組管理
- 首頁：瀏覽、建立、複製、刪除遊戲模組
- 匯入 / 匯出 JSON
- localStorage 本機儲存多個遊戲模組
- Ctrl+Z / Ctrl+Y 復原 / 重做（最多 50 步）

### 新手引導
- Onboarding Tour（首次進入自動顯示）
- 各功能 Tooltip 說明
- 「如何設計你的第一個遊戲」教學流程

### 範例遊戲（內建 4 個）
| 名稱 | 類型 | 特色 |
|------|------|------|
| 示範遊戲 | 基礎 | 展示核心功能 |
| 淘金熱 | 資源鏈 | 資源交換鏈條 |
| 卡牌大師 | 卡牌合成 | 牌堆 + 合成 |
| 骰子冒險 | 擲骰積分 | 骰子 + 變數 |

---

## 技術架構

- **前端**：React 18 + TypeScript
- **UI**：Tailwind CSS + shadcn/ui（Radix UI）
- **拖拉**：react-dnd（HTML5 Backend）
- **規則引擎**：自訂事件驅動系統（src/engine/ruleEngine.ts）
- **狀態持久化**：localStorage
- **模組格式**：JSON（含 JSON Schema 驗證）
- **測試**：Jest（34 個單元測試 + 整合測試）

---

## 快速開始

```bash
npm install
npm start
```

應用程式在 http://localhost:3000 啟動。

---

## 部署

### 方式一：GitHub Pages（手動）

```bash
npm install
npm run deploy
```

> 需先將 `package.json` 的 `homepage` 改為你自己的 GitHub Pages 網址，
> 並確認 repo 已推送至 GitHub。

### 方式二：GitHub Pages（自動 CI/CD）

每次 push 到 `main` 分支，GitHub Actions 會自動 build 並部署至 `gh-pages` 分支。
工作流程設定：[.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### 方式三：Vercel

1. 將 repo 匯入 Vercel
2. Framework 選 **Create React App**
3. 其他設定保持預設即可（`vercel.json` 已設定好）

---

## 遊戲模組 JSON 格式

```json
{
  "gameName": { "zh": "遊戲名稱", "en": "Game Name" },
  "players": [
    { "id": "player1", "name": "玩家1", "tokens": [], "score": 0 }
  ],
  "tokens": [
    { "id": "gold", "name": "金幣", "type": "resource", "icon": "🪙" }
  ],
  "actions": [
    { "id": "gain_gold", "name": "獲得金幣", "type": "gainToken", "params": { "tokenId": "gold", "count": 1 } }
  ],
  "rules": [
    {
      "id": "win_rule",
      "trigger": "onActionEnd",
      "condition": { "type": "hasTokenCount", "tokenId": "gold", "count": 5 },
      "action": { "type": "winGame", "playerId": "{currentPlayer}" }
    }
  ],
  "turn": { "currentPlayerId": "player1", "actionsPerTurn": 1 },
  "board": { "items": [] },
  "boardConfig": { "width": 800, "height": 500, "gridSize": 40, "showGrid": true },
  "variables": [],
  "piles": []
}
```

---

## 專案結構

```
InfinityBoard/
├── .github/workflows/deploy.yml  # CI/CD
├── public/index.html
├── src/
│   ├── components/
│   │   ├── ui/                   # 基礎 UI 元件
│   │   ├── App.tsx
│   │   ├── GameEditor.tsx        # 遊戲編輯器
│   │   ├── GameBoard.tsx         # 遊戲執行
│   │   ├── RuleEditor.tsx        # 規則編輯器
│   │   ├── HomePage.tsx          # 模組首頁
│   │   ├── OnboardingTour.tsx    # 新手引導
│   │   └── FirstGameGuide.tsx    # 第一個遊戲教學
│   ├── engine/
│   │   ├── ruleEngine.ts         # 規則引擎
│   │   ├── types.ts              # TypeScript 型別
│   │   └── __tests__/            # 單元 + 整合測試
│   ├── schema/                   # 範例遊戲 JSON
│   └── utils/
│       ├── gameValidator.ts      # 遊戲規則驗證
│       ├── moduleStorage.ts      # localStorage 模組管理
│       └── jsonLoader.ts
├── vercel.json
└── package.json
```

---

## 授權

MIT License
