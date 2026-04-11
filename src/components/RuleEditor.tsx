import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Rule, GameModule, Condition, GameAction } from '../engine/types';
import { Plus, Trash2, GitFork } from 'lucide-react';
import { Tooltip } from './ui/tooltip';

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
  { value: 'hasVariable',     label: '遊戲變數' },
  { value: 'and',             label: 'AND（所有條件成立）' },
  { value: 'or',              label: 'OR（任一條件成立）' },
];

const COMPARE_OPTIONS = [
  { value: '>=',  label: '≥' },
  { value: '>',   label: '>' },
  { value: '<=',  label: '≤' },
  { value: '<',   label: '<' },
  { value: '===', label: '=' },
];

const RULE_ACTION_TYPE_OPTIONS = [
  { value: 'winGame',     label: '遊戲獲勝' },
  { value: 'loseGame',    label: '玩家落敗' },
  { value: 'addScore',    label: '加分' },
  { value: 'setVariable', label: '設定變數' },
  { value: 'addVariable', label: '增加變數' },
  { value: 'triggerRule', label: '觸發另一條規則' },
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
    case 'hasVariable':
      return { type, variableId: gameModule.variables?.[0]?.id ?? '', operator: '>=', amount: 1 };
    case 'and':
    case 'or':
      return { type, conditions: [] };
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
          <Tooltip content="新增規則（觸發條件 → 動作）" side="left">
            <Button size="sm" onClick={addRule}><Plus className="w-4 h-4" /></Button>
          </Tooltip>
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

                {selectedRule.condition.type === 'hasVariable' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">目標變數</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedRule.condition.variableId ?? ''}
                        onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, variableId: e.target.value } })}
                      >
                        <option value="">-- 選擇變數 --</option>
                        {gameModule.variables?.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
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
                        <label className="block text-sm font-medium mb-1">數值</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded"
                          value={selectedRule.condition.amount ?? 0}
                          onChange={e => updateRule({ ...selectedRule, condition: { ...selectedRule.condition, amount: parseInt(e.target.value) || 0 } })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {(selectedRule.condition.type === 'and' || selectedRule.condition.type === 'or') && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded p-2">
                      複合條件（{selectedRule.condition.type === 'and' ? 'AND — 所有子條件均需成立' : 'OR — 任一子條件成立即可'}）
                    </div>
                    {(selectedRule.condition.conditions ?? []).map((sub: Condition, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border rounded p-2 text-xs">
                        <span className="flex-1 truncate text-gray-600">
                          #{idx + 1} {sub.type}
                          {sub.tokenId ? ` (${sub.tokenId})` : ''}
                          {sub.variableId ? ` (${sub.variableId})` : ''}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const conditions = (selectedRule.condition.conditions ?? []).filter((_: Condition, i: number) => i !== idx);
                            updateRule({ ...selectedRule, condition: { ...selectedRule.condition, conditions } });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        const newSub: Condition = { type: 'hasTokenCount', tokenId: gameModule.tokens[0]?.id ?? '', count: 1 };
                        const conditions = [...(selectedRule.condition.conditions ?? []), newSub];
                        updateRule({ ...selectedRule, condition: { ...selectedRule.condition, conditions } });
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> 加入子條件
                    </Button>
                    <div className="text-xs text-gray-400">提示：子條件類型可在 JSON 中細調，後續版本將提供完整 UI</div>
                  </div>
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

                {(selectedRule.action.type === 'setVariable' || selectedRule.action.type === 'addVariable') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">目標變數</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedRule.action.variableId ?? ''}
                        onChange={e => updateRule({ ...selectedRule, action: { ...selectedRule.action, variableId: e.target.value } })}
                      >
                        <option value="">-- 選擇變數 --</option>
                        {gameModule.variables?.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {selectedRule.action.type === 'setVariable' ? '設為值' : '增加量（可為負數）'}
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={selectedRule.action.type === 'setVariable'
                          ? (selectedRule.action.value ?? 0)
                          : (selectedRule.action.amount ?? 1)}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          const key = selectedRule.action.type === 'setVariable' ? 'value' : 'amount';
                          updateRule({ ...selectedRule, action: { ...selectedRule.action, [key]: val } });
                        }}
                      />
                    </div>
                  </>
                )}

                {selectedRule.action.type === 'triggerRule' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">目標規則 ID</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedRule.action.ruleId ?? ''}
                      onChange={e => updateRule({ ...selectedRule, action: { ...selectedRule.action, ruleId: e.target.value } })}
                    >
                      <option value="">-- 選擇規則 --</option>
                      {gameModule.rules
                        .filter(r => r.id !== selectedRule.id)
                        .map(r => (
                          <option key={r.id} value={r.id}>{r.id}</option>
                        ))}
                    </select>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      觸發指定規則，條件通過時執行其動作（深度上限 5 層）
                    </div>
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
