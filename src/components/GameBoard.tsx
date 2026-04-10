import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GameModule, GameState } from '../engine/types';
import { RuleEngine } from '../engine/ruleEngine';
import { RotateCcw, Play, SkipForward, ChevronDown, ChevronRight, Trophy, Swords } from 'lucide-react';

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
      <div className={`bg-white rounded-2xl shadow-2xl p-8 text-center transition-transform ${rolling ? 'animate-bounce' : 'scale-110'}`}>
        <div className="text-8xl mb-3 select-none">{face}</div>
        <div className="text-2xl font-bold text-gray-700">
          {rolling ? '擲骰中…' : `擲出了 ${result.result}！`}
        </div>
        <div className="text-sm text-gray-400 mt-1">d{result.sides}</div>
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
        <h2 className="text-2xl font-bold text-gray-800">{module.gameName.zh}</h2>
        <p className="text-gray-500 text-sm mt-1">確認遊戲設定並開始</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">玩家配置</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {module.players.map((player, idx) => {
            const tokenCounts: Record<string, number> = {};
            player.tokens.forEach(tid => { tokenCounts[tid] = (tokenCounts[tid] ?? 0) + 1; });
            return (
              <div key={player.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="font-medium text-sm">{player.name}</span>
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

// ─── Game End Screen ──────────────────────────────────────────────────────────
const GameEndScreen: React.FC<{
  gameState: GameState;
  onReset: () => void;
}> = ({ gameState, onReset }) => (
  <div className="text-center p-6 bg-gradient-to-b from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
    {gameState.winner ? (
      <>
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-800 mb-1">遊戲結束！</div>
        <div className="text-lg text-yellow-700 font-semibold">{gameState.winner.name} 獲勝！</div>
      </>
    ) : (
      <>
        <Swords className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-800 mb-1">遊戲結束</div>
        <div className="text-gray-500">平局！</div>
      </>
    )}
    <div className="mt-3 text-sm text-gray-500">
      共進行 {Object.values(gameState.turnCounts).reduce((a, b) => a + b, 0)} 回合
    </div>
    <Button className="mt-4" onClick={onReset}>
      <RotateCcw className="w-4 h-4 mr-1" /> 重新開始
    </Button>
  </div>
);

// ─── Main GameBoard ───────────────────────────────────────────────────────────
export const GameBoard: React.FC<GameBoardProps> = ({ gameModule }) => {
  const engineRef = useRef<RuleEngine>(new RuleEngine(JSON.parse(JSON.stringify(gameModule))));
  const [gameState, setGameState] = useState<GameState>(engineRef.current.getGameState());
  const [selectedActionId, setSelectedActionId] = useState<string>(
    gameModule.actions[0]?.id ?? ''
  );
  const [showDice, setShowDice] = useState(false);

  const refresh = () => {
    const state = engineRef.current.getGameState();
    setGameState({ ...state });
    // 若本次動作觸發了骰子結果，顯示動畫
    if (state.lastDiceResult) setShowDice(true);
  };

  const handleStart = () => {
    engineRef.current.startGame();
    refresh();
  };

  const handleExecuteAction = () => {
    if (!selectedActionId) return;
    engineRef.current.executeAction(selectedActionId);
    refresh();
  };

  const handleEndTurn = () => {
    engineRef.current.endTurn();
    refresh();
  };

  const handleReset = () => {
    engineRef.current = new RuleEngine(JSON.parse(JSON.stringify(gameModule)));
    const state = engineRef.current.getGameState();
    setGameState({ ...state });
    setSelectedActionId(gameModule.actions[0]?.id ?? '');
    setShowDice(false);
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
      case 'moveToken':  return `移動 ${tname(p.tokenId)}`;
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
    <div className="flex flex-col gap-4">
      {/* 骰子動畫覆蓋層 */}
      {showDice && gameState.lastDiceResult && (
        <DiceOverlay
          result={gameState.lastDiceResult}
          onClose={() => setShowDice(false)}
        />
      )}

      {/* 遊戲結束 */}
      {gameState.phase === 'ended' && (
        <GameEndScreen gameState={gameState} onReset={handleReset} />
      )}

      <div className="flex gap-4">
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
                className={`${isCurrent ? 'border-blue-400 bg-blue-50' : ''} ${isLoser ? 'opacity-50' : ''}`}
              >
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                    {gameState.winner?.id === player.id && <Trophy className="w-3.5 h-3.5 text-yellow-500" />}
                    {isLoser && <span className="text-red-400">✗</span>}
                    {player.name}
                    {isCurrent && <span className="text-xs text-blue-500 font-normal">（當前）</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 text-xs text-gray-600 space-y-1.5">
                  <div className="flex gap-3">
                    <span>分數：{player.score}</span>
                    <span className="text-gray-400">回合：{playerTurns}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(tokenCounts).length === 0
                      ? <span className="text-gray-400">無 Token</span>
                      : Object.entries(tokenCounts).map(([tid, cnt]) => {
                          const token = gameState.module.tokens.find(t => t.id === tid);
                          return (
                            <span key={tid} className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-200 rounded">
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
        </div>

        {/* 操作區 */}
        <div className="flex-1 space-y-4">
          {gameState.phase === 'playing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>執行動作</span>
                  {limit > 0 && (
                    <span className={`text-sm font-normal px-2 py-0.5 rounded ${
                      actionBlocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {used} / {limit} 次
                    </span>
                  )}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleExecuteAction}
                    disabled={!selectedActionId || actionBlocked}
                  >
                    <Play className="w-4 h-4 mr-1" /> 執行
                  </Button>
                  <Button variant="outline" onClick={handleEndTurn}>
                    <SkipForward className="w-4 h-4 mr-1" /> 結束回合
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
            <CardHeader><CardTitle>事件日誌</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 overflow-y-auto bg-gray-50 rounded p-2 space-y-1 text-xs text-gray-700 font-mono">
                {gameState.eventLog.length === 0 ? (
                  <div className="text-gray-400">尚無事件</div>
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
          <h2 className="text-lg font-semibold">規則</h2>
          {gameState.module.rules
            .slice()
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
            .map(rule => (
              <Card key={rule.id} className="text-xs">
                <CardContent className="py-2 px-3 space-y-1">
                  <div className="font-medium flex justify-between">
                    <span className="truncate">{rule.id}</span>
                    {(rule.priority ?? 0) !== 0 && (
                      <span className="text-gray-400 ml-1 shrink-0">P{rule.priority}</span>
                    )}
                  </div>
                  <div className="text-gray-500">觸發：{rule.trigger}</div>
                  <div className="text-gray-500">
                    條件：{rule.condition.type}
                    {rule.condition.tokenId && ` (${rule.condition.tokenId} ≥ ${rule.condition.count})`}
                    {rule.condition.amount !== undefined && ` (分數 ${rule.condition.operator ?? '>='} ${rule.condition.amount})`}
                    {rule.condition.type === 'playerTurnCount' && ` (回合 ${rule.condition.operator ?? '>='} ${rule.condition.count})`}
                  </div>
                  <div className="text-gray-500">
                    動作：{rule.action.type}
                    {rule.action.amount !== undefined && ` (+${rule.action.amount})`}
                  </div>
                </CardContent>
              </Card>
            ))
          }
          {gameState.module.rules.length === 0 && (
            <div className="text-xs text-gray-400">尚無規則</div>
          )}
        </div>
      </div>
    </div>
  );
};
