// 編輯器各設定項目的說明文字。集中管理，方便校稿；
// img 為日後補圖預留，現階段留空、只用文字即可。

export interface HelpEntry {
  title: string;
  body: string;
  img?: string;  // 之後可放圖片路徑；現階段不填
}

export const helpContent: Record<string, HelpEntry> = {
  'cells.panel': {
    title: '格子序列（棋盤軌道）',
    body: '適合「擲骰移動」類遊戲：棋子沿格子前進，踩到格子觸發效果。若是資源經濟類遊戲（像淘金熱：採礦→冶煉→換寶石），用「區域／供給池」即可，通常不需要格子。',
  },
  'cells.type': {
    title: '格子類型',
    body: '決定棋子落到這格時發生什麼：起點/終點、加分/扣分、獲得或失去 Token、抽牌，或自訂事件。選好類型後，下方會出現對應的參數欄位。',
  },
  'tokens.supply': {
    title: '供給總量',
    body: '這個資源在整場遊戲中的數量上限。留空＝無限。設定後，所有玩家持有＋牌堆的總和不會超過它，供給池會即時顯示殘量。',
  },
  'zone.player': {
    title: '玩家區域',
    body: '執行時這塊框會即時顯示該玩家持有的所有 Token 籌碼與數量，等於給每位玩家一個專屬的資源面板。',
  },
  'zone.pool': {
    title: '供給池區域',
    body: '執行時顯示指定 Token 的剩餘供給量（殘量＝供給總量−所有玩家持有−牌堆）。適合做「公共礦坑／銀行」這種共享資源。',
  },
};
