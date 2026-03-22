# 桌遊大師 (Infinity Board)

一個強大的 Web App 桌遊軟體，提供遊戲編輯器與執行平台。

## 專案特色

### 🎮 核心功能
- **遊戲編輯器**：拖拉式元件編輯，直觀建立桌遊
- **規則引擎**：事件驅動的遊戲邏輯系統
- **遊戲執行**：即時測試和驗證遊戲規則
- **模組化設計**：支援 JSON 格式的遊戲模組匯入/匯出

### 🛠️ 技術架構
- **前端**：React + TypeScript
- **UI 框架**：Tailwind CSS + shadcn/ui
- **拖拉功能**：react-dnd
- **規則引擎**：自訂事件驅動系統
- **模組格式**：JSON Schema 驗證

## 快速開始

### 安裝依賴
```bash
npm install
```

### 啟動開發伺服器
```bash
npm start
```

應用程式將在 `http://localhost:3000` 啟動。

## 功能說明

### 1. 遊戲編輯器
- **元件面板**：可拖拉的 token、卡片、骰子等遊戲元件
- **工作區**：中央可視化編輯區域，支援拖拉放置
- **屬性面板**：編輯元件的名稱、類型、效果等屬性
- **模組匯出**：將編輯完成的遊戲儲存為 JSON 檔案

### 2. 規則編輯器
- **規則列表**：管理所有遊戲規則
- **條件設定**：定義觸發規則的條件（如擁有特定數量 token）
- **動作設定**：設定規則觸發時執行的動作（如獲勝、加分等）
- **觸發時機**：支援 onActionEnd、onTurnEnd、onObjectChange

### 3. 遊戲執行
- **玩家管理**：顯示所有玩家資訊和當前玩家
- **動作執行**：選擇並執行遊戲動作
- **資源顯示**：即時顯示玩家擁有的 token 和資源
- **事件日誌**：記錄所有遊戲事件和規則觸發
- **勝利條件**：自動檢測並顯示遊戲結束狀態

## 遊戲模組格式

### JSON Schema
遊戲模組使用標準化的 JSON 格式，包含以下主要部分：

```json
{
  "gameName": { "zh": "遊戲名稱", "en": "Game Name" },
  "players": [
    { "id": "player1", "name": "玩家1", "tokens": [], "score": 0 }
  ],
  "tokens": [
    { "id": "gold", "name": "金幣", "type": "resource" }
  ],
  "actions": [
    { "id": "buyToken", "name": "購買 Token", "parameters": ["tokenId"], "effect": "效果描述" }
  ],
  "rules": [
    { "id": "winRule", "trigger": "onActionEnd", "condition": {...}, "action": {...} }
  ],
  "turn": { "currentPlayerId": "player1", "actionsPerTurn": 1 }
}
```

### 範例遊戲
專案包含一個完整的範例遊戲模組 (`src/schema/demo_game.json`)，展示：
- 2 位玩家
- 3 種資源 token（金幣、寶石、大麥）
- 1 個購買動作
- 1 個勝利規則（擁有 3 個金幣獲勝）

## 專案結構

```
InfinityBoard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/           # 基礎 UI 元件
│   │   ├── GameEditor.tsx
│   │   ├── GameBoard.tsx
│   │   └── RuleEditor.tsx
│   ├── engine/
│   │   ├── ruleEngine.ts # 規則引擎
│   │   └── types.ts      # TypeScript 類型定義
│   ├── schema/
│   │   ├── schema.json   # JSON Schema
│   │   └── demo_game.json
│   ├── utils/
│   │   ├── jsonLoader.ts
│   │   └── dragDropHelpers.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── README.md
```

## 開發指南

### 新增遊戲元件
1. 在 `GameEditor.tsx` 中新增元件類型
2. 更新 `types.ts` 中的類型定義
3. 在規則引擎中處理新元件的邏輯

### 擴充規則系統
1. 在 `ruleEngine.ts` 中新增條件和動作類型
2. 更新 `RuleEditor.tsx` 的 UI 介面
3. 測試新規則在遊戲中的執行

### 自訂 UI 主題
專案使用 Tailwind CSS，可透過修改 `tailwind.config.js` 和 `src/index.css` 來自訂樣式。

## 未來規劃

### Phase 2
- 3D token 支援
- 多人連線功能
- 進階規則編輯器（視覺化節點編輯）

### Phase 3
- 遊戲模組市集
- 社群功能
- 雲端儲存

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

---

**桌遊大師** - 讓每個人都能成為遊戲設計師 🎲


