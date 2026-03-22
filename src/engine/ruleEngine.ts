import { GameModule, GameState, Player, Rule, Condition, GameAction } from './types';

export class RuleEngine {
  private gameState: GameState;

  constructor(gameModule: GameModule) {
    this.gameState = {
      module: gameModule,
      currentPlayer: gameModule.players.find(p => p.id === gameModule.turn.currentPlayerId)!,
      gameBoard: [],
      eventLog: [],
      gameOver: false,
    };
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public executeAction(actionId: string, parameters: Record<string, any>): boolean {
    const action = this.gameState.module.actions.find(a => a.id === actionId);
    if (!action) {
      this.addEventLog(`錯誤：找不到動作 ${actionId}`);
      return false;
    }

    // 執行動作
    this.addEventLog(`玩家 ${this.gameState.currentPlayer.name} 執行 ${action.name}`);
    
    if (actionId === 'buyToken') {
      const tokenId = parameters.tokenId;
      const token = this.gameState.module.tokens.find(t => t.id === tokenId);
      if (token) {
        this.gameState.currentPlayer.tokens.push(tokenId);
        this.addEventLog(`獲得 ${token.name}`);
      }
    }

    // 觸發 onActionEnd 規則
    this.triggerRules('onActionEnd');
    
    return true;
  }

  public endTurn(): void {
    this.addEventLog(`回合結束：${this.gameState.currentPlayer.name}`);
    
    // 觸發 onTurnEnd 規則
    this.triggerRules('onTurnEnd');
    
    // 切換玩家
    const currentIndex = this.gameState.module.players.findIndex(p => p.id === this.gameState.currentPlayer.id);
    const nextIndex = (currentIndex + 1) % this.gameState.module.players.length;
    this.gameState.currentPlayer = this.gameState.module.players[nextIndex];
    this.gameState.module.turn.currentPlayerId = this.gameState.currentPlayer.id;
    
    this.addEventLog(`新回合開始：${this.gameState.currentPlayer.name}`);
  }

  private triggerRules(trigger: string): void {
    const rules = this.gameState.module.rules.filter(rule => rule.trigger === trigger);
    
    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition)) {
        this.executeGameAction(rule.action);
      }
    }
  }

  private evaluateCondition(condition: Condition): boolean {
    switch (condition.type) {
      case 'hasTokenCount':
        const tokenId = condition.tokenId!;
        const requiredCount = condition.count!;
        const playerTokenCount = this.gameState.currentPlayer.tokens.filter(t => t === tokenId).length;
        return playerTokenCount >= requiredCount;
      
      default:
        return false;
    }
  }

  private executeGameAction(action: GameAction): void {
    switch (action.type) {
      case 'winGame':
        const playerId = action.playerId === '{currentPlayer}' 
          ? this.gameState.currentPlayer.id 
          : action.playerId!;
        const winner = this.gameState.module.players.find(p => p.id === playerId);
        if (winner) {
          this.gameState.winner = winner;
          this.gameState.gameOver = true;
          this.addEventLog(`遊戲結束！勝利者：${winner.name}`);
        }
        break;
      
      default:
        this.addEventLog(`執行動作：${action.type}`);
    }
  }

  private addEventLog(message: string): void {
    this.gameState.eventLog.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  public getCurrentPlayer(): Player {
    return this.gameState.currentPlayer;
  }

  public isGameOver(): boolean {
    return this.gameState.gameOver;
  }

  public getWinner(): Player | undefined {
    return this.gameState.winner;
  }

  public getEventLog(): string[] {
    return this.gameState.eventLog;
  }

  public resetGame(): void {
    this.gameState = {
      module: this.gameState.module,
      currentPlayer: this.gameState.module.players.find(p => p.id === this.gameState.module.turn.currentPlayerId)!,
      gameBoard: [],
      eventLog: [],
      gameOver: false,
    };
    this.addEventLog('遊戲重新開始');
  }
}


