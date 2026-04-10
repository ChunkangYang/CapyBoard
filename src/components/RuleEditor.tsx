import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Rule, GameModule, Condition, GameAction } from '../engine/types';
import { Plus, Trash2 } from 'lucide-react';

interface RuleEditorProps {
  gameModule: GameModule;
  onGameModuleChange: (module: GameModule) => void;
}

const TRIGGER_OPTIONS: { value: Rule['trigger']; label: string }[] = [
  { value: 'onActionEnd',    label: '動作結束後' },
  { value: 'onTurnEnd',      label: '回合結束後' },
  { value: 'onObjectChange', label: '物件變更時' },
];

const CONDITION_TYPE_OPTIONS = [
  { value: 'hasTokenCount',   label: '擁有 Token 數量' },
  { value: 'hasScore',        label: '玩家分數' },
  { value: 'playerTurnCount', label: '玩家回合數' },
  { value: 'tokenAtPosition', label: 'Token 在棋盤位置' },
];

const COMPARE_OPTIONS = [
  { value: '>=',  label: '≥' },
  { value: '>',   label: '>' },
  { value: '<=',  label: '≤' },
  { value: '<',   label: '<' },
  { value: '===', label: '=' },
];

const RULE_ACTION_TYPE_OPTIONS = [
  { value: 'winGame',  label: '遊戲獲勝' },
  { value: 'loseGame', label: '玩家落敗' },
  { value: 'addScore', label: '加分' },
];

const emptyCondition = (gameModule: GameModule): Condition => ({
  type: 'hasTokenCount',
  tokenId: gameModule.tokens[0]?.id ?? '',
  count: 1,
});

const emptyGameAction = (): GameAction => ({
  type: 'winGame',
  playerId: '{currentPlayer}',
});

const emptyRule = (gameModule: GameModule): Rule => ({
  id: `rule_${Date.now()}`,
  trigger: 'onActionEnd',
  condition: emptyCondition(gameModule),
  action: emptyGameAction(),
  priority: 0,
});

const resetCondition = (type: string, gameModule: GameModule): Condition => {
  switch (type) {
    case 'hasTokenCount':
      return { type, tokenId: gameModule.tokens[0]?.id ?? '', count: 1 };
    case 'hasScore':
      return { type, playerId: '{currentPlayer}', operator: '>=', amount: 10 };
    case 'playerTurnCount':
      return { type, playerId: '{currentPlayer}', operator: '>=', count: 3 };
    case 'tokenAtPosition':
      return { type, tokenId: gameModule.tokens[0]?.id ?? '', gridX: 0, gridY: 0 };
    default:
      return { type };
  }
};

export const RuleEditor: React.FC<RuleEditorProps> = ({ gameModule, onGameModuleChange }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const selectedRule = gameModule.rules.find(r => r.id === selectedRuleId) ?? null;

  const updateRule = (updated: Rule) => {
    onGameModuleChange({
      ...gameModule,
      rules: gameModule.rules.map(r => r.id === updated.id ? updated : r),
    });
  };

  const addRule = () => {
    const newRule = emptyRule(gameModule);
    onGameModuleChange({ ...gameModule, rules: [...gameModule.rules, newRule] });
    setSelectedRuleId(newRule.id);
  };

  const removeRule = (ruleId: string) => {
    onGameModuleChange({ ...gameModule, rules: gameModule.rules.filter(r => r.id !== ruleId) });
    if (selectedRuleId === ruleId) setSelectedRuleId(null);
  };

  return (
    <div className="flex h-full gap-4">
      {/* 規則列表 */}
      <div className="w-64 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">規則列表</h2>
          <Button size="sm" onClick={addRule}><Plus className="w-4 h-4" /></Button>
        </div>
        {gameModule.rules.length === 0 && (
          <div className="text-sm text-gray-400">尚無規則，點擊 + 新增</div>
        )}
        {gameModule.rules
          .slice()
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
          .map(rule => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                selectedRuleId === rule.id
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setSelectedRuleId(rule.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{rule.id}</div>
                <div className="text-xs text-gray-500 flex gap-2">
                  <span>{TRIGGER_OPTIONS.find(t => t.value === rule.trigger)?.label}</span>
                  {(rule.priority ?? 0) !== 0 && (
                    <span className="text-blue-400">P{rule.priority}</span>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="ml-2 shrink-0"
                onClick={(e) => { e.stopPropagation(); removeRule(rule.id); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
      </div>

      {/* 規則編輯區 */}
      <div className="flex-1 overflow-y-auto">
        {selectedRule ? (
          <div className="space-y-4">
            {/* 基本設定 */}
            <Card>
              <CardHeader><CardTitle>基本設定</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">規則 ID</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={selectedRule.id}
                    onChange={e => updateRule({ ...selectedRule, id: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">觸發時機</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedRule.trigger}
                      onChange={e => updateRule({ ...selectedRule, trigger: e.target.value as Rule['trigger'] })}
                    >
                      {TRIGGER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium mb-1">優先序</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={selectedRule.priority ?? 0}
                      onChange={e => updateRule({ ...selectedRule, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 條件 */}
            <Card>
              <CardHeader><CardTitle>條件</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">條件類型</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedRule.condition.type}
                    onChange={e => updateRule({
                      ...selectedRule,
                      condition: resetCondition(e.target.value, gameModule),
                    })}
                  >
                    {CONDITION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {selectedRule.condition.type === 'hasTokenCount' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Token</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedRule.condition.tokenId ?? ''}
                        onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, tokenId: e.target.value } })}
                      >
                        <option value="">-- 選擇 Token --</option>
                        {gameModule.tokens.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">需要數量（≥）</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full p-2 border rounded"
                        value={selectedRule.condition.count ?? 1}
                        onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, count: parseInt(e.target.value) || 1 } })}
                      />
                    </div>
                  </>
                )}

                {(selectedRule.condition.type === 'hasScore' || selectedRule.condition.type === 'playerTurnCount') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">目標玩家</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedRule.condition.playerId ?? '{currentPlayer}'}
                        onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, playerId: e.target.value } })}
                      >
                        <option value="{currentPlayer}">當前玩家</option>
                        {gameModule.players.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <label className="block text-sm font-medium mb-1">比較</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={selectedRule.condition.operator ?? '>='}
                          onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, operator: e.target.value } })}
                        >
                          {COMPARE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          {selectedRule.condition.type === 'hasScore' ? '分數' : '回合數'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full p-2 border rounded"
                          value={
                            selectedRule.condition.type === 'hasScore'
                              ? (selectedRule.condition.amount ?? 10)
                              : (selectedRule.condition.count ?? 3)
                          }
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            const key = selectedRule.condition.type === 'hasScore' ? 'amount' : 'count';
                            updateRule({ ...selectedRule, condition: { ...selectedRule.condition, [key]: val } });
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedRule.condition.type === 'tokenAtPosition' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Token</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedRule.condition.tokenId ?? ''}
                        onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, tokenId: e.target.value } })}
                      >
                        <option value="">-- 選擇 Token --</option>
                        {gameModule.tokens.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">格子 X</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full p-2 border rounded"
                          value={selectedRule.condition.gridX ?? 0}
                          onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, gridX: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">格子 Y</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full p-2 border rounded"
                          value={selectedRule.condition.gridY ?? 0}
                          onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, gridY: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      格子座標從 (0,0) 開始，對應棋盤格線位置
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 規則動作 */}
            <Card>
              <CardHeader><CardTitle>動作</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">動作類型</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedRule.action.type}
                    onChange={e => {
                      const type = e.target.value;
                      const base: GameAction = { type, playerId: '{currentPlayer}' };
                      if (type === 'addScore') base.amount = 1;
                      updateRule({ ...selectedRule, action: base });
                    }}
                  >
                    {RULE_ACTION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">目標玩家</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedRule.action.playerId ?? '{currentPlayer}'}
                    onChange={e => updateRule({ ...selectedRule, action: { ...selectedRule.action, playerId: e.target.value } })}
                  >
                    <option value="{currentPlayer}">當前玩家</option>
                    {gameModule.players.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                {selectedRule.action.type === 'addScore' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">加分數量</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full p-2 border rounded"
                      value={selectedRule.action.amount ?? 1}
                      onChange={e => updateRule({ ...selectedRule, action: { ...selectedRule.action, amount: parseInt(e.target.value) || 1 } })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            選擇左側規則進行編輯
          </div>
        )}
      </div>
    </div>
  );
};
