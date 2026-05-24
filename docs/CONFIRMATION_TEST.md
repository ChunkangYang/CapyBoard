# CapyBoard — Bug Fix Confirmation Tests

> 每筆 Bug 修復後在此記錄如何驗證；對應 [BUG.md](BUG.md) 的 BUG-XXX 編號。

## 格式
```
### BUG-XXX：標題
- 對應 Bug：BUG.md BUG-XXX
- 修復 commit：
- 驗證步驟：
  1. ...
  2. ...
- 預期結果：
- 證據：docs/EVIDENCES/BUG-XXX.md（如適用）
```

---

## 測試列表

### BUG-001：首次載入只有 1 個範例遊戲
- 對應 Bug：BUG.md BUG-001
- 修復 commit：（待 push）
- 驗證步驟：
  1. 開啟 http://localhost:3000/CapyBoard
  2. DevTools Console：`localStorage.removeItem('capyboard_modules'); location.reload();`
  3. 等待頁面載入完成
  4. Console：`Object.values(JSON.parse(localStorage.getItem('capyboard_modules'))).map(d => d.meta.name)`
- 預期結果：回傳 4 個遊戲名稱（桌遊大師 Demo、淘金熱、卡牌大師、骰子冒險），首頁卡片區顯示 4 張
- 證據：docs/EVIDENCES/BUG-001.md
