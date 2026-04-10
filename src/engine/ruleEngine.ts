import { GameModule, GameState, Player, Condition, GameAction, TurnRecord } from './types';

export class RuleEngine {
  private gameState: GameState;

  constructor(gameModule: GameModule) {
    const players = gameModule.players;
    const pilesState: Record<string, string[]> = {};
    for (const pile of gameModule.piles ?? []) {
      pilesState[pile.id] = [...pile.cards];
    }

    this.gameState = {
      module: gameModule,
      currentPlayer: players.find(p => p.id === gameModule.turn.currentPlayerId)!,
      gameBoard: [],
      eventLog: [],
      gameOver: false,
      losers: [],
      actionsUsedThisTurn: 0,
      turnCounts: Object.fromEntries(players.map(p => [p.id, 0])),
      phase: 'setup',
      turnHistory: [],
      currentTurnActions: [],
      pilesState,
    };
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public startGame(): void {
    this.gameState.phase = 'playing';
    this.addEventLog('遊戲開始！');
    this.addEventLog(`第一回合：${this.gameState.currentPlayer.name}`);
  }

  public executeAction(actionId: string): boolean {
    if (this.gameState.gameOver) return false;
    if (this.gameState.phase !== 'playing') return false;

    const action = this.gameState.module.actions.find(a => a.id === actionId);
    if (!action) {
      this.addEventLog(`錯誤：找不到動作 ${actionId}`);
      return false;
    }

    // actionsPerTurn 限制
    const limit = this.gameState.module.turn.actionsPerTurn;
    if (limit > 0 && this.gameState.actionsUsedThisTurn >= limit) {
      this.addEventLog(`本回合行動次數已達上限（${limit} 次）`);
      return false;
    }

    this.addEventLog(`${this.gameState.currentPlayer.name} 執行「${action.name}」`);

    const p = this.gameState.currentPlayer;
    const params = action.params ?? {};

    switch (action.type) {
      case 'gainToken': {
        const { tokenId, count = 1 } = params;
        const token = this.gameState.module.tokens.find(t => t.id === tokenId);
        for (let i = 0; i < count; i++) p.tokens.push(tokenId);
        this.addEventLog(`獲得 ${token?.name ?? tokenId} ×${count}`);
        break;
      }
      case 'spendToken': {
        const { tokenId, count = 1 } = params;
        const token = this.gameState.module.tokens.find(t => t.id === tokenId);
        const owned = p.tokens.filter(t => t === tokenId).length;
        if (owned < count) {
          this.addEventLog(`失敗：${token?.name ?? tokenId} 不足（需要 ${count}，擁有 ${owned}）`);
          return false;
        }
        let removed = 0;
        p.tokens = p.tokens.filter(t => {
          if (t === tokenId && removed < count) { removed++; return false; }
          return true;
        });
        this.addEventLog(`消耗 ${token?.name ?? tokenId} ×${count}`);
        break;
      }
      case 'tradeToken': {
        const { fromTokenId, fromCount = 1, toTokenId, toCount = 1 } = params;
        const fromToken = this.gameState.module.tokens.find(t => t.id === fromTokenId);
        const toToken   = this.gameState.module.tokens.find(t => t.id === toTokenId);
        const owned = p.tokens.filter(t => t === fromTokenId).length;
        if (owned < fromCount) {
          this.addEventLog(`失敗：${fromToken?.name ?? fromTokenId} 不足（需要 ${fromCount}，擁有 ${owned}）`);
          return false;
        }
        let removed = 0;
        p.tokens = p.tokens.filter(t => {
          if (t === fromTokenId && removed < fromCount) { removed++; return false; }
          return true;
        });
        for (let i = 0; i < toCount; i++) p.tokens.push(toTokenId);
        this.addEventLog(`交易：${fromToken?.name ?? fromTokenId} ×${fromCount} → ${toToken?.name ?? toTokenId} ×${toCount}`);
        break;
      }
      case 'rollDice': {
        const { sides = 6 } = params;
        const result = Math.floor(Math.random() * sides) + 1;
        this.gameState.lastDiceResult = { sides, result };
        this.addEventLog(`擲骰（d${sides}）：結果 ${result}`);
        break;
      }
      case 'drawCard': {
        const { tokenId, pileId } = params;
        if (pileId && this.gameState.pilesState[pileId]) {
          // 從牌堆抽牌
          const pile = this.gameState.pilesState[pileId];
          if (pile.length === 0) {
            this.addEventLog(`牌堆「${pileId}」已無牌`);
            return false;
          }
          const idx = Math.floor(Math.random() * pile.length);
          const drawnId = pile.splice(idx, 1)[0];
          p.tokens.push(drawnId);
          const drawn = this.gameState.module.tokens.find(t => t.id === drawnId);
          this.addEventLog(`從牌堆抽牌：${drawn?.name ?? drawnId}（剩餘 ${pile.length} 張）`);
        } else if (tokenId) {
          // 直接獲得指定 token
          p.tokens.push(tokenId);
          const token = this.gameState.module.tokens.find(t => t.id === tokenId);
          this.addEventLog(`抽牌：獲得 ${token?.name ?? tokenId}`);
        }
        break;
      }
      case 'moveToken': {
        const { tokenId } = params;
        const token = this.gameState.module.tokens.find(t => t.id === tokenId);
        this.addEventLog(`移動 ${token?.name ?? tokenId}（棋盤功能將於後續版本實作）`);
        break;
      }
      default:
        this.addEventLog(`未知動作類型：${(action as any).type}`);
    }

    this.gameState.actionsUsedThisTurn++;
    this.gameState.currentTurnActions.push(action.name);
    this.triggerRules('onActionEnd');
    return true;
  }

  public endTurn(): void {
    if (this.gameState.phase !== 'playing') return;
    this.addEventLog(`回合結束：${this.gameState.currentPlayer.name}`);
    this.triggerRules('onTurnEnd');

    // 記錄回合歷史
    const cid = this.gameState.currentPlayer.id;
    const turnNum = (this.gameState.turnCounts[cid] ?? 0) + 1;
    const record: TurnRecord = {
      playerName: this.gameState.currentPlayer.name,
      turnNumber: turnNum,
      actionsLog: [...this.gameState.currentTurnActions],
    };
    this.gameState.turnHistory.unshift(record); // 最新的在前

    // 累計回合數
    this.gameState.turnCounts[cid] = turnNum;

    // 切換玩家
    const currentIndex = this.gameState.module.players.findIndex(p => p.id === cid);
    const nextIndex = (currentIndex + 1) % this.gameState.module.players.length;
    this.gameState.currentPlayer = this.gameState.module.players[nextIndex];
    this.gameState.module.turn.currentPlayerId = this.gameState.currentPlayer.id;
    this.gameState.actionsUsedThisTurn = 0;
    this.gameState.currentTurnActions = [];
    this.gameState.lastDiceResult = undefined;

    if (!this.gameState.gameOver) {
      this.addEventLog(`新回合：${this.gameState.currentPlayer.name}`);
    }
  }

  private triggerRules(trigger: string): void {
    const rules = this.gameState.module.rules
      .filter(r => r.trigger === trigger)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    for (const rule of rules) {
      if (this.gameState.gameOver) break;
      if (this.evaluateCondition(rule.condition)) {
        this.executeGameAction(rule.action);
      }
    }
  }

  private evaluateCondition(condition: Condition): boolean {
    switch (condition.type) {
      case 'hasTokenCount': {
        const count = this.gameState.currentPlayer.tokens.filter(t => t === condition.tokenId).length;
        return count >= (condition.count ?? 1);
      }
      case 'hasScore': {
        const { playerId, amount = 0, operator = '>=' } = condition;
        const player = playerId === '{currentPlayer}'
          ? this.gameState.currentPlayer
          : this.gameState.module.players.find(p => p.id === playerId);
        if (!player) return false;
        switch (operator) {
          case '>=':  return player.score >= amount;
          case '>':   return player.score >  amount;
          case '<=':  return player.score <= amount;
          case '<':   return player.score <  amount;
          case '===': return player.score === amount;
          default:    return false;
        }
      }
      case 'playerTurnCount': {
        const { playerId, count = 1, operator = '>=' } = condition;
        const pid = playerId === '{currentPlayer}' ? this.gameState.currentPlayer.id : playerId;
        const turns = this.gameState.turnCounts[pid] ?? 0;
        switch (operator) {
          case '>=':  return turns >= count;
          case '>':   return turns >  count;
          case '<=':  return turns <= count;
          case '<':   return turns <  count;
          case '===': return turns === count;
          default:    return false;
        }
      }
      case 'tokenAtPosition': {
        // 棋盤位置檢查：檢查 boardItems 中特定 token 是否在指定格子
        const { tokenId, gridX, gridY } = condition;
        const items = this.gameState.module.board?.items ?? [];
        const gridSize = this.gameState.module.boardConfig?.gridSize ?? 20;
        return items.some(item => {
          if (item.id !== tokenId) return false;
          const itemGridX = Math.round(item.position.x / gridSize);
          const itemGridY = Math.round(item.position.y / gridSize);
          return itemGridX === gridX && itemGridY === gridY;
        });
      }
      default:
        return false;
    }
  }

  private executeGameAction(action: GameAction): void {
    switch (action.type) {
      case 'winGame': {
        const playerId = action.playerId === '{currentPlayer}'
          ? this.gameState.currentPlayer.id
          : action.playerId!;
        const winner = this.gameState.module.players.find(p => p.id === playerId);
        if (winner) {
          this.gameState.winner = winner;
          this.gameState.gameOver = true;
          this.gameState.phase = 'ended';
          this.addEventLog(`遊戲結束！勝利者：${winner.name}`);
        }
        break;
      }
      case 'loseGame': {
        const playerId = action.playerId === '{currentPlayer}'
          ? this.gameState.currentPlayer.id
          : action.playerId!;
        const loser = this.gameState.module.players.find(p => p.id === playerId);
        if (loser && !this.gameState.losers.includes(loser.id)) {
          this.gameState.losers.push(loser.id);
          this.addEventLog(`${loser.name} 落敗出局！`);
          // 若只剩一人未落敗，該人勝利
          const activePlayers = this.gameState.module.players.filter(
            p => !this.gameState.losers.includes(p.id)
          );
          if (activePlayers.length === 1) {
            this.gameState.winner = activePlayers[0];
            this.gameState.gameOver = true;
            this.gameState.phase = 'ended';
            this.addEventLog(`遊戲結束！勝利者：${activePlayers[0].name}`);
          } else if (activePlayers.length === 0) {
            this.gameState.gameOver = true;
            this.gameState.phase = 'ended';
            this.addEventLog('遊戲結束！平局');
          }
        }
        break;
      }
      case 'addScore': {
        const playerId = action.playerId === '{currentPlayer}'
          ? this.gameState.currentPlayer.id
          : action.playerId!;
        const player = this.gameState.module.players.find(p => p.id === playerId);
        const amount = action.amount ?? 1;
        if (player) {
          player.score += amount;
          this.addEventLog(`${player.name} 獲得 ${amount} 分（總分：${player.score}）`);
        }
        break;
      }
      default:
        this.addEventLog(`執行規則動作：${action.type}`);
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
    const module = JSON.parse(JSON.stringify(this.gameState.module));
    const pilesState: Record<string, string[]> = {};
    for (const pile of module.piles ?? []) {
      pilesState[pile.id] = [...pile.cards];
    }
    this.gameState = {
      module,
      currentPlayer: module.players.find((p: Player) => p.id === module.turn.currentPlayerId)!,
      gameBoard: [],
      eventLog: [],
      gameOver: false,
      losers: [],
      actionsUsedThisTurn: 0,
      turnCounts: Object.fromEntries(module.players.map((p: Player) => [p.id, 0])),
      phase: 'setup',
      turnHistory: [],
      currentTurnActions: [],
      pilesState,
    };
    this.addEventLog('遊戲重新開始');
  }
}
