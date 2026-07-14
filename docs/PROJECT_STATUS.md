# CapyBoard — Project Status

> 最後更新：2026-07-05

## 專案概況
**產品定位（2026-07-05 拍板）**：不只是單機工具，最終為 **線上多人 UGC 桌遊平台 + 虛擬經濟 + 授權/房間 DRM**。
使用者用簡約編輯器設計「可玩且有美術」的桌遊，可打包分享/上架商城收虛擬貨幣，並開房間邀他人同玩。
目標平台 Steam＋手機＋Web；主程式免費、遊戲需自製或商城購買；虛擬貨幣真錢充值不可提現；全面水豚化。
框架：React 單一核心 + Capacitor/Tauri 打三平台，**不換遊戲引擎**。完整決策見 [LAUNCH_ASSESSMENT_2026-07-05.md](LAUNCH_ASSESSMENT_2026-07-05.md)。
核心檔案位於 [src/](../src/)，模板位於 [src/schema/](../src/schema/)。

## 目前進度
第一階段（單機工具 MVP）M1–M5 已完成：
- M1 Core Foundation — ✅ 完成
- M2 Complete Game Loop — ✅ 完成
- M3 UX & Content — ✅ 完成
- M4 Demo Ready — ✅ 完成
- M5 運行時視覺棋盤 — ✅ 完成（S17–S19）

第二階段（商品化路線）M6–M13 規劃完成，M6 首波完成：
- **M6 遊玩頁美術升級 — ✅ 首波完成（待 AI 素材）**
- M7 手機/RWD → M8 CRA→Vite → M9 帳號+雲端 → M10 封包+授權 key → M11 商城+虛擬貨幣 → M12 線上多人房間 → M13 三平台上架

詳見 [MILESTONES.md](MILESTONES.md)。

## 最新：M6 遊玩頁美術升級首波完成（2026-07-14）
遊玩體驗全面升級為「好看、能玩、有美術」：
- **音效系統**：Web Audio 即時合成（無需音檔），動作/擲骰/得分/換人/勝負音效 + 靜音開關（`src/utils/sound.ts`）。
- **勝負演出**：VictoryOverlay — 水豚歡呼 + 五彩碎片 + 勝利音效 + 再玩一次（`GameBoard.tsx`）。
- **ThemePack 主題包**：4 內建主題（cozy/mine/magic/adventure）自動選配，遊玩頁套主題背景 + 氛圍；預留 imageUrl 供日後 AI 生圖無縫接入（`src/theme/themePacks.ts`）。
- **無 zone 遊戲視覺化**：ThemedTable 主題桌面（水豚玩家卡 + 籌碼），不再純文字。
- **全面水豚化**：Capybara SVG 吉祥物（`src/components/Capybara.tsx`）+ 命名統一 CapyBoard；清除全站冷藍違規改暖色。
- 驗證：build 通過、0 console error、Playwright 截圖見 [EVIDENCES/](EVIDENCES/) M6-*.png。

## 前次：E2E 全面實測 + 商品化定位拍板（2026-07-05）
- 全流程 E2E 實測通過，見 [EVIDENCES/E2E_2026-07-05.md](EVIDENCES/E2E_2026-07-05.md)。
- 產品方向與框架/引擎抉擇拍板，M6–M13 里程碑成形，見 [LAUNCH_ASSESSMENT_2026-07-05.md](LAUNCH_ASSESSMENT_2026-07-05.md)。

## 最新完成：M5 運行時視覺棋盤（2026-06-06）
「遊戲執行」過去不畫任何視覺棋盤，只用文字顯示。M5 補上視覺棋盤層：
- **有限供給（Token.supply）**：gainToken/tradeToken/drawCard 鑄造端尊重上限；`getSupplyRemaining` 殘量純衍生自 player.tokens + 牌堆，不存第二真相。
- **編輯器區域框選**：工具列＋玩家區/＋供給池區，畫布上可拖移/縮放/刪除；右側 ZoneInspector 設定歸屬。
- **執行頁 RuntimeBoard**：玩家區即時計數（count/stack）、供給池殘量、格子軌道 token 標記，全部即時讀真相層。
- 驗證見 [EVIDENCES/M5-RUNTIME-BOARD.md](EVIDENCES/M5-RUNTIME-BOARD.md)；引擎單元測試 40 案例全通過。

## 目前待做（下一步）
**M6 遊玩頁美術升級（第一刀）**，依序：
1. ThemePack 資料結構 — 定義「一份 AI 生圖如何餵進遊戲」（背景/token/卡面/勝負演出圖層）
2. 遊玩頁套主題包渲染 + 勝負演出 + 音效系統
3. 無 zone 遊戲視覺化、全面水豚化、清冷藍違規
4. Playwright 視覺驗證 + EVIDENCES

後續 M7–M13 見 [MILESTONES.md](MILESTONES.md)。延後項目：Sprint 14 效能優化（有需求再處理）。

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
