# M5 運行時視覺棋盤 — 詳細設計（S17 起）

> 依賴 Sprint 17–19。記錄資料模型、引擎改動、UI 規格與測試例。

## 0. 問題與目標

「遊戲執行」目前不畫任何視覺棋盤，只用文字顯示玩家 token 數量與格子位置。
本設計補上視覺棋盤層，並維持單一 source of truth。

成功判準：
1. 執行頁能看到玩家資源區（籌碼＋數量）、共享供給池（殘量）、格子軌道（token 位置）。
2. 執行動作（採礦/冶煉/移動…）後，上述視覺即時更新，無需重整。
3. 不新增任何「位置 / 數量」的第二份真相——一切從 `player.tokens` / `tokenPositions` / `pilesState` 衍生。

## 1. 資料流（單向）

```
真相層（編輯期設定 + 遊玩期狀態）
  player.tokens: string[]          ← 玩家持有（gainToken/spendToken/trade 寫入）
  pilesState[pileId]: string[]     ← 牌堆殘量
  tokenPositions[tokenId]: number  ← 格子位置（moveToken 寫入）
  token.supply?: number            ← 編輯期設定的供給總量（唯讀）
        │
        ▼ 純衍生（無快取、無第二真相）
  getSupplyRemaining(tokenId) = supply − Σ玩家持有 − Σ牌堆
        │
        ▼ 渲染
  RuntimeBoard：zone 計數 / 池殘量 / 格子 token 標記
```

`boardConfig.zones`（BoardZone[]）只描述「畫在哪、歸誰」，不存任何數量——數量永遠即時讀真相層。

## 2. 型別變更（src/engine/types.ts）

```ts
// Token 新增
interface Token {
  // ...既有欄位
  supply?: number;   // 有限供給總量；undefined = 無限（維持現狀）
}

// 新增：棋盤區域（執行時即時計數的可視框）
interface BoardZone {
  id: string;
  kind: 'player' | 'pool';
  rect: { x: number; y: number; width: number; height: number };
  playerId?: string;     // kind==='player'：歸屬玩家
  tokenIds?: string[];   // kind==='pool'：顯示哪些 token（空 = 全部有 supply 的 token）
  label?: string;
  display?: 'count' | 'stack';  // 數字 or 堆疊；預設 count
}

// BoardConfig 新增
interface BoardConfig {
  // ...既有欄位
  zones?: BoardZone[];
}

// TrashKind 新增 'zone'
```

## 3. 引擎變更（src/engine/ruleEngine.ts）

- `getSupplyRemaining(tokenId): number | null`
  - token.supply 為 undefined → 回傳 null（無限）
  - 否則 = supply − Σ所有玩家持有該 token − Σ所有牌堆中該 token
- `gainToken`：若 remaining 非 null 且 < count → 失敗（log「供給不足」），不鑄造。
- `tradeToken`：換得端（toToken）同樣檢查 remaining。
- `drawCard` 直接給 token 端：同樣檢查 remaining。
- `spendToken`：維持（移除玩家持有即自動使 remaining 回升，無需額外回池邏輯）。

## 4. 編輯器（S18）

- Token 屬性面板：resource 類型多一個「供給總量」數字欄（空 = 無限）。
- 中央畫布工具列：「＋玩家區」「＋供給池區」→ 新增預設 zone，可拖移/縮放/刪除（進垃圾桶 kind='zone'）。
- 右側面板：選取 zone 時可設定 kind、歸屬玩家 / token 清單、display。

## 5. 執行頁（S19）

`RuntimeBoard`（GameBoard 內）依序疊：
1. 畫布（width/height/背景/格線）
2. cells.length>0 → 格子軌道（簡單蛇形排版）＋ tokenPositions 標記
3. zones → 即時計數（玩家區畫該玩家 token 籌碼＋count；池區畫 getSupplyRemaining）
4. board.items → 靜態裝飾

依遊戲內容自動組合：無 cells 不畫軌道、無 zones 不畫區。

## 6. 測試例（S17 單元）

| # | 情境 | 期望 |
|---|------|------|
| T1 | token.supply=undefined，gainToken | 照常鑄造，remaining=null |
| T2 | ore.supply=10，三玩家共持 7，getSupplyRemaining('ore') | 3 |
| T3 | ore.supply=10，玩家已共持 10，gainToken ore | 失敗，log「供給不足」，持有不變 |
| T4 | T3 後 spendToken ore ×1 | 成功，remaining 回到 1 |
| T5 | gold.supply=5，tradeToken ore→gold 但 gold remaining=0 | 失敗，ore 不被消耗 |
| T6 | pile 內含 2 張 ore，supply=10，無玩家持有，remaining | 8（扣掉牌堆） |
