import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GameModule, GameState } from '../engine/types';
import { RuleEngine } from '../engine/ruleEngine';
import { RotateCcw, Play, SkipForward } from 'lucide-react';

interface GameBoardProps {
  gameModule: GameModule;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameModule }) => {
  const engineRef = useRef<RuleEngine>(new RuleEngine(JSON.parse(JSON.stringify(gameModule))));
  const [gameState, setGameState] = useState<GameState>(engineRef.current.getGameState());
  const [selectedActionId, setSelectedActionId] = useState<string>(
    gameModule.actions[0]?.id ?? ''
  );
  const [selectedTokenId, setSelectedTokenId] = useState<string>(
    gameModule.tokens[0]?.id ?? ''
  );

  const refresh = () => {
    setGameState({ ...engineRef.current.getGameState() });
  };

  const handleExecuteAction = () => {
    if (!selectedActionId) return;
    engineRef.current.executeAction(selectedActionId, { tokenId: selectedTokenId });
    refresh();
  };

  const handleEndTurn = () => {
    engineRef.current.endTurn();
    refresh();
  };

  const handleReset = () => {
    engineRef.current = new RuleEngine(JSON.parse(JSON.stringify(gameModule)));
    setGameState(engineRef.current.getGameState());
  };

  const currentPlayer = gameState.currentPlayer;

  return (
    <div className="flex flex-col gap-4">
      {/* 遊戲狀態橫幅 */}
      {gameState.gameOver && (
        <div className="p-4 bg-green-100 border border-green-400 rounded-lg text-center text-green-800 font-bold text-lg">
          遊戲結束！勝利者：{gameState.winner?.name}
          <Button className="ml-4" variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> 重新開始
          </Button>
        </div>
      )}

      <div className="flex gap-4">
        {/* 玩家資訊 */}
        <div className="w-64 space-y-3">
          <h2 className="text-lg font-semibold">玩家</h2>
          {gameState.module.players.map(player => {
            const isCurrent = player.id === currentPlayer.id;
            const tokenCounts: Record<string, number> = {};
            player.tokens.forEach(tid => {
              tokenCounts[tid] = (tokenCounts[tid] ?? 0) + 1;
            });
            return (
              <Card key={player.id} className={isCurrent ? 'border-blue-400 bg-blue-50' : ''}>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                    {player.name}
                    {isCurrent && <span className="text-xs text-blue-500 font-normal">（當前）</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 text-xs text-gray-600 space-y-1">
                  <div>分數：{player.score}</div>
                  <div>
                    Token：
                    {Object.keys(tokenCounts).length === 0 ? '無' : Object.entries(tokenCounts).map(([tid, cnt]) => {
                      const token = gameState.module.tokens.find(t => t.id === tid);
                      return (
                        <span key={tid} className="ml-1 px-1 bg-yellow-100 rounded">
                          {token?.name ?? tid} ×{cnt}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 中央操作區 */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>執行動作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">動作</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedActionId}
                    onChange={e => setSelectedActionId(e.target.value)}
                    disabled={gameState.gameOver}
                  >
                    {gameState.module.actions.map(action => (
                      <option key={action.id} value={action.id}>{action.name}</option>
                    ))}
                  </select>
                </div>
                {selectedActionId === 'buyToken' && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Token</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedTokenId}
                      onChange={e => setSelectedTokenId(e.target.value)}
                      disabled={gameState.gameOver}
                    >
                      {gameState.module.tokens.map(token => (
                        <option key={token.id} value={token.id}>{token.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExecuteAction} disabled={gameState.gameOver}>
                  <Play className="w-4 h-4 mr-1" /> 執行
                </Button>
                <Button variant="outline" onClick={handleEndTurn} disabled={gameState.gameOver}>
                  <SkipForward className="w-4 h-4 mr-1" /> 結束回合
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> 重置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 事件日誌 */}
          <Card>
            <CardHeader>
              <CardTitle>事件日誌</CardTitle>
            </CardHeader>
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
          {gameState.module.rules.map(rule => (
            <Card key={rule.id} className="text-xs">
              <CardContent className="py-2 px-3 space-y-1">
                <div className="font-medium">{rule.id}</div>
                <div className="text-gray-500">觸發：{rule.trigger}</div>
                <div className="text-gray-500">
                  條件：{rule.condition.type}
                  {rule.condition.tokenId && ` (${rule.condition.tokenId} ≥ ${rule.condition.count})`}
                </div>
                <div className="text-gray-500">動作：{rule.action.type}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
