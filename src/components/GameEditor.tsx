import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Token, GameModule, BoardItem, Action, ActionType, Player, BoardConfig, GameVariable } from '../engine/types';
import { createDragItem, createBoardItem, calculateDropPosition, snapToGrid } from '../utils/dragDropHelpers';
import { downloadGameModule } from '../utils/jsonLoader';
import { Plus, Trash2, Save, Users, Grid, Zap, Layout, Variable } from 'lucide-react';
import { Tooltip } from './ui/tooltip';

interface GameEditorProps {
  gameModule: GameModule;
  onGameModuleChange: (module: GameModule) => void;
}

// ─── Action type metadata ─────────────────────────────────────────────────────
const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  gainToken:    '獲得 Token',
  spendToken:   '消耗 Token',
  tradeToken:   '交易 Token',
  rollDice:     '擲骰子',
  drawCard:     '抽牌',
  moveToken:    '移動 Token',
  setVariable:  '設定變數',
  addVariable:  '增加變數',
};

const defaultParams = (type: ActionType, tokens: Token[]): Record<string, any> => {
  const firstId = tokens[0]?.id ?? '';
  switch (type) {
    case 'gainToken':  return { tokenId: firstId, count: 1 };
    case 'spendToken': return { tokenId: firstId, count: 1 };
    case 'tradeToken': return { fromTokenId: firstId, fromCount: 1, toTokenId: tokens[1]?.id ?? firstId, toCount: 1 };
    case 'rollDice':   return { sides: 6 };
    case 'drawCard':   return { tokenId: firstId };
    case 'moveToken':  return { tokenId: firstId };
    case 'setVariable': return { variableId: '', value: 0 };
    case 'addVariable': return { variableId: '', amount: 1 };
  }
};

const DEFAULT_BOARD_CONFIG: BoardConfig = {
  width: 800,
  height: 500,
  gridSize: 40,
  showGrid: true,
};

// ─── Draggable token chip ─────────────────────────────────────────────────────
const DraggableToken: React.FC<{
  token: Token;
  onSelect: (token: Token) => void;
  isSelected: boolean;
}> = ({ token, onSelect, isSelected }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'token',
    item: () => createDragItem('token', token.id, token.name),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag}
      className={`flex-1 p-2 border rounded cursor-move transition-colors text-sm ${
        isDragging ? 'opacity-50' : ''
      } ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-yellow-50 hover:bg-yellow-100 border-gray-200'}`}
      onClick={(e) => { e.stopPropagation(); onSelect(token); }}
    >
      <div className="font-medium truncate flex items-center gap-1">
        {token.icon && <span>{token.icon}</span>}
        {token.name}
      </div>
      <div className="text-xs text-gray-500">{token.type}</div>
    </div>
  );
};

// ─── Droppable workspace ──────────────────────────────────────────────────────
const DroppableWorkspace: React.FC<{
  onDrop: (item: any, position: { x: number; y: number }) => void;
  boardItems: BoardItem[];
  tokens: Token[];
  onItemClick: (item: BoardItem) => void;
  onItemRemove: (instanceId: string) => void;
  boardConfig: BoardConfig;
}> = ({ onDrop, boardItems, tokens, onItemClick, onItemRemove, boardConfig }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [{ isOver }, drop] = useDrop({
    accept: ['token', 'card', 'dice'],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const position = calculateDropPosition(offset.x, offset.y, rect);
        const snappedPosition = snapToGrid(position, boardConfig.gridSize);
        onDrop(item, snappedPosition);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const setRef = (node: HTMLDivElement | null) => {
    drop(node);
    containerRef.current = node;
  };

  const bgColor = boardConfig.backgroundColor ?? '#ffffff';
  const gridStyle: React.CSSProperties = boardConfig.showGrid ? {
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${boardConfig.gridSize}px ${boardConfig.gridSize}px`,
    backgroundColor: bgColor,
  } : { backgroundColor: bgColor };

  return (
    <div
      ref={setRef}
      className={`relative border-2 rounded-lg transition-colors overflow-hidden ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      }`}
      style={{
        width: boardConfig.width,
        height: boardConfig.height,
        ...gridStyle,
        borderColor: isOver ? '#3b82f6' : '#d1d5db',
      }}
    >
      {boardItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none select-none">
          {isOver ? '放開滑鼠放置元件' : '從左側拖放元件到此處'}
        </div>
      )}

      {boardItems.map((item) => {
        const token = tokens.find(t => t.id === item.id);
        return (
          <div
            key={item.instanceId}
            className="absolute cursor-pointer p-2 bg-white border border-gray-300 rounded shadow-sm hover:shadow-md transition-shadow group select-none"
            style={{ left: item.position.x, top: item.position.y, minWidth: '64px' }}
            onClick={() => onItemClick(item)}
          >
            <div className="text-sm font-medium text-center">
              {token?.icon && <span className="mr-1">{token.icon}</span>}
              {token?.name ?? item.id}
            </div>
            <button
              className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center leading-none"
              onClick={(e) => { e.stopPropagation(); onItemRemove(item.instanceId); }}
            >×</button>
          </div>
        );
      })}
    </div>
  );
};

// ─── Action params editor ─────────────────────────────────────────────────────
const ActionParamsEditor: React.FC<{
  action: Action;
  tokens: Token[];
  variables?: GameVariable[];
  onChange: (params: Record<string, any>) => void;
}> = ({ action, tokens, variables = [], onChange }) => {
  const p = action.params;
  const set = (key: string, value: any) => onChange({ ...p, [key]: value });

  const tokenSelect = (key: string) => (
    <select
      className="w-full p-1.5 border rounded text-sm"
      value={p[key] ?? ''}
      onChange={e => set(key, e.target.value)}
    >
      {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );

  const numInput = (key: string, min = 1) => (
    <input
      type="number"
      min={min}
      className="w-full p-1.5 border rounded text-sm"
      value={p[key] ?? min}
      onChange={e => set(key, parseInt(e.target.value) || min)}
    />
  );

  switch (action.type) {
    case 'gainToken':
    case 'spendToken':
      return (
        <div className="space-y-2">
          <div><label className="block text-xs font-medium mb-0.5">Token</label>{tokenSelect('tokenId')}</div>
          <div><label className="block text-xs font-medium mb-0.5">數量</label>{numInput('count')}</div>
        </div>
      );
    case 'tradeToken':
      return (
        <div className="space-y-2">
          <div><label className="block text-xs font-medium mb-0.5">消耗 Token</label>{tokenSelect('fromTokenId')}</div>
          <div><label className="block text-xs font-medium mb-0.5">消耗數量</label>{numInput('fromCount')}</div>
          <div><label className="block text-xs font-medium mb-0.5">換得 Token</label>{tokenSelect('toTokenId')}</div>
          <div><label className="block text-xs font-medium mb-0.5">換得數量</label>{numInput('toCount')}</div>
        </div>
      );
    case 'rollDice':
      return (
        <div><label className="block text-xs font-medium mb-0.5">面數</label>{numInput('sides', 2)}</div>
      );
    case 'drawCard':
    case 'moveToken':
      return (
        <div><label className="block text-xs font-medium mb-0.5">Token</label>{tokenSelect('tokenId')}</div>
      );
    case 'setVariable':
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-0.5">變數</label>
            <select
              className="w-full p-1.5 border rounded text-sm"
              value={p.variableId ?? ''}
              onChange={e => set('variableId', e.target.value)}
            >
              <option value="">-- 選擇變數 --</option>
              {variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium mb-0.5">設為值</label>{numInput('value', 0)}</div>
        </div>
      );
    case 'addVariable':
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-0.5">變數</label>
            <select
              className="w-full p-1.5 border rounded text-sm"
              value={p.variableId ?? ''}
              onChange={e => set('variableId', e.target.value)}
            >
              <option value="">-- 選擇變數 --</option>
              {variables.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-0.5">增加量（可為負數）</label>
            <input
              type="number"
              className="w-full p-1.5 border rounded text-sm"
              value={p.amount ?? 1}
              onChange={e => set('amount', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
};

// ─── Variables Panel ─────────────────────────────────────────────────────────
const VariablesPanel: React.FC<{
  gameModule: GameModule;
  onChange: (module: GameModule) => void;
}> = ({ gameModule, onChange }) => {
  const variables = gameModule.variables ?? [];

  const addVariable = () => {
    const newVar: GameVariable = {
      id: `var_${Date.now()}`,
      name: '新變數',
      defaultValue: 0,
    };
    onChange({ ...gameModule, variables: [...variables, newVar] });
  };

  const updateVariable = (updated: GameVariable) => {
    onChange({ ...gameModule, variables: variables.map(v => v.id === updated.id ? updated : v) });
  };

  const removeVariable = (id: string) => {
    onChange({ ...gameModule, variables: variables.filter(v => v.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">遊戲變數（{variables.length}）</span>
        <Tooltip content="新增自訂遊戲變數（血量、魔力等數值）" side="left">
          <Button size="sm" onClick={addVariable}><Plus className="w-3.5 h-3.5" /></Button>
        </Tooltip>
      </div>
      {variables.length === 0 && (
        <div className="text-xs text-gray-400 text-center py-4">
          點擊 + 新增遊戲變數<br />
          <span className="text-gray-300">例：血量、魔力、回合計數</span>
        </div>
      )}
      {variables.map(v => (
        <div key={v.id} className="border rounded-lg p-3 space-y-2 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 p-1.5 border rounded text-sm font-medium"
              value={v.name}
              placeholder="變數名稱"
              onChange={e => updateVariable({ ...v, name: e.target.value })}
            />
            <Button variant="destructive" size="sm" onClick={() => removeVariable(v.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">預設值</span>
            <input
              type="number"
              className="w-20 p-1 border rounded text-xs text-center"
              value={v.defaultValue}
              onChange={e => updateVariable({ ...v, defaultValue: parseInt(e.target.value) || 0 })}
            />
            <span className="text-xs text-gray-400">ID: {v.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Board Config Panel ──────────────────────────────────────────────────────
const BoardConfigPanel: React.FC<{
  config: BoardConfig;
  onChange: (config: BoardConfig) => void;
}> = ({ config, onChange }) => {
  const set = (key: keyof BoardConfig, value: any) => onChange({ ...config, [key]: value });

  return (
    <div className="space-y-3 p-3 bg-gray-50 border rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Grid className="w-4 h-4" /> 棋盤設定
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-0.5">寬度 (px)</label>
          <input
            type="number"
            min={200}
            max={2000}
            step={40}
            className="w-full p-1.5 border rounded text-sm"
            value={config.width}
            onChange={e => set('width', parseInt(e.target.value) || 800)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-0.5">高度 (px)</label>
          <input
            type="number"
            min={200}
            max={2000}
            step={40}
            className="w-full p-1.5 border rounded text-sm"
            value={config.height}
            onChange={e => set('height', parseInt(e.target.value) || 500)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-0.5">格線間距 (px)</label>
          <input
            type="number"
            min={10}
            max={200}
            step={10}
            className="w-full p-1.5 border rounded text-sm"
            value={config.gridSize}
            onChange={e => set('gridSize', parseInt(e.target.value) || 40)}
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={e => set('showGrid', e.target.checked)}
              className="w-4 h-4"
            />
            顯示格線
          </label>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-0.5">棋盤背景色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 border rounded cursor-pointer p-0.5"
              value={config.backgroundColor ?? '#ffffff'}
              onChange={e => set('backgroundColor', e.target.value)}
            />
            <input
              type="text"
              className="flex-1 p-1.5 border rounded text-sm font-mono"
              value={config.backgroundColor ?? '#ffffff'}
              onChange={e => set('backgroundColor', e.target.value)}
            />
            <button
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
              onClick={() => set('backgroundColor', '#ffffff')}
              title="重設為白色"
            >重設</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Players Panel ────────────────────────────────────────────────────────────
const PlayersPanel: React.FC<{
  gameModule: GameModule;
  onChange: (module: GameModule) => void;
}> = ({ gameModule, onChange }) => {
  const addPlayer = () => {
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: `玩家${gameModule.players.length + 1}`,
      tokens: [],
      score: 0,
    };
    onChange({ ...gameModule, players: [...gameModule.players, newPlayer] });
  };

  const removePlayer = (playerId: string) => {
    if (gameModule.players.length <= 1) return;
    const newPlayers = gameModule.players.filter(p => p.id !== playerId);
    const newCurrentId = gameModule.turn.currentPlayerId === playerId
      ? newPlayers[0].id
      : gameModule.turn.currentPlayerId;
    onChange({
      ...gameModule,
      players: newPlayers,
      turn: { ...gameModule.turn, currentPlayerId: newCurrentId },
    });
  };

  const updatePlayer = (updated: Player) => {
    onChange({ ...gameModule, players: gameModule.players.map(p => p.id === updated.id ? updated : p) });
  };

  // 調整玩家初始 token
  const setInitialToken = (player: Player, tokenId: string, count: number) => {
    const base = player.tokens.filter(t => t !== tokenId);
    const added = count > 0 ? Array(count).fill(tokenId) : [];
    updatePlayer({ ...player, tokens: [...base, ...added] });
  };

  const getTokenCount = (player: Player, tokenId: string) =>
    player.tokens.filter(t => t === tokenId).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">玩家列表（{gameModule.players.length} 人）</span>
        <Button size="sm" onClick={addPlayer}><Plus className="w-3.5 h-3.5" /></Button>
      </div>

      {gameModule.players.map(player => (
        <div key={player.id} className="border rounded-lg p-3 space-y-2 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 p-1.5 border rounded text-sm font-medium"
              value={player.name}
              onChange={e => updatePlayer({ ...player, name: e.target.value })}
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={gameModule.players.length <= 1}
              onClick={() => removePlayer(player.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 font-medium">初始資源</div>
          {gameModule.tokens.length === 0 ? (
            <div className="text-xs text-gray-400">尚無元件</div>
          ) : (
            <div className="space-y-1">
              {gameModule.tokens.map(token => (
                <div key={token.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 flex-1 truncate">{token.name}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    className="w-14 p-1 border rounded text-xs text-center"
                    value={getTokenCount(player, token.id)}
                    onChange={e => setInitialToken(player, token.id, Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-500">初始分數</span>
            <input
              type="number"
              className="w-16 p-1 border rounded text-xs text-center"
              value={player.score}
              onChange={e => updatePlayer({ ...player, score: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      ))}

      <div className="pt-2">
        <label className="block text-xs font-medium mb-1 text-gray-600">每回合行動次數</label>
        <input
          type="number"
          min={0}
          className="w-full p-1.5 border rounded text-sm"
          value={gameModule.turn.actionsPerTurn}
          onChange={e => onChange({
            ...gameModule,
            turn: { ...gameModule.turn, actionsPerTurn: parseInt(e.target.value) || 0 },
          })}
        />
        <div className="text-xs text-gray-400 mt-0.5">設為 0 表示不限次數</div>
      </div>
    </div>
  );
};

// ─── Main GameEditor ──────────────────────────────────────────────────────────
export const GameEditor: React.FC<GameEditorProps> = ({ gameModule, onGameModuleChange }) => {
  const [leftTab, setLeftTab] = useState<'tokens' | 'actions' | 'players' | 'variables'>('tokens');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showBoardConfig, setShowBoardConfig] = useState(false);

  const boardItems = gameModule.board?.items ?? [];
  const boardConfig = gameModule.boardConfig ?? DEFAULT_BOARD_CONFIG;

  // ── board helpers ──
  const setBoardItems = (updater: BoardItem[] | ((prev: BoardItem[]) => BoardItem[])) => {
    const prev = gameModule.board?.items ?? [];
    const next = typeof updater === 'function' ? updater(prev) : updater;
    onGameModuleChange({ ...gameModule, board: { items: next } });
  };

  const handleDrop = (item: any, position: { x: number; y: number }) => {
    setBoardItems(prev => [...prev, createBoardItem(item, position)]);
  };

  const handleItemClick = (item: BoardItem) => {
    const token = gameModule.tokens.find(t => t.id === item.id);
    if (token) { setSelectedToken(token); setLeftTab('tokens'); }
  };

  const handleItemRemove = (instanceId: string) => {
    setBoardItems(prev => prev.filter(i => i.instanceId !== instanceId));
  };

  // ── token helpers ──
  const addToken = () => {
    const newToken: Token = { id: `token_${Date.now()}`, name: '新元件', type: 'resource' };
    onGameModuleChange({ ...gameModule, tokens: [...gameModule.tokens, newToken] });
    setSelectedToken(newToken);
    setLeftTab('tokens');
  };

  const removeToken = (tokenId: string) => {
    onGameModuleChange({
      ...gameModule,
      tokens: gameModule.tokens.filter(t => t.id !== tokenId),
      board: { items: boardItems.filter(i => i.id !== tokenId) },
    });
    if (selectedToken?.id === tokenId) setSelectedToken(null);
  };

  const updateToken = (updated: Token) => {
    onGameModuleChange({ ...gameModule, tokens: gameModule.tokens.map(t => t.id === updated.id ? updated : t) });
    setSelectedToken(updated);
  };

  // ── action helpers ──
  const addAction = () => {
    const newAction: Action = {
      id: `action_${Date.now()}`,
      name: '新動作',
      type: 'gainToken',
      params: defaultParams('gainToken', gameModule.tokens),
    };
    onGameModuleChange({ ...gameModule, actions: [...gameModule.actions, newAction] });
    setSelectedAction(newAction);
    setLeftTab('actions');
  };

  const removeAction = (actionId: string) => {
    onGameModuleChange({ ...gameModule, actions: gameModule.actions.filter(a => a.id !== actionId) });
    if (selectedAction?.id === actionId) setSelectedAction(null);
  };

  const updateAction = (updated: Action) => {
    onGameModuleChange({ ...gameModule, actions: gameModule.actions.map(a => a.id === updated.id ? updated : a) });
    setSelectedAction(updated);
  };

  // ── board config helper ──
  const updateBoardConfig = (config: BoardConfig) => {
    onGameModuleChange({ ...gameModule, boardConfig: config });
  };

  // ── right panel content ──
  const isActionSelected = selectedAction && leftTab === 'actions';

  const LEFT_TABS = [
    { id: 'tokens'    as const, label: '元件', icon: <Layout className="w-3.5 h-3.5" /> },
    { id: 'actions'   as const, label: '動作', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'players'   as const, label: '玩家', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'variables' as const, label: '變數', icon: <Variable className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── 左側面板 ── */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* tabs */}
        <div className="flex border-b">
          {LEFT_TABS.map(tab => {
            const tips: Record<string, string> = {
              tokens:    '管理遊戲元件（Token）：資源、卡牌、棋子',
              actions:   '設定玩家每回合可執行的動作',
              players:   '新增/刪除玩家、設定初始資源與回合行動次數',
              variables: '自訂遊戲變數（血量、魔力等）',
            };
            return (
              <Tooltip key={tab.id} content={tips[tab.id]} side="bottom">
                <button
                  className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    leftTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setLeftTab(tab.id)}
                >
                  {tab.icon}{tab.label}
                </button>
              </Tooltip>
            );
          })}
        </div>

        {leftTab === 'tokens' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">元件列表</span>
              <Tooltip content="新增 Token（元件）" side="left">
                <Button size="sm" onClick={addToken}><Plus className="w-3.5 h-3.5" /></Button>
              </Tooltip>
            </div>
            <div className="space-y-1.5">
              {gameModule.tokens.map(token => (
                <div key={token.id} className="flex items-center gap-1.5">
                  <DraggableToken
                    token={token}
                    onSelect={(t) => { setSelectedToken(t); setSelectedAction(null); }}
                    isSelected={selectedToken?.id === token.id}
                  />
                  <Button variant="destructive" size="sm" onClick={() => removeToken(token.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {gameModule.tokens.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4">點擊 + 新增元件</div>
              )}
            </div>
          </div>
        )}

        {leftTab === 'actions' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">動作列表</span>
              <Tooltip content="新增玩家動作" side="left">
                <Button size="sm" onClick={addAction}><Plus className="w-3.5 h-3.5" /></Button>
              </Tooltip>
            </div>
            <div className="space-y-1.5">
              {gameModule.actions.map(action => (
                <div
                  key={action.id}
                  className={`flex items-center gap-1.5 p-2 border rounded cursor-pointer transition-colors text-sm ${
                    selectedAction?.id === action.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                  onClick={() => { setSelectedAction(action); setSelectedToken(null); }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{action.name}</div>
                    <div className="text-xs text-gray-500">{ACTION_TYPE_LABELS[action.type]}</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); removeAction(action.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {gameModule.actions.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4">點擊 + 新增動作</div>
              )}
            </div>
          </div>
        )}

        {leftTab === 'players' && (
          <div className="flex-1 overflow-y-auto p-3">
            <PlayersPanel gameModule={gameModule} onChange={onGameModuleChange} />
          </div>
        )}

        {leftTab === 'variables' && (
          <div className="flex-1 overflow-y-auto p-3">
            <VariablesPanel gameModule={gameModule} onChange={onGameModuleChange} />
          </div>
        )}
      </div>

      {/* ── 中央工作區 ── */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0 overflow-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="text-xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 outline-none px-1 py-0.5 transition-colors"
              value={gameModule.gameName.zh}
              onChange={e => onGameModuleChange({ ...gameModule, gameName: { ...gameModule.gameName, zh: e.target.value } })}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* 主題色 */}
            <Tooltip content="遊戲主題色彩" side="bottom">
              <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white text-xs text-gray-600">
                <span>主題色</span>
                <input
                  type="color"
                  className="w-6 h-6 border-0 rounded cursor-pointer p-0"
                  value={gameModule.theme?.primaryColor ?? '#3b82f6'}
                  onChange={e => onGameModuleChange({
                    ...gameModule,
                    theme: { ...(gameModule.theme ?? {}), primaryColor: e.target.value },
                  })}
                />
              </div>
            </Tooltip>
            <Button
              variant={showBoardConfig ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowBoardConfig(v => !v)}
            >
              <Grid className="w-4 h-4 mr-1" />
              棋盤設定
            </Button>
            <Button onClick={() => downloadGameModule(gameModule, 'game_module.json')}>
              <Save className="w-4 h-4 mr-2" />
              匯出 JSON
            </Button>
          </div>
        </div>

        {showBoardConfig && (
          <BoardConfigPanel config={boardConfig} onChange={updateBoardConfig} />
        )}

        <div className="overflow-auto">
          <DroppableWorkspace
            onDrop={handleDrop}
            boardItems={boardItems}
            tokens={gameModule.tokens}
            onItemClick={handleItemClick}
            onItemRemove={handleItemRemove}
            boardConfig={boardConfig}
          />
        </div>

        <div className="text-xs text-gray-400">
          已放置元件：{boardItems.length} 個 ｜ 格線：{boardConfig.gridSize}px ｜ {boardConfig.width}×{boardConfig.height}
        </div>
      </div>

      {/* ── 右側屬性面板 ── */}
      <div className="w-64 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">屬性面板</h2>

        {isActionSelected && selectedAction ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-0.5">動作名稱</label>
              <input
                type="text"
                className="w-full p-1.5 border rounded text-sm"
                value={selectedAction.name}
                onChange={e => updateAction({ ...selectedAction, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">動作類型</label>
              <select
                className="w-full p-1.5 border rounded text-sm"
                value={selectedAction.type}
                onChange={e => {
                  const type = e.target.value as ActionType;
                  updateAction({ ...selectedAction, type, params: defaultParams(type, gameModule.tokens) });
                }}
              >
                {(Object.keys(ACTION_TYPE_LABELS) as ActionType[]).map(t => (
                  <option key={t} value={t}>{ACTION_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">動作 ID</label>
              <input
                type="text"
                className="w-full p-1.5 border rounded text-sm text-gray-500"
                value={selectedAction.id}
                onChange={e => updateAction({ ...selectedAction, id: e.target.value })}
              />
            </div>
            <hr />
            <div>
              <div className="text-xs font-medium mb-1 text-gray-600">參數設定</div>
              <ActionParamsEditor
                action={selectedAction}
                tokens={gameModule.tokens}
                variables={gameModule.variables}
                onChange={params => updateAction({ ...selectedAction, params })}
              />
            </div>
          </div>
        ) : selectedToken ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-0.5">名稱</label>
              <input
                type="text"
                className="w-full p-1.5 border rounded text-sm"
                value={selectedToken.name}
                onChange={e => updateToken({ ...selectedToken, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">圖示（Emoji 或文字）</label>
              <input
                type="text"
                className="w-full p-1.5 border rounded text-sm"
                placeholder="例：🪙 ⚔️ ❤️"
                value={selectedToken.icon ?? ''}
                onChange={e => updateToken({ ...selectedToken, icon: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">類型</label>
              <select
                className="w-full p-1.5 border rounded text-sm"
                value={selectedToken.type}
                onChange={e => updateToken({ ...selectedToken, type: e.target.value as any })}
              >
                <option value="resource">資源</option>
                <option value="card">卡片</option>
                <option value="dice">骰子</option>
                <option value="custom">自訂</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">ID</label>
              <input
                type="text"
                className="w-full p-1.5 border rounded text-sm text-gray-500"
                value={selectedToken.id}
                readOnly
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400">選擇左側元件或動作以編輯屬性</div>
        )}
      </div>
    </div>
  );
};
