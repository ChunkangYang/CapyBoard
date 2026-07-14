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

### Sprint 18 — 編輯器（供給欄位 + 區域框選）✅
- [x] Token 屬性面板新增「供給總量」欄位（留空＝無限）
- [x] 工具列「＋玩家區」「＋供給池區」新增 zone，畫布可拖移/縮放/刪除（進垃圾桶 kind='zone'）
- [x] 右側 ZoneInspector 設定 zone 歸屬（哪位玩家 / 哪些有供給的 token、count 或 stack 呈現）

### Sprint 19 — 執行頁 RuntimeBoard ✅
- [x] 執行頁渲染視覺棋盤：畫布背景 + 格線（TokenChip 抽成共用元件）
- [x] zone 即時計數：玩家區畫該玩家 token 籌碼＋數量（count/stack）；供給池區畫殘量（∞/×N）
- [x] 有 cells 時畫格子軌道 + token 位置標記（隨 moveToken 更新）
- [x] 自動組合：依遊戲有無 cells / zones / items 決定呈現哪些層
- [x] Playwright 驗證：玩家區計數、供給池殘量連動、格子軌道 token 標記（見 EVIDENCES/M5-RUNTIME-BOARD.md）

---

## 後續強化（post-M5，依使用者回饋）

### 編輯器設定項說明系統（2026-06-13）✅
- [x] 可複用 `HelpHint`（ⓘ 圖示）+ `helpContent` 集中文案（img 欄位預留，日後可補圖）
- [x] 鋪到元件/動作/玩家/變數/格子/區域各分頁標題與關鍵欄位（供給總量、格子類型、zone 歸屬等）
- [x] 格子分頁空狀態引導：資源經濟型遊戲（如淘金熱）顯示「通常不需格子」說明，取代空白提示
- [x] `Tooltip` 暖色化（符合設計準則）+ 長文字換行；屬性面板 hint 用 `side=left` 避免 popup 溢出右緣
- [x] Playwright 視覺驗證：空狀態引導、各 hint popup 位置與換行

---

# 第二階段：商品化路線（M6 起，2026-07-05 拍板）

> 產品定位轉為 **線上多人 UGC 桌遊平台 + 虛擬經濟 + 授權/房間 DRM**。
> 目標平台 Steam＋手機＋Web；主程式免費、遊戲需自製或商城購買；虛擬貨幣真錢充值不可提現；全面水豚化 CapyBoard。
> 框架決定：React 單一核心，Capacitor（手機）+ Tauri/Electron（Steam）打三平台，**不換遊戲引擎**。
> 完整決策與理由見 [LAUNCH_ASSESSMENT_2026-07-05.md](LAUNCH_ASSESSMENT_2026-07-05.md)。

## Milestone 6：遊玩頁美術升級（第一刀）✅ 首波完成
> 讓單機遊玩體驗做到「不粗糙」。美術以免費 AI 生圖可達程度為基準，用 DOM/CSS + 圖片主題包，不引入 WebGL。

- [x] 主題包（ThemePack）資料結構：背景 / token / 氛圍 各圖層，預留 imageUrl（AI 圖填入即升級），4 內建主題（cozy/mine/magic/adventure）+ 自動選配（`src/theme/themePacks.ts`）
- [x] 遊玩頁套用主題包渲染（主題背景漸層 + 氛圍漂浮 emoji）
- [x] 勝利/失敗演出（VictoryOverlay：水豚歡呼 + 五彩碎片 + 音效 + 再玩一次）
- [x] 音效系統（Web Audio 即時合成，無需素材；動作/擲骰/得分/換人/勝負，含靜音開關存 localStorage）（`src/utils/sound.ts`）
- [x] 無 zone 遊戲（如骰子冒險）視覺化：ThemedTable 主題桌面，玩家卡 + 水豚 + 籌碼，不再只有純文字
- [x] 全面水豚化 CapyBoard：Capybara SVG 吉祥物 + 命名統一（首頁/導覽/Onboarding 取代「桌遊大師」）（`src/components/Capybara.tsx`）
- [x] 清除冷藍違規（Onboarding 圖示/提示/進度條、玩家序號、當前玩家高亮、規則 Pxx、theme-color、快速測試抽屜）改暖色
- [x] Playwright 視覺驗證 + EVIDENCES（見 EVIDENCES/M6-*.png）
- [ ] 後續：真正 AI 生圖素材填入 ThemePack.bgImageUrl / token 圖層（待美術產出）
- [ ] 後續：擲骰/抽牌等更細緻的過場動畫

## Milestone 7：手機 / RWD + touch 拖放
- [ ] 遊玩頁響應式（手機三欄改堆疊，目前 390px 不可用）
- [ ] 編輯器 touch 拖放（react-dnd 換 touch backend 或改寫）
- [ ] 編輯器手機版佈局（固定 800×500 畫布改自適應）

## Milestone 8：建置現代化
- [ ] CRA（react-scripts，已 EOL）→ Vite 遷移
- [ ] 補 `@types/jest` 讓 tsc 全綠；加 E2E/CI 自動化

## Milestone 9：帳號 + 雲端存檔 + 後端地基
- [ ] 後端服務與資料庫選型
- [ ] 註冊/登入、遊戲存雲端、跨裝置同步（取代純 localStorage）

## Milestone 10：自製封包格式 + 授權 key 系統（DRM 基礎）
- [ ] 自製通訊協定 / 遊戲封包格式（可打包分享）
- [ ] 作者身分驗證；作者生成有限數量 key
- [ ] 使用權（ownership）驗證機制

## Milestone 11：商城 + 虛擬貨幣 + 金流
- [ ] 商城上架/瀏覽/購買他人遊戲
- [ ] 虛擬貨幣：真錢充值、不可提現；作者收幣
- [ ] 金流 / IAP（注意 Apple/Google 內購 30% 抽成）；基本法務

## Milestone 12：線上多人房間 + 單次訪問權
- [ ] realtime netcode（WebSocket）房間同步
- [ ] 有使用權者開房；客人單次訪問權，離開不可自建同款房間

## Milestone 13：三平台打包上架
- [ ] Web（自家站/itch.io）
- [ ] 手機 native 打包（Capacitor）上 App Store / Google Play
- [ ] Steam 打包（Tauri/Electron）+ Steamworks
- [ ] 法務頁：ToS / 隱私 / 虛擬貨幣條款 / 年齡分級

---

## 里程碑總覽

| 里程碑 | 時間 | 目標 | 狀態 |
|--------|------|------|------|
| M1 Core Foundation | 4月 ~ 5月中 | 核心架構穩固、動作/規則系統可用 | ✅ 完成 |
| M2 Complete Game Loop | 5月中 ~ 7月初 | 能設計並玩一個完整遊戲 | ✅ 完成 |
| M3 UX & Content | 7月初 ~ 9月中 | 好用好看、有範例遊戲 | ✅ 完成（Sprint 10 部分延後） |
| M4 Demo Ready | 9月中 ~ 11月底 | 品質打磨、可對外展示 | ✅ 完成 |
| M5 運行時視覺棋盤 | 2026-06 起 | 遊戲執行畫出玩家區/供給池/格子軌道，token 互動視覺化 | ✅ 完成（S17–S19） |
| **M6 遊玩頁美術升級** | 2026-07 起 | 主題包+音效+勝負演出+水豚化，遊玩體驗不粗糙 | ✅ 首波完成（待 AI 素材） |
| M7 手機/RWD + touch | — | 遊玩頁響應式、編輯器 touch 拖放 | ⬜ 未開始 |
| M8 建置現代化 | — | CRA → Vite、CI | ⬜ 未開始 |
| M9 帳號+雲端 | — | 後端、登入、雲端存檔 | ⬜ 未開始 |
| M10 封包+授權 key | — | 自製封包格式、作者 key、使用權驗證 | ⬜ 未開始 |
| M11 商城+虛擬貨幣 | — | 上架購買、真錢充值不可提現、金流 | ⬜ 未開始 |
| M12 線上多人房間 | — | realtime netcode、單次訪問權 | ⬜ 未開始 |
| M13 三平台上架 | — | Web/Capacitor/Tauri 打包 + 法務 | ⬜ 未開始 |

---

## 備註
- 12 月保留為最終緩衝，不排 sprint
- 每個 sprint 結束時檢討進度，視情況調整後續計畫
- 優先確保核心功能穩定，視覺/進階功能可依時間彈性刪減
- Sprint 10 快速測試模式推延至 M4 前期補完
