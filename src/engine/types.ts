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
  properties?: Record<string, any>;
}

export type ActionType =
  | 'gainToken'    // 玩家獲得 Token
  | 'spendToken'   // 玩家消耗 Token
  | 'tradeToken'   // 消耗 A 換得 B
  | 'rollDice'     // 擲骰子
  | 'drawCard'     // 抽牌
  | 'moveToken'    // 移動 Token（棋盤）
  | 'setVariable'  // 設定遊戲變數
  | 'addVariable'; // 增加遊戲變數

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
  trigger: 'onActionEnd' | 'onTurnEnd' | 'onObjectChange';
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

export interface BoardConfig {
  width: number;     // 工作區寬度 (px)
  height: number;    // 工作區高度 (px)
  gridSize: number;  // 格線間距 (px)
  showGrid: boolean;
  backgroundColor?: string;  // 棋盤背景色
}

export interface CardPile {
  id: string;
  name: string;
  cards: string[];   // tokenId 列表（可重複）
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
  pilesState: Record<string, string[]>;  // pileId → 剩餘牌堆
  variablesState: Record<string, number>;  // variableId → 當前值
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
