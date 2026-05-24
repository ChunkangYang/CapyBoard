# Playwright 自動化測試報告 — 2026-05-24

> 由 Claude（Playwright MCP）執行，覆蓋 [HUMAN_TODO.md](../human_todo.md) 功能測試 A–I 大部分項目。

## 環境
- Dev server: `npm start` (http://localhost:3000/CapyBoard)
- 瀏覽器: Playwright Chromium
- Console errors: 0

## 測試覆蓋總表

| 區塊 | 項目 | 狀態 | 證據 |
|---|---|---|---|
| A | Tour 自動彈出 | ✅ | A-01-onboarding-step1.png |
| A | Tour 走完 7 步 | ✅ | 自動點下一步 6 次完成 |
| A | reload 後不再彈出 | ✅ | `localStorage.ib_onboarding_done=1` |
| A | 「新手教學」「使用說明」按鈕存在 | ✅ | snapshot |
| B | 4 個範例自動載入 | ✅（修 BUG-001 後）| B-01-four-samples-loaded.png |
| B | 建立新遊戲 | ✅ | localStorage 4→5 |
| B | 複製 | ✅ | 「骰子冒險（副本）」 |
| B | 刪除（含確認 Dialog） | ✅ | 5→4 |
| B | 匯入 JSON | ✅ | demo_game.json → 6 modules |
| B | 匯出 JSON | ✅ | 檔名「骰子冒險.json」, 3755 bytes |
| C | 驗證警告（無勝利條件）| ✅ | C-02-validation-warning.png（「遊戲驗證：2 個警告」）|
| C | 編輯器三欄佈局 | ✅ | C-01-editor-view.png |
| C | 拖拉 Token / Ctrl+Z/Y / Emoji icon / 棋盤格線吸附 / 背景色 | ⚠️ 標為需人工 | Playwright HTML5 DnD 不穩定，建議手動 |
| D | 規則編輯器 UI（條件 7 類 + AND/OR + 觸發鏈 + Token 落地後）| ✅ | D-01-rule-editor.png |
| D | 觸發鏈深度上限 5 警告 | ⏭️ 未測 | 需手動建構 6 層巢狀 |
| E | 玩家配置 + 開始遊戲 | ✅ | snapshot |
| E | 執行動作（gainToken）| ✅ | log「獲得 金幣 ×1」|
| E | 倒退（rewind）| ✅ | log 回到開局狀態 |
| E | 結束回合 → 換人 | ✅ | log「新回合：冒險者乙」|
| E | 修改狀態（state editor）| ✅ | 直接設 star=3 觸發勝利 |
| E | 骰子動畫（rollDice）| ✅ | E-02-dice-animation.png + log「擲骰（d6）：結果 6」|
| E | 勝利畫面（贏家 + 重新開始）| ✅ | E-01-victory-screen.png |
| E | 抽牌（drawCard / gainToken pile）| ✅ | 卡牌大師「抽普通牌」log「獲得 普通牌 ×2」|
| F | 「⚡ 快速測試」展開 Drawer | ✅ | F-01-quicktest-drawer.png |
| F | Drawer 內遊戲不影響編輯器 | ✅ | 編輯器 module 未變更 |
| F | 關閉重開 → 狀態重置 | ✅ | 重開後無前次 log，回到「開始遊戲」|
| G | 骰子冒險 完整試玩 | ✅ | 同 E 區所有驗證 |
| G | 卡牌大師 抽牌動作 | ✅ | F 區順帶驗證 |
| G | 淘金熱 資源交換鏈條 | ⏭️ 未測 | 建議手動 |
| H | 格子 tab 進入 | ✅ | snapshot |
| H | 範本「直線10格」| ✅ | H-01-cells-line10.png（cellCount=10）|
| H | 範本「循環20格」 | ⏭️ 未測 | 同範本機制，可推論 OK |
| H | 加分/扣分格屬性 + 持久化 / 玩家面板「目前在格子 N」/ moveToken 步進・跳躍 / 落地觸發 | ⏭️ 未測 | 需手動進入「格子序列示範」範例遊戲（已修 BUG-001 後可載入，但 demo_game.json 本身未包含格子序列規則，需挑包含 cells 的遊戲試玩）|
| I | 從模板建立 Modal（空白 + 4 個範本） | ✅ | B 區順帶驗證，列出全部 4 個範本 |
| I | 副本獨立性 | ⏭️ 未測 | 邏輯與「複製」相同，B 已驗證 |

## 發現的 Bug
- **BUG-001**：首次載入只有 1 個範例遊戲 — 已修復，見 [BUG.md](../BUG.md) / [CONFIRMATION_TEST.md](../CONFIRMATION_TEST.md) / [BUG-001.md](BUG-001.md)

## 仍需人工驗證
1. **拖拉互動**：拖 Token 到工作區、Token Emoji icon、棋盤格線吸附、背景色選擇器、Ctrl+Z/Ctrl+Y — Playwright HTML5 DnD 模擬不穩定
2. **觸發鏈深度上限 5 警告**：需手動建構 6 層巢狀 triggerRule
3. **淘金熱完整資源交換鏈條** 與 **循環20格範本**
4. **格子序列完整流程**（moveToken 步進/跳躍、落地觸發加分、玩家面板顯示在格 N）：需挑選一個含 cells 的範例遊戲（建議從「桌遊大師 Demo」匯入或新建含 cells 的模組）
5. **部署後驗證**：依賴你的 GitHub Pages / Vercel 設定
6. **手機瀏覽器響應式**

## Console
全程 0 errors / 0 warnings。
