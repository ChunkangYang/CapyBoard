# Human TODO — 需人工介入的測試與操作項目

> 以下事項無法由自動化或 CI 完成，需要開發者手動執行。

---

## 部署相關

### 1. 建立 GitHub Repository 並設定 Remote（尚未執行）

```bash
# 在 GitHub 建立 repo：ChunkangYang/CapyBoard
git remote add origin https://github.com/ChunkangYang/CapyBoard.git
git push -u origin main
```

若 repo 名稱或帳號不同，記得同步更新：
- [package.json](../package.json) 的 `homepage` 欄位
- [public/index.html](../public/index.html) 的 `og:url` meta tag
- [README.md](../README.md) 的 Demo 連結

### 2. 啟用 GitHub Pages

1. 到 GitHub repo → Settings → Pages
2. Source 選 **Deploy from a branch**
3. Branch 選 **gh-pages**，目錄選 **/ (root)**
4. 儲存後等待 Actions 執行完成

或直接手動部署：
```bash
npm install
npm run deploy
```

### 3. Vercel 部署（二選一）

1. 前往 https://vercel.com，匯入 GitHub repo
2. Framework Preset 選 **Create React App**
3. 無需額外設定，直接 Deploy

---

## 功能測試（需瀏覽器手動驗證）

### A. 首次進入體驗
- [ ] 開啟頁面，確認 **Onboarding Tour** 自動彈出
- [ ] 走完 Tour 後關閉，確認下次進入不再自動顯示
- [ ] 點擊「新手教學」按鈕，確認 FirstGameGuide 正常開啟
- [ ] 點擊「使用說明」按鈕，確認 Tour 可手動重啟

### B. 模組管理
- [ ] 首次進入（清空 localStorage）後，確認 4 個範例遊戲自動載入
- [ ] 建立新遊戲、複製、刪除功能
- [ ] 匯入 JSON 功能（可用 `src/schema/demo_game.json` 測試）
- [ ] 匯出 JSON 功能（確認下載的 JSON 可重新匯入）

### C. 遊戲編輯器
- [ ] 拖拉 Token 到工作區，重新整理後確認位置持久化
- [ ] Token 自訂 Emoji icon 是否正常顯示
- [ ] 棋盤格線 / 吸附功能
- [ ] 棋盤背景色彩選擇器
- [ ] Ctrl+Z / Ctrl+Y 復原 / 重做
- [ ] 驗證警告列：建立無勝利條件的遊戲，確認警告正確出現

### D. 規則編輯器
- [ ] 新增含 AND / OR 條件的規則，確認 UI 正常
- [ ] 觸發鏈（triggerRule）設定後執行，確認事件日誌顯示觸發鏈訊息
- [ ] 條件超過最大鏈深度（5）時，確認警告訊息「觸發鏈深度超過上限」出現

### E. 遊戲執行（GameBoard）
- [ ] 走完完整遊戲流程：開始 → 執行動作 → 結束回合 → 換人 → 觸發勝利
- [ ] 骰子動畫（rollDice 動作）是否正常播放
- [ ] 倒退功能（rewind）：執行數步後按「倒退」，確認狀態正確回退
- [ ] 修改狀態（state editor）：直接輸入玩家分數 / Token，確認即時生效
- [ ] 牌堆抽牌（drawCard + pileId）：確認牌堆計數遞減
- [ ] 遊戲結束畫面：贏家名稱顯示、重新開始按鈕

### F. 快速測試模式
- [ ] 編輯器內按「⚡ 快速測試」，確認右側 Drawer 正常展開
- [ ] 快速測試 Drawer 中操作遊戲，確認不影響編輯器中的模組資料
- [ ] 關閉 Drawer 後重新開啟，確認遊戲狀態重置（boardKey 遞增）

### G. 範例遊戲實際試玩
- [ ] **淘金熱**：測試資源交換鏈條邏輯
- [ ] **卡牌大師**：測試牌堆 + 合成規則
- [ ] **骰子冒險**：測試骰子 + 遊戲變數觸發

### H. 格子序列系統
- [ ] 編輯器「格子」tab：新增格子、刪除、展開編輯名稱與類型
- [ ] 快速範本「直線10格」、「循環20格」是否正確建立
- [ ] 加分格（bonus_score）/ 扣分格（penalty_score）屬性設定後存檔，重開確認保留
- [ ] 規則編輯器設定 `tokenAtCellIndex` / `tokenOnCellType` 條件
- [ ] 規則編輯器觸發時機選「Token 落地後（onTokenLand）」，確認 hint 顯示
- [ ] 遊戲執行：moveToken 步進模式（前進 N 格），確認事件日誌顯示格子名稱與 index
- [ ] 遊戲執行：moveToken 跳躍模式（直接到第 N 格）
- [ ] 落地觸發：落到加分格後確認分數自動增加（CellEvent onLand）
- [ ] 玩家面板顯示「目前在格子 N『格子名稱』」

### I. 從模板建立
- [ ] 首頁點「新建遊戲」，確認 Modal 彈出（空白 + 現有遊戲列表）
- [ ] 選擇範本後確認建立的是副本（名稱後綴「（副本）」）
- [ ] 副本修改後不影響原始範本

---

## 部署後驗證

- [ ] GitHub Pages / Vercel 網址可正常開啟
- [ ] 所有 4 個範例遊戲在正式環境下正常載入
- [ ] 匯出 JSON 功能在正式環境下可正常下載（注意 CSP headers）
- [ ] 在手機瀏覽器（iOS Safari / Android Chrome）確認響應式佈局正常
- [ ] 開啟開發者工具確認無 console error
