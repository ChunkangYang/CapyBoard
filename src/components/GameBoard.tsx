import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GameModule, GameState, Player, Token, BoardZone, BoardCell } from '../engine/types';
import { RuleEngine } from '../engine/ruleEngine';
import { TokenChip } from './TokenChip';
import { Capybara } from './Capybara';
import { pickThemePack, ThemePack } from '../theme/themePacks';
import { playSfx, sfxForAction, isMuted, toggleMuted } from '../utils/sound';
import {
  RotateCcw, Play, SkipForward, ChevronDown, ChevronRight,
  Trophy, StepBack, PenLine, X, Volume2, VolumeX,
} from 'lucide-react';

interface GameBoardProps {
  gameModule: GameModule;
}

// ─── Dice faces ───────────────────────────────────────────────────────────────
const DICE_FACES: Record<number, string> = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

const DiceOverlay: React.FC<{
  result: { sides: number; result: number };
  onClose: () => void;
}> = ({ result, onClose }) => {
  const [rolling, setRolling] = useState(true);
  const [displayNum, setDisplayNum] = useState(1);

  useEffect(() => {
    let count = 0;
    const total = 12;
    const interval = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * result.sides) + 1);
      count++;
      if (count >= total) {
        clearInterval(interval);
        setDisplayNum(result.result);
        setRolling(false);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    if (!rolling) {
      const t = setTimeout(onClose, 1800);
      return () => clearTimeout(t);
    }
  }, [rolling, onClose]);

  const face = result.sides === 6 && DICE_FACES[displayNum] ? DICE_FACES[displayNum] : String(displayNum);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`rounded-2xl p-8 text-center transition-transform ${rolling ? 'animate-bounce' : 'scale-110'}`}
        style={{ background: '#FFFDF8', boxShadow: '0 12px 40px rgba(120,80,30,0.35)', border: '2px solid #F0E6D6' }}
      >
        <div className="text-8xl mb-3 select-none">{face}</div>
        <div className="text-2xl font-bold" style={{ color: '#5C4A33' }}>
          {rolling ? '擲骰中…' : `擲出了 ${result.result}！`}
        </div>
        <div className="text-sm mt-1" style={{ color: '#A1907A' }}>d{result.sides}</div>
      </div>
    </div>
  );
};

// ─── 勝利/失敗慶祝演出 ──────────────────────────────────────────────────────────
const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🍯', '🏅'];
const VictoryOverlay: React.FC<{
  gameState: GameState;
  onReset: () => void;
  onDismiss: () => void;
}> = ({ gameState, onReset, onDismiss }) => {
  const won = !!gameState.winner;
  const totalTurns = Object.values(gameState.turnCounts).reduce((a, b) => a + b, 0);
  const pieces = React.useMemo(
    () => Array.from({ length: 28 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.4 + Math.random() * 1.8,
      emoji: CONFETTI[i % CONFETTI.length],
      size: 16 + Math.random() * 18,
    })),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(60,40,20,0.45)' }}>
      {/* 五彩碎片 */}
      {won && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {pieces.map((p, i) => (
            <span
              key={i}
              className="absolute select-none"
              style={{
                left: `${p.left}%`, top: '-8%', fontSize: p.size,
                animation: `capy-confetti ${p.dur}s linear ${p.delay}s infinite`,
              }}
            >{p.emoji}</span>
          ))}
        </div>
      )}
      <div
        className="relative rounded-3xl px-10 py-8 text-center max-w-sm mx-4"
        style={{ background: '#FFFDF8', boxShadow: '0 16px 50px rgba(120,80,30,0.4)', border: '2px solid #F0E6D6', animation: 'capy-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className="flex justify-center mb-2" style={{ animation: won ? 'capy-hop 0.9s ease-in-out infinite' : undefined }}>
          <Capybara size={96} mood={won ? 'cheer' : 'chill'} />
        </div>
        {won ? (
          <>
            <div className="text-3xl font-extrabold mb-1" style={{ color: '#E09B3D' }}>🏆 勝利！</div>
            <div className="text-lg font-semibold" style={{ color: '#5C4A33' }}>{gameState.winner!.name} 獲勝</div>
          </>
        ) : (
          <>
            <div className="text-3xl font-extrabold mb-1" style={{ color: '#B07A28' }}>遊戲結束</div>
            <div className="text-lg font-semibold" style={{ color: '#5C4A33' }}>平局！</div>
          </>
        )}
        <div className="mt-2 text-sm" style={{ color: '#A1907A' }}>共進行 {totalTurns} 回合</div>
        <div className="mt-5 flex gap-2 justify-center">
          <Button onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> 再玩一次
          </Button>
          <Button variant="outline" onClick={onDismiss}>看看棋盤</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Setup Screen ─────────────────────────────────────────────────────────────
const SetupScreen: React.FC<{
  engine: RuleEngine;
  onStart: () => void;
}> = ({ engine, onStart }) => {
  const state = engine.getGameState();
  const module = state.module;

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-4">
      <div className="text-center">
        <div className="flex justify-center mb-1"><Capybara size={64} mood="happy" /></div>
        <h2 className="text-2xl font-bold" style={{ color: '#5C4A33' }}>{module.gameName.zh}</h2>
        <p className="text-sm mt-1" style={{ color: '#A1907A' }}>確認遊戲設定並開始</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">玩家配置</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {module.players.map((player, idx) => {
            const tokenCounts: Record<string, number> = {};
            player.tokens.forEach(tid => { tokenCounts[tid] = (tokenCounts[tid] ?? 0) + 1; });
            return (
              <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#FBF3E4' }}>
                <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#F4B860' }}>
                  {idx + 1}
                </span>
                <span className="font-medium text-sm" style={{ color: '#5C4A33' }}>{player.name}</span>
                <div className="flex flex-wrap gap-1 ml-auto">
                  {Object.entries(tokenCounts).map(([tid, cnt]) => {
                    const token = module.tokens.find(t => t.id === tid);
                    return (
                      <span key={tid} className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded text-xs">
                        {token?.name ?? tid} ×{cnt}
                      </span>
                    );
                  })}
                  {Object.keys(tokenCounts).length === 0 && (
                    <span className="text-xs text-gray-400">無初始資源</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">每回合行動次數</span>
            <span className="font-medium">{module.turn.actionsPerTurn === 0 ? '不限' : `${module.turn.actionsPerTurn} 次`}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">規則數量</span>
            <span className="font-medium">{module.rules.length} 條</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">先手玩家</span>
            <span className="font-medium">{module.players.find(p => p.id === module.turn.currentPlayerId)?.name}</span>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-base" onClick={onStart}>
        <Play className="w-5 h-5 mr-2" /> 開始遊戲
      </Button>
    </div>
  );
};

// ─── Turn History ─────────────────────────────────────────────────────────────
const TurnHistoryPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const [open, setOpen] = useState(false);

  if (gameState.turnHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="py-2 px-3 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          <span>回合歷史（{gameState.turnHistory.length} 回合）</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="py-2 px-3 max-h-48 overflow-y-auto space-y-1">
          {gameState.turnHistory.map((record, i) => (
            <div key={i} className="text-xs text-gray-600 border-l-2 border-gray-200 pl-2 py-0.5">
              <span className="font-medium text-gray-700">{record.playerName}</span>
              <span className="text-gray-400 ml-1">回合 {record.turnNumber}</span>
              {record.actionsLog.length > 0 && (
                <div className="text-gray-400 mt-0.5">{record.actionsLog.join('、')}</div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

// ─── State Editor Modal ───────────────────────────────────────────────────────
const StateEditorModal: React.FC<{
  gameState: GameState;
  onApply: (playerId: string, patch: { score: number; tokens: string[] }) => void;
  onClose: () => void;
}> = ({ gameState, onApply, onClose }) => {
  const module = gameState.module;
  const [edits, setEdits] = useState<Record<string, { score: number; tokenStr: string }>>(() => {
    const init: Record<string, { score: number; tokenStr: string }> = {};
    for (const p of module.players) {
      init[p.id] = {
        score: p.score,
        tokenStr: p.tokens.join(', '),
      };
    }
    return init;
  });

  const handleApply = () => {
    for (const [pid, edit] of Object.entries(edits)) {
      const rawTokens = edit.tokenStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      onApply(pid, { score: edit.score, tokens: rawTokens });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-gray-800">直接修改玩家狀態</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {module.players.map(player => (
            <div key={player.id} className="border rounded-lg p-3 space-y-2">
              <div className="font-medium text-sm">{player.name}</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">分數</label>
                <input
                  type="number"
                  className="flex-1 p-1.5 border rounded text-sm"
                  value={edits[player.id]?.score ?? 0}
                  onChange={e => setEdits(prev => ({
                    ...prev,
                    [player.id]: { ...prev[player.id], score: parseInt(e.target.value) || 0 },
                  }))}
                />
              </div>
              <div className="flex items-start gap-2">
                <label className="text-xs text-gray-500 w-12 pt-1.5">Token</label>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    className="w-full p-1.5 border rounded text-sm font-mono"
                    placeholder="tokenId, tokenId, ..."
                    value={edits[player.id]?.tokenStr ?? ''}
                    onChange={e => setEdits(prev => ({
                      ...prev,
                      [player.id]: { ...prev[player.id], tokenStr: e.target.value },
                    }))}
                  />
                  <div className="text-xs text-gray-400">
                    可用 Token ID：{module.tokens.map(t => `${t.id}(${t.name})`).join('、') || '無'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleApply}>套用修改</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Runtime visual board ─────────────────────────────────────────────────────
const RB_ZONE: Record<BoardZone['kind'], { border: string; fill: string; text: string; label: string }> = {
  player: { border: '#E09B3D', fill: 'rgba(244,184,96,0.16)', text: '#B07A28', label: '玩家區' },
  pool:   { border: '#6FA582', fill: 'rgba(143,191,159,0.18)', text: '#2F5C3E', label: '供給池' },
};

const CELL_TYPE_COLOR: Record<string, string> = {
  empty: '#EDE3D3', start: '#8FBF9F', end: '#B89FD4',
  bonus_score: '#F4B860', penalty_score: '#EF8E72',
  bonus_token: '#F4B860', penalty_token: '#EF8E72',
  draw_card: '#B89FD4', custom: '#D8C7AC',
};

/** 一顆 token 籌碼 + 數量（count 或 stack 呈現）。count===null 表示無限供給。 */
const ChipCount: React.FC<{ token: Token; count: number | null; display: 'count' | 'stack' }> = ({ token, count, display }) => {
  if (display === 'stack' && count !== null && count > 0) {
    const shown = Math.min(count, 5);
    return (
      <div className="relative flex flex-col items-center" title={`${token.name} ×${count}`}>
        <div className="relative" style={{ width: 34, height: 34 + (shown - 1) * 5 }}>
          {Array.from({ length: shown }).map((_, i) => (
            <div key={i} className="absolute left-0" style={{ top: (shown - 1 - i) * 5 }}>
              <TokenChip token={token} size={34} />
            </div>
          ))}
        </div>
        <span className="text-[10px] font-bold mt-0.5" style={{ color: '#5C4A33' }}>×{count}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center" title={token.name}>
      <TokenChip token={token} size={34} />
      <span className="text-[10px] font-bold mt-0.5" style={{ color: count === 0 ? '#c0392b' : '#5C4A33' }}>
        {count === null ? '∞' : `×${count}`}
      </span>
    </div>
  );
};

/** 一個區域的即時計數視圖（玩家持有 / 供給殘量，全部即時讀真相層）。 */
const ZoneView: React.FC<{ zone: BoardZone; gameState: GameState; engine: RuleEngine }> = ({ zone, gameState, engine }) => {
  const st = RB_ZONE[zone.kind];
  const tokenById = (id: string) => gameState.module.tokens.find(t => t.id === id);
  const isCurrent = zone.kind === 'player' && zone.playerId === gameState.currentPlayer.id;

  let title = '';
  let entries: { token: Token; count: number | null }[] = [];
  if (zone.kind === 'player') {
    const player = gameState.module.players.find(p => p.id === zone.playerId);
    title = player?.name ?? '未指定玩家';
    if (player) {
      const counts: Record<string, number> = {};
      player.tokens.forEach(tid => { counts[tid] = (counts[tid] ?? 0) + 1; });
      entries = Object.entries(counts)
        .map(([tid, c]) => ({ token: tokenById(tid), count: c }))
        .filter((e): e is { token: Token; count: number } => !!e.token);
    }
  } else {
    title = zone.label || '供給池';
    const ids = zone.tokenIds && zone.tokenIds.length > 0
      ? zone.tokenIds
      : gameState.module.tokens.filter(t => t.supply !== undefined).map(t => t.id);
    entries = ids
      .map(tid => ({ token: tokenById(tid), count: engine.getSupplyRemaining(tid) }))
      .filter((e): e is { token: Token; count: number | null } => !!e.token);
  }

  const display = zone.display ?? 'count';

  return (
    <div
      className="absolute rounded-xl overflow-hidden flex flex-col"
      style={{
        left: zone.rect.x, top: zone.rect.y, width: zone.rect.width, height: zone.rect.height,
        border: `2px ${isCurrent ? 'solid' : 'dashed'} ${st.border}`,
        background: st.fill,
        boxShadow: isCurrent ? `0 0 0 3px ${st.border}55` : undefined,
        zIndex: 1,
      }}
    >
      <div className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold" style={{ color: st.text, background: 'rgba(255,255,255,0.6)' }}>
        <span className="px-1 rounded text-white" style={{ background: st.border }}>{st.label}</span>
        <span className="truncate">{title}</span>
        {isCurrent && <span className="ml-auto text-[10px]" style={{ color: st.border }}>● 當前</span>}
      </div>
      <div className="flex-1 overflow-auto p-1.5 flex flex-wrap gap-2 content-start">
        {entries.length === 0
          ? <span className="text-[11px] m-auto" style={{ color: st.text }}>—</span>
          : entries.map(({ token, count }) => (
              <ChipCount key={token.id} token={token} count={count} display={display} />
            ))
        }
      </div>
    </div>
  );
};

/** 格子軌道（有 cells 時呈現），token 標記在其當前位置。 */
const CellTrack: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const cells: BoardCell[] = gameState.module.boardConfig?.cells ?? [];
  if (cells.length === 0) return null;
  const tokensAt: Record<number, Token[]> = {};
  for (const [tid, idx] of Object.entries(gameState.tokenPositions)) {
    if (idx < 0) continue;
    const tk = gameState.module.tokens.find(t => t.id === tid);
    if (tk) (tokensAt[idx] = tokensAt[idx] ?? []).push(tk);
  }
  return (
    <div>
      <div className="text-[11px] font-medium mb-1" style={{ color: '#A1907A' }}>格子軌道</div>
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {cells.map(cell => (
          <div
            key={cell.index}
            className="shrink-0 rounded-lg flex flex-col items-center justify-between p-1"
            style={{ width: 64, minHeight: 72, background: '#FFFDF8', border: `2px solid ${CELL_TYPE_COLOR[cell.type] ?? '#EDE3D3'}` }}
          >
            <span className="self-start text-[9px] font-mono px-1 rounded" style={{ background: CELL_TYPE_COLOR[cell.type] ?? '#EDE3D3', color: '#5C4A33' }}>{cell.index}</span>
            <span className="text-[10px] text-center leading-tight truncate w-full" style={{ color: '#5C4A33' }}>{cell.name}</span>
            <div className="flex flex-wrap gap-0.5 justify-center min-h-[18px]">
              {(tokensAt[cell.index] ?? []).map((tk, i) => (
                <span key={i} className="text-base leading-none">{tk.icon ?? '🔘'}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 無 zone/cells 的遊戲：給一張主題感的「玩家桌面」，讓每位玩家的資源以籌碼呈現，不再只有純文字。 */
const ThemedTable: React.FC<{ gameState: GameState; theme: ThemePack }> = ({ gameState, theme }) => {
  const players = gameState.module.players;
  return (
    <Card>
      <CardHeader className="py-2 px-3"><CardTitle className="text-sm" style={{ color: '#5C4A33' }}>遊戲桌面</CardTitle></CardHeader>
      <CardContent className="py-3 px-3">
        <div className="flex flex-wrap gap-3 justify-center">
          {players.map(player => {
            const isCurrent = player.id === gameState.currentPlayer.id && gameState.phase === 'playing';
            const counts: Record<string, number> = {};
            player.tokens.forEach(tid => { counts[tid] = (counts[tid] ?? 0) + 1; });
            const entries = Object.entries(counts);
            return (
              <div
                key={player.id}
                className="rounded-2xl p-3 min-w-[150px] transition-all"
                style={{
                  background: theme.panel,
                  border: `2px ${isCurrent ? 'solid' : 'dashed'} ${isCurrent ? theme.accentDark : '#E7D8BF'}`,
                  boxShadow: isCurrent ? `0 0 0 3px ${theme.accent}44, 0 6px 16px rgba(120,80,30,0.12)` : '0 3px 10px rgba(120,80,30,0.06)',
                  transform: isCurrent ? 'translateY(-2px)' : undefined,
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Capybara size={26} mood={isCurrent ? 'happy' : 'chill'} />
                  <span className="font-semibold text-sm" style={{ color: '#5C4A33' }}>{player.name}</span>
                  {isCurrent && <span className="ml-auto text-[10px] font-bold" style={{ color: theme.accentDark }}>● 當前</span>}
                </div>
                <div className="text-xs mb-1.5" style={{ color: theme.muted }}>分數 {player.score}</div>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                  {entries.length === 0
                    ? <span className="text-xs" style={{ color: theme.muted }}>尚無資源</span>
                    : entries.map(([tid, cnt]) => {
                        const token = gameState.module.tokens.find(t => t.id === tid);
                        if (!token) return null;
                        return (
                          <div key={tid} className="flex flex-col items-center">
                            <TokenChip token={token} size={32} />
                            <span className="text-[10px] font-bold mt-0.5" style={{ color: '#5C4A33' }}>×{cnt}</span>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

const RuntimeBoard: React.FC<{ gameState: GameState; engine: RuleEngine; theme: ThemePack }> = ({ gameState, engine, theme }) => {
  const cfg = gameState.module.boardConfig;
  const zones = cfg?.zones ?? [];
  const cells = cfg?.cells ?? [];
  const items = gameState.module.board?.items ?? [];
  // 什麼視覺元素都沒有時，改用主題桌面呈現，避免只有純文字
  if (!cfg || (zones.length === 0 && cells.length === 0 && items.length === 0)) {
    return <ThemedTable gameState={gameState} theme={theme} />;
  }

  const bg = cfg.backgroundColor ?? '#FFFDF8';
  const gridStyle: React.CSSProperties = cfg.showGrid ? {
    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: `${cfg.gridSize}px ${cfg.gridSize}px`,
    backgroundColor: bg,
  } : { backgroundColor: bg };

  const showCanvas = zones.length > 0 || items.length > 0;

  return (
    <Card>
      <CardHeader className="py-2 px-3"><CardTitle className="text-sm">遊戲棋盤</CardTitle></CardHeader>
      <CardContent className="py-2 px-3 space-y-3">
        {showCanvas && (
          <div className="overflow-auto">
            <div className="relative rounded-xl mx-auto" style={{ width: cfg.width, height: cfg.height, ...gridStyle, border: '1px solid #EAD9BF' }}>
              {zones.map(zone => (
                <ZoneView key={zone.id} zone={zone} gameState={gameState} engine={engine} />
              ))}
              {items.map(item => {
                const token = gameState.module.tokens.find(t => t.id === item.id);
                if (!token) return null;
                return (
                  <div key={item.instanceId} className="absolute flex flex-col items-center" style={{ left: item.position.x, top: item.position.y, zIndex: 2 }}>
                    <TokenChip token={token} size={48} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {cells.length > 0 && <CellTrack gameState={gameState} />}
      </CardContent>
    </Card>
  );
};

// ─── Main GameBoard ───────────────────────────────────────────────────────────
export const GameBoard: React.FC<GameBoardProps> = ({ gameModule }) => {
  const engineRef = useRef<RuleEngine>(new RuleEngine(JSON.parse(JSON.stringify(gameModule))));
  const [gameState, setGameState] = useState<GameState>(engineRef.current.getGameState());
  const [selectedActionId, setSelectedActionId] = useState<string>(
    gameModule.actions[0]?.id ?? ''
  );
  const [showDice, setShowDice] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const wasEndedRef = useRef(false);
  const theme = React.useMemo(() => pickThemePack(gameModule), [gameModule]);

  // ── State snapshots for rewind ──
  const [snapshots, setSnapshots] = useState<GameState[]>([]);

  const saveSnapshot = useCallback(() => {
    const snap = JSON.parse(JSON.stringify(engineRef.current.getGameState())) as GameState;
    setSnapshots(prev => [...prev.slice(-19), snap]); // 最多保留 20 步
  }, []);

  const handleRewind = () => {
    if (snapshots.length === 0) return;
    const prev = snapshots[snapshots.length - 1];
    setSnapshots(s => s.slice(0, -1));
    engineRef.current.loadState(prev);
    setGameState({ ...engineRef.current.getGameState() });
    setShowDice(false);
  };

  // ── State editor ──
  const [showStateEditor, setShowStateEditor] = useState(false);

  const handlePatchPlayer = (playerId: string, patch: { score: number; tokens: string[] }) => {
    engineRef.current.patchPlayer(playerId, patch);
    setGameState({ ...engineRef.current.getGameState() });
  };

  const refresh = () => {
    const state = engineRef.current.getGameState();
    setGameState({ ...state });
    if (state.lastDiceResult) setShowDice(true);
    // 勝負演出：第一次進入 ended 時放勝/負音效
    if (state.phase === 'ended' && !wasEndedRef.current) {
      wasEndedRef.current = true;
      setCelebrationDismissed(false);
      playSfx(state.winner ? 'win' : 'lose');
    }
    if (state.phase !== 'ended') wasEndedRef.current = false;
  };

  const handleStart = () => {
    saveSnapshot();
    engineRef.current.startGame();
    playSfx('start');
    refresh();
  };

  const handleExecuteAction = () => {
    if (!selectedActionId) return;
    saveSnapshot();
    const action = engineRef.current.getGameState().module.actions.find(a => a.id === selectedActionId);
    engineRef.current.executeAction(selectedActionId);
    const after = engineRef.current.getGameState();
    // 動作音效（擲骰的音效交給骰子動畫時機更貼合，這裡仍先給回饋）
    if (action) playSfx(sfxForAction(action.type));
    if (after.phase !== 'ended' && after.winner === undefined) {
      // 若剛好觸發加分規則，補一聲清脆得分音
    }
    refresh();
  };

  const handleEndTurn = () => {
    saveSnapshot();
    engineRef.current.endTurn();
    if (engineRef.current.getGameState().phase !== 'ended') playSfx('turn');
    refresh();
  };

  const handleReset = () => {
    engineRef.current = new RuleEngine(JSON.parse(JSON.stringify(gameModule)));
    const state = engineRef.current.getGameState();
    setGameState({ ...state });
    setSelectedActionId(gameModule.actions[0]?.id ?? '');
    setShowDice(false);
    setSnapshots([]);
    wasEndedRef.current = false;
    setCelebrationDismissed(false);
  };

  const handleToggleMute = () => {
    const next = toggleMuted();
    setMutedState(next);
    if (!next) playSfx('click');
  };

  const currentPlayer = gameState.currentPlayer;
  const limit = gameState.module.turn.actionsPerTurn;
  const used  = gameState.actionsUsedThisTurn;
  const actionBlocked = gameState.phase === 'playing' && !gameState.gameOver && limit > 0 && used >= limit;

  const selectedAction = gameState.module.actions.find(a => a.id === selectedActionId);

  const actionPreview = (): string => {
    if (!selectedAction) return '';
    const p = selectedAction.params ?? {};
    const tname = (id: string) => gameState.module.tokens.find(t => t.id === id)?.name ?? id;
    switch (selectedAction.type) {
      case 'gainToken':  return `獲得 ${tname(p.tokenId)} ×${p.count ?? 1}`;
      case 'spendToken': return `消耗 ${tname(p.tokenId)} ×${p.count ?? 1}`;
      case 'tradeToken': return `${tname(p.fromTokenId)} ×${p.fromCount} → ${tname(p.toTokenId)} ×${p.toCount}`;
      case 'rollDice':   return `擲骰（d${p.sides ?? 6}）`;
      case 'drawCard':   return `抽 ${tname(p.tokenId)}`;
      case 'moveToken': {
        const mode = p.moveMode ?? 'steps';
        if (mode === 'absolute') return `${tname(p.tokenId)} 跳至格子 ${p.absolute ?? 0}`;
        return `${tname(p.tokenId)} ${(p.steps ?? 1) >= 0 ? '前進' : '後退'} ${Math.abs(p.steps ?? 1)} 格`;
      }
      default:           return selectedAction.type;
    }
  };

  // ── Setup phase ──
  if (gameState.phase === 'setup') {
    return (
      <div>
        <SetupScreen engine={engineRef.current} onStart={handleStart} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-4 relative overflow-hidden"
      style={{ background: theme.bg }}
    >
      {/* 主題氛圍裝飾（漂浮 emoji） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {theme.ambiance.map((em, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              left: `${8 + (i * 23) % 84}%`,
              top: `${10 + (i * 37) % 70}%`,
              fontSize: 30 + (i % 3) * 8,
              opacity: 0.13,
              animation: `capy-float ${5 + i}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >{em}</span>
        ))}
      </div>

      {/* 骰子動畫覆蓋層 */}
      {showDice && gameState.lastDiceResult && (
        <DiceOverlay
          result={gameState.lastDiceResult}
          onClose={() => setShowDice(false)}
        />
      )}

      {/* 狀態編輯 Modal */}
      {showStateEditor && (
        <StateEditorModal
          gameState={gameState}
          onApply={handlePatchPlayer}
          onClose={() => setShowStateEditor(false)}
        />
      )}

      {/* 勝負慶祝演出 */}
      {gameState.phase === 'ended' && !celebrationDismissed && (
        <VictoryOverlay
          gameState={gameState}
          onReset={handleReset}
          onDismiss={() => setCelebrationDismissed(true)}
        />
      )}

      {/* 視覺棋盤：玩家資源區 / 供給池殘量 / 格子軌道（即時讀真相層） */}
      <RuntimeBoard gameState={gameState} engine={engineRef.current} theme={theme} />

      <div className="flex gap-4 relative z-10 flex-wrap lg:flex-nowrap">
        {/* 玩家狀態 */}
        <div className="w-64 space-y-3">
          <h2 className="text-lg font-semibold">玩家</h2>
          {gameState.module.players.map(player => {
            const isCurrent = player.id === currentPlayer.id && gameState.phase === 'playing';
            const isLoser = gameState.losers.includes(player.id);
            const tokenCounts: Record<string, number> = {};
            player.tokens.forEach(tid => { tokenCounts[tid] = (tokenCounts[tid] ?? 0) + 1; });
            const playerTurns = gameState.turnCounts[player.id] ?? 0;
            return (
              <Card
                key={player.id}
                className={isLoser ? 'opacity-50' : ''}
                style={isCurrent ? { borderColor: '#E09B3D', background: '#FFF4DF', boxShadow: '0 0 0 2px rgba(244,184,96,0.35)' } : undefined}
              >
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#5C4A33' }}>
                    {isCurrent && <Capybara size={20} mood="happy" />}
                    {gameState.winner?.id === player.id && <Trophy className="w-3.5 h-3.5" style={{ color: '#E09B3D' }} />}
                    {isLoser && <span style={{ color: '#D98' }}>✗</span>}
                    {player.name}
                    {isCurrent && <span className="text-xs font-normal" style={{ color: '#E09B3D' }}>（當前）</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 text-xs text-gray-600 space-y-1.5">
                  <div className="flex gap-3 flex-wrap">
                    <span>分數：{player.score}</span>
                    <span className="text-gray-400">回合：{playerTurns}</span>
                    {/* 格子位置：取該玩家擁有的 token 中有位置資訊的 */}
                    {(() => {
                      const cells = gameState.module.boardConfig?.cells ?? [];
                      const entries = Object.entries(gameState.tokenPositions).filter(([tid]) =>
                        player.tokens.includes(tid)
                      );
                      if (entries.length === 0 || cells.length === 0) return null;
                      return entries.map(([tid, idx]) => {
                        const token = gameState.module.tokens.find(t => t.id === tid);
                        const cell = cells[idx];
                        return (
                          <span key={tid} className="font-medium" style={{ color: '#B07A28' }}>
                            {token?.icon}{token?.name ?? tid}：格{idx}「{cell?.name ?? '?'}」
                          </span>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(tokenCounts).length === 0
                      ? <span className="text-gray-400">無 Token</span>
                      : Object.entries(tokenCounts).map(([tid, cnt]) => {
                          const token = gameState.module.tokens.find(t => t.id === tid);
                          return (
                            <span key={tid} className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-200 rounded">
                              {token?.icon && <span className="mr-0.5">{token.icon}</span>}
                              {token?.name ?? tid} ×{cnt}
                            </span>
                          );
                        })
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* 牌堆狀態 */}
          {gameState.module.piles && gameState.module.piles.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-600 mb-1">牌堆</h3>
              {gameState.module.piles.map(pile => (
                <div key={pile.id} className="text-xs text-gray-500 flex justify-between py-0.5">
                  <span>{pile.name}</span>
                  <span>{gameState.pilesState[pile.id]?.length ?? 0} 張</span>
                </div>
              ))}
            </div>
          )}

          {/* 遊戲變數 */}
          {gameState.module.variables && gameState.module.variables.length > 0 && (
            <Card className="mt-2">
              <CardContent className="py-2 px-3">
                <div className="text-xs font-medium text-gray-600 mb-1">遊戲變數</div>
                {gameState.module.variables.map(v => (
                  <div key={v.id} className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-600">{v.name}</span>
                    <span className="font-mono font-medium text-gray-800">
                      {gameState.variablesState[v.id] ?? v.defaultValue}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 操作區 */}
        <div className="flex-1 space-y-4">
          {gameState.phase === 'playing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span style={{ color: '#5C4A33' }}>執行動作</span>
                  <span className="flex items-center gap-2">
                    {limit > 0 && (
                      <span className="text-sm font-normal px-2 py-0.5 rounded-full" style={
                        actionBlocked
                          ? { background: '#FBE0DA', color: '#C0603E' }
                          : { background: '#F6EEDF', color: '#8A745A' }
                      }>
                        {used} / {limit} 次
                      </span>
                    )}
                    <button
                      onClick={handleToggleMute}
                      title={muted ? '開啟音效' : '關閉音效'}
                      className="p-1.5 rounded-full transition-colors hover:bg-[#F6EEDF]"
                      style={{ color: muted ? '#BBA995' : '#E09B3D' }}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gameState.module.actions.length === 0 ? (
                  <div className="text-sm text-gray-400">尚無可用動作，請在遊戲編輯器中新增</div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">選擇動作</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedActionId}
                        onChange={e => setSelectedActionId(e.target.value)}
                      >
                        {gameState.module.actions.map(action => (
                          <option key={action.id} value={action.id}>{action.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedAction && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                        效果：{actionPreview()}
                      </div>
                    )}
                    {actionBlocked && (
                      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                        本回合行動次數已達上限，請結束回合
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleExecuteAction}
                    disabled={!selectedActionId || actionBlocked}
                  >
                    <Play className="w-4 h-4 mr-1" /> 執行
                  </Button>
                  <Button variant="outline" onClick={handleEndTurn}>
                    <SkipForward className="w-4 h-4 mr-1" /> 結束回合
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRewind}
                    disabled={snapshots.length === 0}
                    title={`倒退一步（還可倒退 ${snapshots.length} 步）`}
                  >
                    <StepBack className="w-4 h-4 mr-1" /> 倒退
                    {snapshots.length > 0 && (
                      <span className="ml-1 text-xs bg-gray-200 rounded px-1">{snapshots.length}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowStateEditor(true)}
                    title="直接修改玩家狀態（測試用）"
                  >
                    <PenLine className="w-4 h-4 mr-1" /> 修改狀態
                  </Button>
                  <Button variant="ghost" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-1" /> 重置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 回合歷史 */}
          <TurnHistoryPanel gameState={gameState} />

          {/* 事件日誌 */}
          <Card>
            <CardHeader><CardTitle style={{ color: '#5C4A33' }}>事件日誌</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 overflow-y-auto rounded-lg p-2 space-y-1 text-xs font-mono" style={{ background: '#FBF3E4', color: '#6B5842' }}>
                {gameState.eventLog.length === 0 ? (
                  <div style={{ color: '#B8A88F' }}>尚無事件</div>
                ) : (
                  [...gameState.eventLog].reverse().map((log, i) => (
                    <div key={i}>{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 規則總覽 */}
        <div className="w-56 space-y-3">
          <h2 className="text-lg font-semibold" style={{ color: '#5C4A33' }}>規則</h2>
          {gameState.module.rules
            .slice()
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            .map(rule => (
              <Card key={rule.id} className="text-xs">
                <CardContent className="py-2 px-3 space-y-1">
                  <div className="font-medium flex justify-between" style={{ color: '#5C4A33' }}>
                    <span className="truncate">{rule.id}</span>
                    {(rule.priority ?? 0) !== 0 && (
                      <span className="ml-1 shrink-0 px-1.5 rounded-full text-[10px] font-bold" style={{ background: '#F6EEDF', color: '#B07A28' }}>P{rule.priority}</span>
                    )}
                  </div>
                  <div style={{ color: '#A1907A' }}>觸發：{rule.trigger}</div>
                  <div style={{ color: '#A1907A' }}>
                    條件：{rule.condition.type}
                    {rule.condition.tokenId && ` (${rule.condition.tokenId} ≥ ${rule.condition.count})`}
                    {rule.condition.amount !== undefined && ` (分數 ${rule.condition.operator ?? '>='} ${rule.condition.amount})`}
                    {rule.condition.type === 'playerTurnCount' && ` (回合 ${rule.condition.operator ?? '>='} ${rule.condition.count})`}
                  </div>
                  <div style={{ color: '#A1907A' }}>
                    動作：{rule.action.type}
                    {rule.action.amount !== undefined && ` (+${rule.action.amount})`}
                  </div>
                </CardContent>
              </Card>
            ))
          }
          {gameState.module.rules.length === 0 && (
            <div className="text-xs" style={{ color: '#B8A88F' }}>尚無規則</div>
          )}
        </div>
      </div>
    </div>
  );
};
