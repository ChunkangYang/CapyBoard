import { RuleEngine } from '../ruleEngine';
import { GameModule } from '../types';

// ── helpers ────────────────────────────────────────────────────────────────────
function makeModule(overrides: Partial<GameModule> = {}): GameModule {
  return {
    gameName: { zh: '測試遊戲', en: 'Test Game' },
    players: [
      { id: 'p1', name: '玩家1', tokens: [], score: 0 },
      { id: 'p2', name: '玩家2', tokens: [], score: 0 },
    ],
    tokens: [
      { id: 'gold', name: '金幣', type: 'resource' },
      { id: 'gem',  name: '寶石', type: 'resource' },
    ],
    actions: [],
    rules: [],
    turn: { currentPlayerId: 'p1', actionsPerTurn: 0 },
    ...overrides,
  };
}

// ── Basic flow ─────────────────────────────────────────────────────────────────
describe('RuleEngine — 基本流程', () => {
  test('初始化後 phase 為 setup', () => {
    const engine = new RuleEngine(makeModule());
    expect(engine.getGameState().phase).toBe('setup');
  });

  test('startGame 後 phase 為 playing', () => {
    const engine = new RuleEngine(makeModule());
    engine.startGame();
    expect(engine.getGameState().phase).toBe('playing');
  });

  test('setup 階段無法執行動作', () => {
    const mod = makeModule({
      actions: [{ id: 'a1', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
    });
    const engine = new RuleEngine(mod);
    const ok = engine.executeAction('a1');
    expect(ok).toBe(false);
  });
});

// ── Actions ────────────────────────────────────────────────────────────────────
describe('RuleEngine — 動作執行', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    const mod = makeModule({
      actions: [
        { id: 'gain1', name: '取金', type: 'gainToken',  params: { tokenId: 'gold', count: 2 } },
        { id: 'spend1', name: '花金', type: 'spendToken', params: { tokenId: 'gold', count: 1 } },
        { id: 'trade1', name: '兌換', type: 'tradeToken', params: { fromTokenId: 'gold', fromCount: 2, toTokenId: 'gem', toCount: 1 } },
        { id: 'dice1',  name: '擲骰', type: 'rollDice',   params: { sides: 6 } },
      ],
    });
    engine = new RuleEngine(mod);
    engine.startGame();
  });

  test('gainToken 增加玩家 token', () => {
    engine.executeAction('gain1');
    const tokens = engine.getCurrentPlayer().tokens;
    expect(tokens.filter(t => t === 'gold').length).toBe(2);
  });

  test('spendToken 減少玩家 token', () => {
    engine.executeAction('gain1'); // +2 gold
    engine.executeAction('spend1'); // -1 gold
    const tokens = engine.getCurrentPlayer().tokens;
    expect(tokens.filter(t => t === 'gold').length).toBe(1);
  });

  test('spendToken 不足時回傳 false 且不扣除', () => {
    const ok = engine.executeAction('spend1'); // 0 gold → fail
    expect(ok).toBe(false);
    expect(engine.getCurrentPlayer().tokens.length).toBe(0);
  });

  test('tradeToken 正確交換', () => {
    engine.executeAction('gain1'); // +2 gold
    engine.executeAction('gain1'); // +4 gold
    engine.executeAction('trade1'); // -2 gold +1 gem
    const p = engine.getCurrentPlayer();
    expect(p.tokens.filter(t => t === 'gold').length).toBe(2);
    expect(p.tokens.filter(t => t === 'gem').length).toBe(1);
  });

  test('rollDice 產生 1~sides 的結果', () => {
    engine.executeAction('dice1');
    const dice = engine.getGameState().lastDiceResult;
    expect(dice).toBeDefined();
    expect(dice!.result).toBeGreaterThanOrEqual(1);
    expect(dice!.result).toBeLessThanOrEqual(6);
  });
});

// ── Turn flow ──────────────────────────────────────────────────────────────────
describe('RuleEngine — 回合流程', () => {
  test('endTurn 切換到下一位玩家', () => {
    const engine = new RuleEngine(makeModule());
    engine.startGame();
    expect(engine.getCurrentPlayer().id).toBe('p1');
    engine.endTurn();
    expect(engine.getCurrentPlayer().id).toBe('p2');
    engine.endTurn();
    expect(engine.getCurrentPlayer().id).toBe('p1');
  });

  test('actionsPerTurn 限制動作次數', () => {
    const mod = makeModule({
      turn: { currentPlayerId: 'p1', actionsPerTurn: 1 },
      actions: [{ id: 'a1', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    const ok1 = engine.executeAction('a1');
    const ok2 = engine.executeAction('a1');
    expect(ok1).toBe(true);
    expect(ok2).toBe(false);
  });

  test('endTurn 重設行動次數', () => {
    const mod = makeModule({
      turn: { currentPlayerId: 'p1', actionsPerTurn: 1 },
      actions: [{ id: 'a1', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('a1');
    engine.endTurn();
    engine.endTurn(); // p2 → p1
    const ok = engine.executeAction('a1');
    expect(ok).toBe(true);
  });

  test('turnCounts 記錄完整回合', () => {
    const engine = new RuleEngine(makeModule());
    engine.startGame();
    engine.endTurn(); // p1 完成第1回合
    engine.endTurn(); // p2 完成第1回合
    const counts = engine.getGameState().turnCounts;
    expect(counts['p1']).toBe(1);
    expect(counts['p2']).toBe(1);
  });
});

// ── Conditions ─────────────────────────────────────────────────────────────────
describe('RuleEngine — 條件判斷', () => {
  test('hasTokenCount 達到數量時觸發勝利', () => {
    const mod = makeModule({
      actions: [
        { id: 'gain3', name: '取金x3', type: 'gainToken', params: { tokenId: 'gold', count: 3 } },
      ],
      rules: [{
        id: 'win_rule',
        trigger: 'onActionEnd',
        condition: { type: 'hasTokenCount', tokenId: 'gold', count: 3 },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain3');
    expect(engine.isGameOver()).toBe(true);
    expect(engine.getWinner()?.id).toBe('p1');
  });

  test('hasScore 觸發勝利', () => {
    const mod = makeModule({
      rules: [{
        id: 'score_win',
        trigger: 'onTurnEnd',
        condition: { type: 'hasScore', playerId: '{currentPlayer}', operator: '>=', amount: 10 },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    // 手動給分
    engine.patchPlayer('p1', { score: 10, tokens: [] });
    engine.endTurn();
    // endTurn 時 currentPlayer 還是 p1，觸發規則
    // 注意：endTurn 時 triggerRules('onTurnEnd') 在換玩家之前執行
    expect(engine.isGameOver()).toBe(true);
  });

  test('loseGame 讓玩家落敗', () => {
    const mod = makeModule({
      actions: [
        { id: 'lose1', name: '落敗', type: 'gainToken', params: { tokenId: 'gold', count: 1 } },
      ],
      rules: [{
        id: 'lose_rule',
        trigger: 'onActionEnd',
        condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
        action: { type: 'loseGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('lose1');
    // p1 落敗，p2 剩餘，p2 勝利
    expect(engine.isGameOver()).toBe(true);
    expect(engine.getWinner()?.id).toBe('p2');
  });

  test('addScore 規則動作正確加分', () => {
    const mod = makeModule({
      actions: [
        { id: 'gain1', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } },
      ],
      rules: [{
        id: 'score_rule',
        trigger: 'onActionEnd',
        condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
        action: { type: 'addScore', playerId: '{currentPlayer}', amount: 5 },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain1');
    const player = engine.getCurrentPlayer();
    expect(player.score).toBe(5);
  });
});

// ── Variables ──────────────────────────────────────────────────────────────────
describe('RuleEngine — 變數系統', () => {
  test('初始化時載入 defaultValue', () => {
    const mod = makeModule({ variables: [{ id: 'hp', name: '血量', defaultValue: 10 }] });
    const engine = new RuleEngine(mod);
    expect(engine.getGameState().variablesState['hp']).toBe(10);
  });

  test('setVariable 動作設定變數值', () => {
    const mod = makeModule({
      variables: [{ id: 'hp', name: '血量', defaultValue: 10 }],
      actions: [{ id: 'set_hp', name: '設血量', type: 'setVariable', params: { variableId: 'hp', value: 5 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('set_hp');
    expect(engine.getGameState().variablesState['hp']).toBe(5);
  });

  test('addVariable 動作增加變數值', () => {
    const mod = makeModule({
      variables: [{ id: 'hp', name: '血量', defaultValue: 10 }],
      actions: [{ id: 'add_hp', name: '加血', type: 'addVariable', params: { variableId: 'hp', amount: 3 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('add_hp');
    expect(engine.getGameState().variablesState['hp']).toBe(13);
  });

  test('addVariable 支援負數（扣血）', () => {
    const mod = makeModule({
      variables: [{ id: 'hp', name: '血量', defaultValue: 10 }],
      actions: [{ id: 'dmg', name: '受傷', type: 'addVariable', params: { variableId: 'hp', amount: -3 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('dmg');
    expect(engine.getGameState().variablesState['hp']).toBe(7);
  });

  test('hasVariable 條件觸發規則', () => {
    const mod = makeModule({
      variables: [{ id: 'round', name: '回合數', defaultValue: 0 }],
      actions: [{ id: 'inc', name: '加計', type: 'addVariable', params: { variableId: 'round', amount: 1 } }],
      rules: [{
        id: 'round_win',
        trigger: 'onActionEnd',
        condition: { type: 'hasVariable', variableId: 'round', operator: '>=', amount: 3 },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('inc');
    engine.executeAction('inc');
    expect(engine.isGameOver()).toBe(false);
    engine.executeAction('inc'); // round = 3, 觸發 winGame
    expect(engine.isGameOver()).toBe(true);
  });

  test('resetGame 重置變數到 defaultValue', () => {
    const mod = makeModule({
      variables: [{ id: 'hp', name: '血量', defaultValue: 10 }],
      actions: [{ id: 'dmg', name: '受傷', type: 'addVariable', params: { variableId: 'hp', amount: -5 } }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('dmg');
    engine.resetGame();
    expect(engine.getGameState().variablesState['hp']).toBe(10);
  });
});

// ── AND/OR conditions ──────────────────────────────────────────────────────────
describe('RuleEngine — AND/OR 條件組合', () => {
  test('AND 條件全部成立時觸發', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 3 } }],
      rules: [{
        id: 'and_rule',
        trigger: 'onActionEnd',
        condition: {
          type: 'and',
          conditions: [
            { type: 'hasTokenCount', tokenId: 'gold', count: 3 },
            { type: 'hasScore', playerId: '{currentPlayer}', operator: '>=', amount: 0 },
          ],
        },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain');
    expect(engine.isGameOver()).toBe(true);
  });

  test('AND 條件部分不成立時不觸發', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 3 } }],
      rules: [{
        id: 'and_rule',
        trigger: 'onActionEnd',
        condition: {
          type: 'and',
          conditions: [
            { type: 'hasTokenCount', tokenId: 'gold', count: 3 },
            { type: 'hasScore', playerId: '{currentPlayer}', operator: '>=', amount: 100 },
          ],
        },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain');
    expect(engine.isGameOver()).toBe(false);
  });

  test('OR 條件任一成立時觸發', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [{
        id: 'or_rule',
        trigger: 'onActionEnd',
        condition: {
          type: 'or',
          conditions: [
            { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
            { type: 'hasScore', playerId: '{currentPlayer}', operator: '>=', amount: 9999 },
          ],
        },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain');
    expect(engine.isGameOver()).toBe(true);
  });
});

// ── Trigger chain ──────────────────────────────────────────────────────────────
describe('RuleEngine — 觸發鏈', () => {
  test('triggerRule 成功呼叫另一條規則的動作', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [
        {
          id: 'chain_entry',
          trigger: 'onActionEnd',
          condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
          action: { type: 'triggerRule', ruleId: 'score_adder' },
        },
        {
          id: 'score_adder',
          trigger: 'onTurnEnd', // 不會被正常觸發，只能被 chain 呼叫
          condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
          action: { type: 'addScore', playerId: '{currentPlayer}', amount: 10 },
        },
      ],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain');
    expect(engine.getCurrentPlayer().score).toBe(10);
  });

  test('triggerRule 找不到規則時不崩潰', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [{
        id: 'bad_chain',
        trigger: 'onActionEnd',
        condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
        action: { type: 'triggerRule', ruleId: 'non_existent_rule' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    expect(() => engine.executeAction('gain')).not.toThrow();
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────────
describe('RuleEngine — Edge Cases', () => {
  test('遊戲結束後無法執行動作', () => {
    const mod = makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [{
        id: 'win',
        trigger: 'onActionEnd',
        condition: { type: 'hasTokenCount', tokenId: 'gold', count: 1 },
        action: { type: 'winGame', playerId: '{currentPlayer}' },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('gain');
    expect(engine.isGameOver()).toBe(true);
    const ok = engine.executeAction('gain');
    expect(ok).toBe(false);
  });

  test('不存在的動作 ID 回傳 false', () => {
    const engine = new RuleEngine(makeModule());
    engine.startGame();
    const ok = engine.executeAction('non_existent');
    expect(ok).toBe(false);
  });

  test('單一玩家遊戲不崩潰', () => {
    const mod = makeModule({
      players: [{ id: 'p1', name: '玩家1', tokens: [], score: 0 }],
      turn: { currentPlayerId: 'p1', actionsPerTurn: 0 },
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.endTurn();
    expect(engine.getCurrentPlayer().id).toBe('p1');
  });

  test('空 AND 條件預設為 true', () => {
    const mod = makeModule({
      actions: [{ id: 'a', name: 'a', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [{
        id: 'empty_and',
        trigger: 'onActionEnd',
        condition: { type: 'and', conditions: [] },
        action: { type: 'addScore', playerId: '{currentPlayer}', amount: 1 },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('a');
    expect(engine.getCurrentPlayer().score).toBe(1);
  });

  test('空 OR 條件預設為 false', () => {
    const mod = makeModule({
      actions: [{ id: 'a', name: 'a', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
      rules: [{
        id: 'empty_or',
        trigger: 'onActionEnd',
        condition: { type: 'or', conditions: [] },
        action: { type: 'addScore', playerId: '{currentPlayer}', amount: 1 },
      }],
    });
    const engine = new RuleEngine(mod);
    engine.startGame();
    engine.executeAction('a');
    expect(engine.getCurrentPlayer().score).toBe(0);
  });

  test('patchPlayer 正確修改玩家狀態', () => {
    const engine = new RuleEngine(makeModule());
    engine.startGame();
    engine.patchPlayer('p1', { score: 99, tokens: ['gold', 'gold', 'gem'] });
    const p = engine.getCurrentPlayer();
    expect(p.score).toBe(99);
    expect(p.tokens).toEqual(['gold', 'gold', 'gem']);
  });

  test('loadState 快照恢復正確', () => {
    const engine = new RuleEngine(makeModule({
      actions: [{ id: 'gain', name: '取金', type: 'gainToken', params: { tokenId: 'gold', count: 1 } }],
    }));
    engine.startGame();
    const snap = JSON.parse(JSON.stringify(engine.getGameState()));
    engine.executeAction('gain');
    expect(engine.getCurrentPlayer().tokens.length).toBe(1);
    engine.loadState(snap);
    expect(engine.getCurrentPlayer().tokens.length).toBe(0);
  });
});

// ── 有限供給（Token.supply）─────────────────────────────────────────────────────
describe('RuleEngine — 有限供給', () => {
  function supplyModule() {
    return makeModule({
      tokens: [
        { id: 'ore',  name: '礦石', type: 'resource', supply: 10 },
        { id: 'gold', name: '黃金', type: 'resource', supply: 5 },
        { id: 'free', name: '無限', type: 'resource' }, // 無 supply = 無限
      ],
      actions: [
        { id: 'mine',  name: '採礦',   type: 'gainToken',  params: { tokenId: 'ore',  count: 2 } },
        { id: 'spend', name: '花礦',   type: 'spendToken', params: { tokenId: 'ore',  count: 1 } },
        { id: 'smelt', name: '冶煉',   type: 'tradeToken', params: { fromTokenId: 'ore', fromCount: 3, toTokenId: 'gold', toCount: 1 } },
        { id: 'getfree', name: '取無限', type: 'gainToken', params: { tokenId: 'free', count: 100 } },
      ],
    });
  }

  test('T1：supply 為 undefined 時 remaining = null，鑄造不受限', () => {
    const engine = new RuleEngine(supplyModule());
    engine.startGame();
    expect(engine.getSupplyRemaining('free')).toBeNull();
    expect(engine.executeAction('getfree')).toBe(true);
    expect(engine.getCurrentPlayer().tokens.filter(t => t === 'free').length).toBe(100);
  });

  test('T2：remaining = supply − Σ玩家持有', () => {
    const mod = supplyModule();
    mod.players[0].tokens = ['ore', 'ore', 'ore', 'ore'];
    mod.players[1].tokens = ['ore', 'ore', 'ore'];
    const engine = new RuleEngine(mod);
    expect(engine.getSupplyRemaining('ore')).toBe(10 - 7);
  });

  test('T3：供給池空時 gainToken 失敗且持有不變', () => {
    const mod = supplyModule();
    mod.players[0].tokens = Array(10).fill('ore'); // 已用光
    const engine = new RuleEngine(mod);
    engine.startGame();
    const before = engine.getCurrentPlayer().tokens.length;
    expect(engine.executeAction('mine')).toBe(false);
    expect(engine.getCurrentPlayer().tokens.length).toBe(before);
    expect(engine.getSupplyRemaining('ore')).toBe(0);
  });

  test('T4：spendToken 後殘量自動回補', () => {
    const mod = supplyModule();
    mod.players[0].tokens = Array(10).fill('ore');
    const engine = new RuleEngine(mod);
    engine.startGame();
    expect(engine.getSupplyRemaining('ore')).toBe(0);
    expect(engine.executeAction('spend')).toBe(true); // 花掉 1
    expect(engine.getSupplyRemaining('ore')).toBe(1);
  });

  test('T5：換得端供給不足時 tradeToken 失敗，換出端不被消耗', () => {
    const mod = supplyModule();
    // gold supply=5：玩家持有 5 gold 把 gold 池用光；另有 3 ore 可冶煉
    mod.players[0].tokens = ['gold', 'gold', 'gold', 'gold', 'gold', 'ore', 'ore', 'ore'];
    const engine = new RuleEngine(mod);
    engine.startGame();
    expect(engine.getSupplyRemaining('gold')).toBe(0);
    expect(engine.executeAction('smelt')).toBe(false);
    expect(engine.getCurrentPlayer().tokens.filter(t => t === 'ore').length).toBe(3);
  });

  test('T6：殘量扣掉牌堆中的 token', () => {
    const mod = supplyModule();
    mod.piles = [{ id: 'deck', name: '牌堆', cards: ['ore', 'ore'] }];
    const engine = new RuleEngine(mod);
    expect(engine.getSupplyRemaining('ore')).toBe(10 - 2);
  });
});
