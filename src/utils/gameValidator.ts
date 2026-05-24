import { GameModule } from '../engine/types';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
}

export function validateGameModule(module: GameModule): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tokenIds = new Set(module.tokens.map(t => t.id));
  const playerIds = new Set(module.players.map(p => p.id));
  const pileIds = new Set((module.piles ?? []).map(p => p.id));

  // ── 玩家 ──
  if (module.players.length === 0) {
    issues.push({ severity: 'error', code: 'NO_PLAYERS', message: '遊戲沒有玩家。' });
  }

  // ── 動作 ──
  if (module.actions.length === 0) {
    issues.push({ severity: 'warning', code: 'NO_ACTIONS', message: '遊戲沒有任何可執行的動作。' });
  }

  for (const action of module.actions) {
    const p = action.params ?? {};
    switch (action.type) {
      case 'gainToken':
      case 'spendToken':
        if (p.tokenId && !tokenIds.has(p.tokenId)) {
          issues.push({
            severity: 'error',
            code: 'ACTION_MISSING_TOKEN',
            message: `動作「${action.name}」引用了不存在的 Token（${p.tokenId}）。`,
          });
        }
        break;
      case 'tradeToken':
        if (p.fromTokenId && !tokenIds.has(p.fromTokenId)) {
          issues.push({
            severity: 'error',
            code: 'ACTION_MISSING_TOKEN',
            message: `動作「${action.name}」引用了不存在的 Token（${p.fromTokenId}）。`,
          });
        }
        if (p.toTokenId && !tokenIds.has(p.toTokenId)) {
          issues.push({
            severity: 'error',
            code: 'ACTION_MISSING_TOKEN',
            message: `動作「${action.name}」引用了不存在的 Token（${p.toTokenId}）。`,
          });
        }
        break;
      case 'drawCard':
        if (p.pileId && !pileIds.has(p.pileId)) {
          issues.push({
            severity: 'error',
            code: 'ACTION_MISSING_PILE',
            message: `動作「${action.name}」引用了不存在的牌堆（${p.pileId}）。`,
          });
        } else if (!p.pileId && p.tokenId && !tokenIds.has(p.tokenId)) {
          issues.push({
            severity: 'error',
            code: 'ACTION_MISSING_TOKEN',
            message: `動作「${action.name}」引用了不存在的 Token（${p.tokenId}）。`,
          });
        }
        break;
    }
  }

  // ── 規則 ──
  const hasWinCondition = module.rules.some(r => r.action.type === 'winGame');
  if (!hasWinCondition) {
    issues.push({
      severity: 'warning',
      code: 'NO_WIN_CONDITION',
      message: '遊戲沒有勝利條件（沒有任何規則會觸發 winGame）。',
    });
  }

  for (const rule of module.rules) {
    // 條件引用的 token
    if (rule.condition.tokenId && !tokenIds.has(rule.condition.tokenId)) {
      issues.push({
        severity: 'error',
        code: 'RULE_MISSING_TOKEN',
        message: `規則「${rule.id}」的條件引用了不存在的 Token（${rule.condition.tokenId}）。`,
      });
    }

    // 條件引用的 player
    const condPlayerId = rule.condition.playerId;
    if (condPlayerId && condPlayerId !== '{currentPlayer}' && !playerIds.has(condPlayerId)) {
      issues.push({
        severity: 'error',
        code: 'RULE_MISSING_PLAYER',
        message: `規則「${rule.id}」的條件引用了不存在的玩家（${condPlayerId}）。`,
      });
    }

    // 動作引用的 player
    const actPlayerId = rule.action.playerId;
    if (actPlayerId && actPlayerId !== '{currentPlayer}' && !playerIds.has(actPlayerId)) {
      issues.push({
        severity: 'error',
        code: 'RULE_MISSING_PLAYER',
        message: `規則「${rule.id}」的動作引用了不存在的玩家（${actPlayerId}）。`,
      });
    }
  }

  // ── 初始資源 ──
  for (const player of module.players) {
    for (const tid of player.tokens) {
      if (!tokenIds.has(tid)) {
        issues.push({
          severity: 'error',
          code: 'PLAYER_MISSING_TOKEN',
          message: `玩家「${player.name}」的初始資源引用了不存在的 Token（${tid}）。`,
        });
      }
    }
  }

  return issues;
}
