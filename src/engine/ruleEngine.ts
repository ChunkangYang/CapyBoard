import { GameModule, GameState, Player, Condition, GameAction, TurnRecord, BoardCell } from './types';

export class RuleEngine {
  private gameState: GameState;

  constructor(gameModule: GameModule) {
    const players = gameModule.players;
    const pilesState: Record<string, string[]> = {};
    for (const pile of gameModule.piles ?? []) {
      pilesState[pile.id] = [...pile.cards];
    }

    const variablesState: Record<string, number> = {};
    for (const v of gameModule.variables ?? []) {
      variablesState[v.id] = v.defaultValue;
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
      variablesState,
      tokenPositions: {},
    };
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  /** 供給殘量 = supply − Σ所有玩家持有 − Σ所有牌堆中該 token。
   *  token.supply 為 undefined → 回傳 null（無限供給，不受限）。
   *  純衍生，不存第二份真相。 */
  public getSupplyRemaining(tokenId: string): number | null {
    const token = this.gameState.module.tokens.find(t => t.id === tokenId);
    if (!token || token.supply === undefined) return null;
    let held = 0;
    for (const p of this.gameState.module.players) {
      held += p.tokens.filter(t => t === tokenId).length;
    }
    for (const pile of Object.values(this.gameState.pilesState)) {
      held += pile.filter(t => t === tokenId).length;
    }
    return token.supply - held;
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
        const remaining = this.getSupplyRemaining(tokenId);
        if (remaining !== null && remaining < count) {
          this.addEventLog(`失敗：${token?.name ?? tokenId} 供給不足（需要 ${count}，供給池剩 ${remaining}）`);
          return false;
        }
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
        // 換得端尊重供給上限（換出端釋放的數量會先回補殘量）
        const toRemaining = this.getSupplyRemaining(toTokenId);
        const freedBySpend = fromTokenId === toTokenId ? fromCount : 0;
        if (toRemaining !== null && toRemaining + freedBySpend < toCount) {
          this.addEventLog(`失敗：${toToken?.name ?? toTokenId} 供給不足（需要 ${toCount}，供給池剩 ${toRemaining + freedBySpend}）`);
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
          // 直接獲得指定 token（鑄造，尊重供給上限）
          const token = this.gameState.module.tokens.find(t => t.id === tokenId);
          const remaining = this.getSupplyRemaining(tokenId);
          if (remaining !== null && remaining < 1) {
            this.addEventLog(`失敗：${token?.name ?? tokenId} 供給不足（供給池已空）`);
            return false;
          }
          p.tokens.push(tokenId);
          this.addEventLog(`抽牌：獲得 ${token?.name ?? tokenId}`);
        }
        break;
      }
      case 'moveToken': {
        const { tokenId, steps = 1, absolute } = params;
        const token = this.gameState.module.tokens.find(t => t.id === tokenId);
        const cells = this.gameState.module.boardConfig?.cells ?? [];
        if (cells.length === 0) {
          this.addEventLog(`移動 ${token?.name ?? tokenId}（尚未設定格子序列）`);
          break;
        }
        const cellCount = cells.length;
        const current = this.gameState.tokenPositions[tokenId] ?? -1;

        let nextIndex: number;
        if (absolute !== undefined) {
          // 絕對跳躍到指定格
          nextIndex = Math.max(0, Math.min(cellCount - 1, absolute));
        } else {
          // 步進：從當前位置前進 N 格（未進場視為從 -1 出發）
          nextIndex = ((current + steps) % cellCount + cellCount) % cellCount;
        }

        // 計算經過的格子（用於 onPass 觸發）
        const passed: number[] = [];
        if (current >= 0 && steps > 1) {
          for (let i = 1; i < steps; i++) {
            passed.push(((current + i) % cellCount + cellCount) % cellCount);
          }
        }

        this.gameState.tokenPositions[tokenId] = nextIndex;
        const landedCell = cells[nextIndex];
        this.addEventLog(`${token?.name ?? tokenId} 移動 ${steps > 0 ? '+' : ''}${steps} 格，落在「${landedCell?.name ?? `格子${nextIndex}`}」（index ${nextIndex}）`);

        // 記錄落地資訊，供 onTokenLand 規則使用
        this.gameState.lastLandedCell = { tokenId, cellIndex: nextIndex };

        // 先觸發 onPass（經過的格子）
        for (const passIdx of passed) {
          const passCell = cells[passIdx];
          if (passCell?.events) {
            for (const evt of passCell.events) {
              if (evt.trigger === 'onPass') this.executeGameAction(evt.action);
            }
          }
        }

        // 觸發落地格子的 CellEvent（onLand）
        if (landedCell?.events) {
          for (const evt of landedCell.events) {
            if (evt.trigger === 'onLand') this.executeGameAction(evt.action);
          }
        }

        // 觸發 onTokenLand 規則（開發者在規則編輯器定義的規則）
        this.triggerRules('onTokenLand');
        break;
      }
      case 'setVariable': {
        const { variableId, value = 0 } = params;
        const v = this.gameState.module.variables?.find(v => v.id === variableId);
        this.gameState.variablesState[variableId] = value;
        this.addEventLog(`設定變數「${v?.name ?? variableId}」= ${value}`);
        break;
      }
      case 'addVariable': {
        const { variableId, amount = 1 } = params;
        const v = this.gameState.module.variables?.find(v => v.id === variableId);
        const prev = this.gameState.variablesState[variableId] ?? 0;
        this.gameState.variablesState[variableId] = prev + amount;
        this.addEventLog(`變數「${v?.name ?? variableId}」${amount >= 0 ? '+' : ''}${amount}（現在：${prev + amount}）`);
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
      case 'and': {
        const conditions: Condition[] = condition.conditions ?? [];
        return conditions.every(c => this.evaluateCondition(c));
      }
      case 'or': {
        const conditions: Condition[] = condition.conditions ?? [];
        return conditions.some(c => this.evaluateCondition(c));
      }
      case 'hasVariable': {
        const { variableId, amount = 0, operator = '>=' } = condition;
        const val = this.gameState.variablesState[variableId] ?? 0;
        switch (operator) {
          case '>=':  return val >= amount;
          case '>':   return val >  amount;
          case '<=':  return val <= amount;
          case '<':   return val <  amount;
          case '===': return val === amount;
          default:    return false;
        }
      }
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
      case 'tokenAtCellIndex': {
        // 格子序列：token 是否在第 N 格
        const { tokenId: tId1, cellIndex } = condition;
        return (this.gameState.tokenPositions[tId1 as string] ?? -1) === cellIndex;
      }
      case 'tokenOnCellType': {
        // 格子序列：token 是否落在某類型的格子
        const { tokenId: tId2, cellType } = condition;
        const tokenId = tId2 as string;
        const idx = this.gameState.tokenPositions[tokenId] ?? -1;
        if (idx < 0) return false;
        const cell = (this.gameState.module.boardConfig?.cells ?? [])[idx];
        return cell?.type === cellType;
      }
      default:
        return false;
    }
  }

  private triggerChainDepth = 0;
  private readonly MAX_CHAIN_DEPTH = 5;

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
      case 'setVariable': {
        const v = this.gameState.module.variables?.find(v => v.id === action.variableId);
        const val = action.value ?? 0;
        this.gameState.variablesState[action.variableId!] = val;
        this.addEventLog(`設定變數「${v?.name ?? action.variableId}」= ${val}`);
        break;
      }
      case 'addVariable': {
        const v = this.gameState.module.variables?.find(v => v.id === action.variableId);
        const prev = this.gameState.variablesState[action.variableId!] ?? 0;
        const amt = action.amount ?? 1;
        this.gameState.variablesState[action.variableId!] = prev + amt;
        this.addEventLog(`變數「${v?.name ?? action.variableId}」${amt >= 0 ? '+' : ''}${amt}（現在：${prev + amt}）`);
        break;
      }
      case 'triggerRule': {
        if (this.triggerChainDepth >= this.MAX_CHAIN_DEPTH) {
          this.addEventLog('警告：觸發鏈深度超過上限，已停止');
          break;
        }
        const rule = this.gameState.module.rules.find(r => r.id === action.ruleId);
        if (!rule) {
          this.addEventLog(`觸發鏈：找不到規則 ${action.ruleId}`);
          break;
        }
        this.addEventLog(`觸發鏈：執行規則「${rule.id}」`);
        this.triggerChainDepth++;
        if (this.evaluateCondition(rule.condition)) {
          this.executeGameAction(rule.action);
        }
        this.triggerChainDepth--;
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
    const variablesState: Record<string, number> = {};
    for (const v of module.variables ?? []) {
      variablesState[v.id] = v.defaultValue;
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
      variablesState,
      tokenPositions: {},
    };
    this.addEventLog('遊戲重新開始');
  }

  /** 載入快照（用於 rewind） */
  public loadState(snapshot: GameState): void {
    this.gameState = JSON.parse(JSON.stringify(snapshot));
  }

  /** 直接修改玩家狀態（測試用） */
  public patchPlayer(playerId: string, patch: { score?: number; tokens?: string[] }): void {
    const player = this.gameState.module.players.find(p => p.id === playerId);
    if (!player) return;
    if (patch.score !== undefined) player.score = patch.score;
    if (patch.tokens !== undefined) player.tokens = [...patch.tokens];
    // 同步 currentPlayer 參照
    if (this.gameState.currentPlayer.id === playerId) {
      this.gameState.currentPlayer = player;
    }
    this.addEventLog(`（測試）修改玩家「${player.name}」狀態`);
  }
}
