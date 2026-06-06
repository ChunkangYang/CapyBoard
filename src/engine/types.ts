export interface GameName {
  zh: string;
  en: string;
}

export interface Player {
  id: string;
  name: string;
  tokens: string[];
  score: number;
}

export interface Token {
  id: string;
  name: string;
  type: 'resource' | 'card' | 'dice' | 'custom';
  icon?: string;  // emoji 或文字圖示，例如 '⚔️' '🪙'
  supply?: number;  // 有限供給總量；undefined = 無限（鑄造不受限，維持現狀）
  properties?: Record<string, any>;
}

export type ActionType =
  | 'gainToken'    // 玩家獲得 Token
  | 'spendToken'   // 玩家消耗 Token
  | 'tradeToken'   // 消耗 A 換得 B
  | 'rollDice'     // 擲骰子
  | 'drawCard'     // 抽牌
  | 'moveToken'    // 移動 Token（棋盤格子序列）
  | 'setVariable'  // 設定遊戲變數
  | 'addVariable'; // 增加遊戲變數

// ─── 格子系統 ──────────────────────────────────────────────────────────────────

/** 格子事件：token 落到格子時自動觸發的 system action */
export interface CellEvent {
  trigger: 'onLand' | 'onPass';  // 落地觸發 | 經過觸發
  action: GameAction;
}

/** 預設格子類型範本 */
export type CellTemplateType =
  | 'empty'         // 空白格（無事發生）
  | 'start'         // 起點
  | 'end'           // 終點（可配合 winGame）
  | 'bonus_score'   // 加分格
  | 'penalty_score' // 扣分格
  | 'bonus_token'   // 獲得 Token
  | 'penalty_token' // 失去 Token
  | 'draw_card'     // 抽牌
  | 'custom';       // 自訂（手動設定 events）

/** 棋盤格子 — 以 index 序列為主，視覺位置由前端自訂 */
export interface BoardCell {
  index: number;              // 0-based 序列編號
  name: string;               // 顯示名稱，例如「起點」「+10分」
  type: CellTemplateType;     // 格子類型
  properties?: Record<string, any>;  // 類型相關參數（如 amount、tokenId）
  events?: CellEvent[];       // 落地/經過時自動觸發的 system actions
}

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  params: Record<string, any>;
}

export interface Condition {
  type: string;
  tokenId?: string;
  count?: number;
  [key: string]: any;
}

export interface GameAction {
  type: string;
  playerId?: string;
  [key: string]: any;
}

export interface Rule {
  id: string;
  trigger: 'onActionEnd' | 'onTurnEnd' | 'onObjectChange' | 'onTokenLand';
  condition: Condition;
  action: GameAction;
  priority?: number;  // 數字越大越優先，預設 0
}

export interface Turn {
  currentPlayerId: string;
  actionsPerTurn: number;
}

export interface GameVariable {
  id: string;
  name: string;
  defaultValue: number;
}

export interface BoardTheme {
  primaryColor?: string;  // hex color, e.g. '#3b82f6'
  boardBackground?: string;  // hex color or css color
}

/** 棋盤區域 — 執行時即時計數的可視框（玩家資源區 / 共享供給池）。
 *  只描述「畫在哪、歸誰」，不存任何數量；數量永遠即時讀真相層。 */
export interface BoardZone {
  id: string;
  kind: 'player' | 'pool';
  rect: { x: number; y: number; width: number; height: number };
  playerId?: string;     // kind==='player'：歸屬玩家
  tokenIds?: string[];   // kind==='pool'：顯示哪些 token（空 = 全部有 supply 的 token）
  label?: string;
  display?: 'count' | 'stack';  // 數字 or 堆疊；預設 count
}

export interface BoardConfig {
  width: number;     // 工作區寬度 (px)
  height: number;    // 工作區高度 (px)
  gridSize: number;  // 格線間距 (px)
  showGrid: boolean;
  backgroundColor?: string;  // 棋盤背景色
  cells?: BoardCell[];        // 格子序列（index 0, 1, 2, ... N）
  zones?: BoardZone[];        // 玩家區 / 供給池區（執行時即時計數）
}

export interface CardPile {
  id: string;
  name: string;
  cards: string[];   // tokenId 列表（可重複）
}

/** 垃圾桶項目：被刪除的東西暫存於此，可還原或永久清空 */
export type TrashKind = 'token' | 'action' | 'player' | 'variable' | 'cell' | 'boardItem' | 'zone';

export interface TrashItem {
  trashId: string;
  kind: TrashKind;
  label: string;       // 顯示名稱
  payload: any;        // 還原所需資料
  deletedAt: string;   // ISO 時間
}

export interface GameModule {
  gameName: GameName;
  players: Player[];
  tokens: Token[];
  actions: Action[];
  rules: Rule[];
  turn: Turn;
  board?: BoardLayout;
  boardConfig?: BoardConfig;
  piles?: CardPile[];
  variables?: GameVariable[];
  theme?: BoardTheme;
  trash?: TrashItem[];
}

export interface TurnRecord {
  playerName: string;
  turnNumber: number;
  actionsLog: string[];
}

export interface GameState {
  module: GameModule;
  currentPlayer: Player;
  gameBoard: Token[];
  eventLog: string[];
  gameOver: boolean;
  winner?: Player;
  losers: string[];
  actionsUsedThisTurn: number;
  turnCounts: Record<string, number>;  // playerId → 已完成的回合數
  phase: 'setup' | 'playing' | 'ended';
  turnHistory: TurnRecord[];
  currentTurnActions: string[];
  lastDiceResult?: { sides: number; result: number };
  pilesState: Record<string, string[]>;     // pileId → 剩餘牌堆
  variablesState: Record<string, number>;   // variableId → 當前值
  tokenPositions: Record<string, number>;   // tokenId → 當前格子 index（-1 = 未進入棋盤）
  lastLandedCell?: { tokenId: string; cellIndex: number };  // 最後一次落地資訊
}

export interface DragItem {
  type: 'token' | 'card' | 'dice';
  id: string;
  name: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface BoardItem {
  instanceId: string;
  id: string;
  type: 'token' | 'card' | 'dice';
  position: Position;
  properties: Record<string, any>;
}

export interface BoardLayout {
  items: BoardItem[];
}
