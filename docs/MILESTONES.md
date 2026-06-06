# CapyBoard — Milestones & Sprint Plan

> 目標：2026 年底前有一個可 demo 的版本
> 規劃日期：2026-04-10
> Sprint 週期：2 週

---

## Milestone 1：Core Foundation（4月 ~ 5月中）
> 把現有的半成品補齊，建立穩固的核心架構

### Sprint 1（4/10 ~ 4/24）— 資料持久化 & Bug 修復
- [x] 工作區佈局持久化：boardItems 存進 gameModule（含位置座標）
- [x] 修復 DroppableWorkspace 的 getBoundingClientRect bug
- [x] 清理 console.log 殘留
- [x] GameModule 資料結構擴充：新增 `board` 欄位儲存佈局資訊
- [x] 儲存/載入 JSON 時包含佈局資料

### Sprint 2（4/24 ~ 5/8）— 動作系統重構
- [x] 設計預設動作類型系統（取代 hardcode buyToken）
- [x] 預設動作：gainToken、spendToken、tradeToken、rollDice、drawCard、moveToken
- [x] RuleEngine 支援所有預設動作的執行邏輯
- [x] 動作編輯器 UI：讓使用者從預設動作中選擇並設定參數

### Sprint 3（5/8 ~ 5/22）— 規則系統補完
- [x] 實作 addScore action
- [x] 新增更多條件類型：hasScore、playerTurnCount
- [x] 新增條件類型：tokenAtPosition（已在 Sprint 5 完成）
- [x] 實作 actionsPerTurn 限制
- [x] 規則編輯器 UI 對應更新
- [x] 規則衝突/優先順序基本處理

---

## Milestone 2：Complete Game Loop（5月中 ~ 7月初）
> 讓使用者能設計出一個完整可玩的遊戲

### Sprint 4（5/22 ~ 6/5）— 回合系統 & 玩家管理
- [x] 完整的回合流程：開始回合 → 執行動作 → 結束回合 → 換人
- [x] 玩家管理 UI：動態新增/刪除玩家、設定初始資源
- [x] 玩家狀態面板：即時顯示每位玩家的 token、分數
- [x] 回合歷史記錄

### Sprint 5（6/5 ~ 6/19）— 棋盤系統
- [x] 棋盤格線系統：支援方格棋盤（grid-based board）
- [x] Token 吸附格線功能
- [x] 棋盤尺寸自訂
- [x] tokenAtPosition 條件類型（完成）
- [x] 格子屬性設定（類型、事件觸發）— BoardCell、CellEvent、CellsPanel UI（feature/cell-system-movetoken）

### Sprint 6（6/19 ~ 7/3）— 遊戲流程完善
- [x] 勝利/失敗條件多樣化（新增 loseGame action）
- [x] 遊戲開始/結束流程（setup → play → end screen）
- [x] 骰子視覺化（擲骰動畫）
- [x] 卡牌系統基礎：CardPile 型別、drawCard 支援牌堆

---

## Milestone 3：UX & Content（7月初 ~ 9月中）
> 讓產品好用、好看、有範例可參考

### Sprint 7（7/3 ~ 7/17）— UI/UX 大改版
- [x] 整體視覺風格統一（配色、字體、間距）
- [x] 響應式佈局優化
- [x] 拖放體驗優化（視覺回饋、snap）
- [x] 鍵盤快捷鍵（Ctrl+Z undo、Ctrl+Y redo）

### Sprint 8（7/17 ~ 7/31）— 模組管理
- [x] 遊戲模組瀏覽頁面（首頁）
- [x] 建立新遊戲 / 匯入 JSON / 匯出 JSON
- [x] localStorage 儲存多個遊戲模組
- [x] 遊戲模組複製、刪除

### Sprint 9（7/31 ~ 8/14）— 範例遊戲 & 模板
- [x] 範例遊戲 1：淘金熱（資源鏈遊戲）
- [x] 範例遊戲 2：卡牌大師（卡牌合成遊戲）
- [x] 範例遊戲 3：骰子冒險（擲骰積分遊戲）
- [x] 「從模板建立」功能 — 新建遊戲 Modal，可選空白或複製現有模組

### Sprint 10（8/14 ~ 8/28）— 遊戲測試體驗
- [x] 編輯器內快速測試模式（不用切 tab）：工具列「⚡ 快速測試」按鈕，右側 Drawer 嵌入 GameBoard
- [x] 測試時可暫停、倒退、修改狀態：倒退最多 20 步；「修改狀態」直接編輯玩家分數/Token
- [x] 遊戲規則驗證：自動檢測常見問題（無勝利條件、無法執行的動作等），編輯模式頂部顯示警告列

---

## Milestone 4：Demo Ready（9月中 ~ 11月底）
> 打磨品質，準備 demo

### Sprint 11（8/28 ~ 9/11）— 教學 & 引導
- [x] 新手引導（onboarding tour）
- [x] 各功能的 tooltip 說明
- [x] 「如何設計你的第一個遊戲」教學流程

### Sprint 12（9/11 ~ 9/25）— 進階功能
- [x] 變數系統：自訂遊戲變數（血量、魔力等）— GameVariable 型別、setVariable/addVariable 動作、hasVariable 條件
- [x] 條件組合：AND / OR 邏輯組合多個條件 — evaluateCondition 遞迴處理、RuleEditor UI
- [x] 觸發鏈：一個規則觸發另一個規則 — triggerRule 動作（MAX_CHAIN_DEPTH = 5 防無限遞迴）

### Sprint 13（9/25 ~ 10/9）— 視覺 & 自訂外觀
- [x] Token 自訂圖示（Emoji / 文字 icon 欄位）
- [x] 棋盤背景自訂（backgroundColor 色彩選擇器）
- [x] 遊戲主題色彩設定（theme.primaryColor，顯示於編輯器工具列）

### Sprint 14（10/9 ~ 10/23）— 穩定性 & 測試
- [x] 單元測試：RuleEngine 核心邏輯（34 個測試案例全通過）
- [x] 整合測試：完整遊戲流程（含變數、AND/OR、觸發鏈）
- [x] Edge case 處理（空遊戲、遊戲結束後操作、空 AND/OR 條件、無效動作 ID 等）
- [ ] 效能優化（大量 token、複雜規則）（延至有需求再處理）

### Sprint 15（10/23 ~ 11/6）— Demo 準備
- [x] Demo 用的展示遊戲精修（4 個範例遊戲加入 icon、主題色、變數展示）
- [x] Demo 腳本撰寫（docs/DEMO_SCRIPT.md）
- [x] 最終 bug 修復（已隨各 sprint 修復）

### Sprint 16（11/6 ~ 11/20）— Buffer & 收尾
- [x] 預留緩衝時間處理延遲的工作項目
- [x] 最終 polish（README 更新、OG meta tags、theme-color 調整）
- [x] 部署（GitHub Pages + GitHub Actions CI/CD + Vercel 設定）

---

## Milestone 5：運行時視覺棋盤（2026-06 起）
> 讓「遊戲執行」真正把棋盤畫出來：玩家資源區、共享供給池、格子軌道都即時呈現，
> token 互動（獲得/消耗/移動）以籌碼＋數量視覺化。詳見 [S17_DETAIL_DESIGN.md](S17_DETAIL_DESIGN.md)。
>
> 背景：編輯器有兩套棋盤（自由畫布 `board.items`、格子序列 `boardConfig.cells`），
> 但「遊戲執行」兩套都不畫，只用文字顯示。本里程碑補上視覺棋盤層，
> 且一律從現有 source of truth（`player.tokens` / `tokenPositions` / `pilesState`）讀值，不另造位置真相。

### Sprint 17 — 資料模型 & 引擎（有限供給 + 區域型別）✅
- [x] `Token.supply?`：有限供給總量（undefined = 無限，維持現狀）
- [x] `BoardZone` 型別（kind: player/pool、rect、playerId/tokenIds、display）存於 `boardConfig.zones`
- [x] RuleEngine：gainToken / tradeToken / drawCard 鑄造端尊重供給上限（池空則失敗）
- [x] `getSupplyRemaining(tokenId)`：殘量 = supply − Σ玩家持有 − Σ牌堆（純衍生，不存新 state）
- [x] 單元測試：供給扣減/回補/池空失敗（T1–T6 全通過，總 40 案例）

### Sprint 18 — 編輯器（供給欄位 + 區域框選）
- [ ] Token 屬性面板新增「供給總量」欄位（resource 類型）
- [ ] 中央畫布支援框選/新增「玩家區」「供給池區」zone，可拖移/縮放/刪除（進垃圾桶）
- [ ] 右側面板設定 zone 歸屬（哪位玩家 / 哪些 token、count 或 stack 呈現）

### Sprint 19 — 執行頁 RuntimeBoard
- [ ] 執行頁渲染視覺棋盤：畫布背景 + 格線
- [ ] zone 即時計數：玩家區畫該玩家 token 籌碼＋數量；供給池區畫殘量
- [ ] 有 cells 時畫格子軌道 + token 位置標記（隨 moveToken 更新）
- [ ] 自動組合：依遊戲有無 cells / zones 決定呈現哪些層

---

## 里程碑總覽

| 里程碑 | 時間 | 目標 | 狀態 |
|--------|------|------|------|
| M1 Core Foundation | 4月 ~ 5月中 | 核心架構穩固、動作/規則系統可用 | ✅ 完成 |
| M2 Complete Game Loop | 5月中 ~ 7月初 | 能設計並玩一個完整遊戲 | ✅ 完成 |
| M3 UX & Content | 7月初 ~ 9月中 | 好用好看、有範例遊戲 | ✅ 完成（Sprint 10 部分延後） |
| M4 Demo Ready | 9月中 ~ 11月底 | 品質打磨、可對外展示 | ✅ 完成 |
| M5 運行時視覺棋盤 | 2026-06 起 | 遊戲執行畫出玩家區/供給池/格子軌道，token 互動視覺化 | 🚧 進行中 |

---

## 備註
- 12 月保留為最終緩衝，不排 sprint
- 每個 sprint 結束時檢討進度，視情況調整後續計畫
- 優先確保核心功能穩定，視覺/進階功能可依時間彈性刪減
- Sprint 10 快速測試模式推延至 M4 前期補完
