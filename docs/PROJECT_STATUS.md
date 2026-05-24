# CapyBoard — Project Status

> 最後更新：2026-04-26

## 專案概況
桌遊設計工具，使用者可在瀏覽器中設計、編輯並試玩自製桌遊模組。
核心檔案位於 [src/](../src/)，模板位於 [src/schema/](../src/schema/)。

## 目前進度
- M1 Core Foundation — ✅ 完成
- M2 Complete Game Loop — ✅ 完成
- M3 UX & Content — ✅ 完成
- M4 Demo Ready — ✅ 完成

詳見 [MILESTONES.md](MILESTONES.md)。

## 目前待做（下一步）
專案 M1–M4 已全部完成，目前處於 **demo-ready** 階段。後續工作為：

1. 部署相關人工操作（見 [HUMAN_TODO.md](HUMAN_TODO.md) 部署相關章節）
2. 瀏覽器端手動驗收（見 [HUMAN_TODO.md](HUMAN_TODO.md) 功能測試章節）
3. 視使用者回饋進行優化（記錄到 [IMPROVE.md](IMPROVE.md) 或 [BUG.md](BUG.md)）
4. 已知延後項目：
   - Sprint 14 效能優化（大量 token、複雜規則）— 有需求再處理

## 已完成的程式碼
- 棋盤系統（BoardCell、CellEvent、CellsPanel、moveToken）
- 動作系統（gainToken、spendToken、tradeToken、rollDice、drawCard、moveToken、addScore、loseGame、setVariable、addVariable、triggerRule）
- 條件系統（hasScore、playerTurnCount、tokenAtPosition、tokenAtCellIndex、tokenOnCellType、hasVariable、AND/OR 組合）
- 規則編輯器、玩家管理、回合系統、骰子動畫、卡牌牌堆
- 模組管理（建立、複製、刪除、匯入/匯出 JSON、從模板建立）
- 4 個範例遊戲（淘金熱、卡牌大師、骰子冒險、格子序列示範）
- UX：Onboarding Tour、FirstGameGuide、Tooltip、快速測試 Drawer、倒退、修改狀態、規則驗證
- 視覺自訂（Token icon、棋盤背景、theme.primaryColor）
- 單元 + 整合測試（RuleEngine 34 案例全通過）
- 部署設定（GitHub Pages、Actions CI/CD、Vercel）

## 相關文件
- [MILESTONES.md](MILESTONES.md) — 里程碑與 Sprint 規劃
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — Demo 腳本
- [HUMAN_TODO.md](HUMAN_TODO.md) — 需人工介入的測試與部署
- [BUG.md](BUG.md) — Bug 追蹤
- [CONFIRMATION_TEST.md](CONFIRMATION_TEST.md) — Bug 修復驗證測試
- [EVIDENCES/](EVIDENCES/) — 測試證據
