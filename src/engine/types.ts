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
  properties?: Record<string, any>;
}

export interface Action {
  id: string;
  name: string;
  parameters: string[];
  effect: string;
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
}

export interface Turn {
  currentPlayerId: string;
  actionsPerTurn: number;
}

export interface GameModule {
  gameName: GameName;
  players: Player[];
  tokens: Token[];
  actions: Action[];
  rules: Rule[];
  turn: Turn;
}

export interface GameState {
  module: GameModule;
  currentPlayer: Player;
  gameBoard: Token[];
  eventLog: string[];
  gameOver: boolean;
  winner?: Player;
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
  id: string;
  type: 'token' | 'card' | 'dice';
  position: Position;
  properties: Record<string, any>;
}

