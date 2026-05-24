# CapyBoard — Bug Tracking

> 開發者手動記錄 Bug；Claude 修復後將狀態與測試步驟更新回此檔，並同步更新 [CONFIRMATION_TEST.md](CONFIRMATION_TEST.md)。

## 格式
```
### BUG-XXX：標題
- 狀態：Open / Fixed / Won't Fix
- 報告日期：YYYY-MM-DD
- 影響範圍：
- 重現步驟：
- 預期：
- 實際：
- 修復：（commit / PR / 檔案位置）
- 確認測試：見 CONFIRMATION_TEST.md BUG-XXX
```

---

## Bug 列表

### BUG-001：首次載入只有 1 個範例遊戲（應該 4 個）
- 狀態：Open
- 報告日期：2026-05-24
- 影響範圍：[src/App.tsx:140-151](../src/App.tsx#L140-L151) 首次進入體驗
- 重現步驟：
  1. `localStorage.clear()` 清空
  2. 重新整理頁面
  3. 觀察首頁範例遊戲數量
- 預期：4 個範例遊戲（淘金熱、卡牌大師、骰子冒險、格子序列示範 / demo_game）
- 實際：只剩最後一個（骰子冒險）。localStorage 內僅 1 筆 `module_1779591777517`
- 根因：seed 迴圈用 `generateModuleId()`（內部 `Date.now()`）連續呼叫 4 次，4 次都在同一個 ms 內回傳相同 ID，後寫的覆蓋先寫的
- 修復：將迴圈內 ID 加 index suffix，或改用 `crypto.randomUUID()`/累加 counter
- 確認測試：見 CONFIRMATION_TEST.md BUG-001
