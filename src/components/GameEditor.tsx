import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from './ui/button';
import { Token, GameModule, BoardItem, Action, ActionType, Player, BoardConfig, GameVariable, BoardCell, CellTemplateType, CellEvent } from '../engine/types';
import { createDragItem, createBoardItem, calculateDropPosition, snapToGrid } from '../utils/dragDropHelpers';
import { downloadGameModule } from '../utils/jsonLoader';
import { Plus, Trash2, Save, Users, Grid, Zap, Layout, Variable, Map, ChevronRight, ChevronLeft } from 'lucide-react';
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
    case 'moveToken':  return { tokenId: firstId, moveMode: 'steps', steps: 1 };
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

// ─── Chip palette ─────────────────────────────────────────────────────────────
// 溫馨家庭風配色：以暖色系蠟筆色取代賭場的紅黑綠，但保留籌碼的內外圈造型。
type ChipPalette = { base: string; light: string; dark: string; spot: string; text: string };

const CHIP_PALETTES: Record<Token['type'], ChipPalette> = {
  resource: { base: '#F4B860', light: '#FBD08A', dark: '#E09B3D', spot: '#FFF7E8', text: '#7A4E12' }, // 蜂蜜橘
  card:     { base: '#EF8E72', light: '#F7AE97', dark: '#D96E50', spot: '#FFF1EC', text: '#7E3322' }, // 蜜桃珊瑚
  dice:     { base: '#8FBF9F', light: '#B0D6BC', dark: '#6FA582', spot: '#EFFAF1', text: '#2F5C3E' }, // 抹茶綠
  custom:   { base: '#B89FD4', light: '#D0BCE6', dark: '#9A7CC0', spot: '#F5EFFB', text: '#4C357A' }, // 薰衣草紫
};

const chipPaletteFor = (token: Token): ChipPalette =>
  CHIP_PALETTES[token.type] ?? CHIP_PALETTES.custom;

/** 賭場籌碼造型元件：外圈邊點 + 內圈虛線環 + 中心符號 / emoji。 */
const TokenChip: React.FC<{
  token: Token;
  size?: number;
  selected?: boolean;
  dragging?: boolean;
}> = ({ token, size = 56, selected = false, dragging = false }) => {
  const c = chipPaletteFor(token);
  const center = token.icon?.trim() || token.name?.trim()?.[0] || '?';

  return (
    <div
      className="relative shrink-0 transition-transform duration-150"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        // 外圈交錯邊點（白色蠟筆點）營造籌碼鋸齒
        background: `repeating-conic-gradient(from 0deg, ${c.base} 0deg 23deg, ${c.spot} 23deg 36deg)`,
        boxShadow: selected
          ? `0 0 0 3px ${c.dark}, 0 6px 14px rgba(0,0,0,0.18)`
          : '0 3px 8px rgba(120,80,30,0.22)',
        opacity: dragging ? 0.45 : 1,
        transform: selected ? 'scale(1.06)' : undefined,
      }}
    >
      {/* 內圈面盤 */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          inset: '14%',
          background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 70%)`,
          border: `${Math.max(2, size * 0.045)}px dashed ${c.spot}`,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)',
          color: c.text,
          fontSize: size * 0.42,
          lineHeight: 1,
        }}
      >
        <span style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.5))' }}>{center}</span>
      </div>
      {/* 光澤高光，立體硬幣感 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)' }}
      />
    </div>
  );
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
  const c = chipPaletteFor(token);

  return (
    <div
      ref={drag}
      className={`group flex-1 flex items-center gap-3 p-2 rounded-2xl cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50' : 'hover:-translate-y-0.5'
      }`}
      style={{
        background: isSelected ? c.spot : '#FFFDF8',
        border: `2px solid ${isSelected ? c.base : '#F0E6D6'}`,
        boxShadow: isSelected ? `0 4px 10px ${c.base}55` : '0 1px 3px rgba(120,80,30,0.08)',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(token); }}
    >
      <TokenChip token={token} size={44} dragging={isDragging} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate text-sm" style={{ color: '#5C4A33' }}>{token.name}</div>
        <div className="text-xs" style={{ color: c.dark }}>
          {token.type === 'resource' ? '資源' : token.type === 'card' ? '卡片' : token.type === 'dice' ? '骰子' : '自訂'}
        </div>
      </div>
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
      className="relative border-2 rounded-xl transition-colors overflow-hidden"
      style={{
        width: boardConfig.width,
        height: boardConfig.height,
        ...gridStyle,
        borderColor: isOver ? '#E09B3D' : '#EAD9BF',
      }}
    >
      {boardItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none select-none">
          {isOver ? '放開滑鼠放置元件' : '從左側拖放元件到此處'}
        </div>
      )}

      {boardItems.map((item) => {
        const token = tokens.find(t => t.id === item.id);
        if (!token) return null;
        return (
          <div
            key={item.instanceId}
            className="absolute cursor-pointer group select-none flex flex-col items-center transition-transform hover:-translate-y-0.5"
            style={{ left: item.position.x, top: item.position.y }}
            onClick={() => onItemClick(item)}
          >
            <TokenChip token={token} size={64} />
            <span
              className="mt-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
              style={{ background: '#FFFDF8', color: '#5C4A33', boxShadow: '0 1px 2px rgba(120,80,30,0.12)' }}
            >
              {token.name}
            </span>
            <button
              className="absolute -top-2 -right-2 w-5 h-5 bg-rose-400 hover:bg-rose-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center leading-none shadow"
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
      return (
        <div><label className="block text-xs font-medium mb-0.5">Token</label>{tokenSelect('tokenId')}</div>
      );
    case 'moveToken':
      return (
        <div className="space-y-2">
          <div><label className="block text-xs font-medium mb-0.5">移動的 Token</label>{tokenSelect('tokenId')}</div>
          <div>
            <label className="block text-xs font-medium mb-0.5">移動方式</label>
            <select
              className="w-full p-1.5 border rounded text-sm"
              value={p.moveMode ?? 'steps'}
              onChange={e => onChange({ ...p, moveMode: e.target.value, steps: p.steps ?? 1, absolute: undefined })}
            >
              <option value="steps">步進（前進 N 格）</option>
              <option value="absolute">跳躍（直接到第 N 格）</option>
            </select>
          </div>
          {(p.moveMode ?? 'steps') === 'steps' ? (
            <div>
              <label className="block text-xs font-medium mb-0.5">格數（可為負數倒退）</label>
              <input
                type="number"
                className="w-full p-1.5 border rounded text-sm"
                value={p.steps ?? 1}
                onChange={e => onChange({ ...p, steps: parseInt(e.target.value) || 1 })}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium mb-0.5">目標格子 index</label>
              <input
                type="number"
                min={0}
                className="w-full p-1.5 border rounded text-sm"
                value={p.absolute ?? 0}
                onChange={e => onChange({ ...p, absolute: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}
        </div>
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

// ─── Cell system helpers ──────────────────────────────────────────────────────
const CELL_TYPE_LABELS: Record<CellTemplateType, string> = {
  empty:         '空白格',
  start:         '起點',
  end:           '終點',
  bonus_score:   '加分格',
  penalty_score: '扣分格',
  bonus_token:   '獲得 Token',
  penalty_token: '失去 Token',
  draw_card:     '抽牌格',
  custom:        '自訂',
};

/** 根據格子類型與屬性自動產生 CellEvent 清單 */
function buildCellEvents(type: CellTemplateType, props: Record<string, any>): CellEvent[] {
  switch (type) {
    case 'end':
      return [{ trigger: 'onLand', action: { type: 'winGame', playerId: '{currentPlayer}' } }];
    case 'bonus_score':
      return [{ trigger: 'onLand', action: { type: 'addScore', playerId: '{currentPlayer}', amount: props.amount ?? 5 } }];
    case 'penalty_score':
      return [{ trigger: 'onLand', action: { type: 'addScore', playerId: '{currentPlayer}', amount: -(props.amount ?? 5) } }];
    case 'bonus_token':
      return [{ trigger: 'onLand', action: { type: 'gainToken', tokenId: props.tokenId, count: props.count ?? 1 } }];
    case 'penalty_token':
      return [{ trigger: 'onLand', action: { type: 'spendToken', tokenId: props.tokenId, count: props.count ?? 1 } }];
    case 'draw_card':
      return [{ trigger: 'onLand', action: { type: 'drawCard', pileId: props.pileId, tokenId: props.tokenId } }];
    default:
      return [];
  }
}

// ─── Cells Panel ──────────────────────────────────────────────────────────────
const CellsPanel: React.FC<{
  gameModule: GameModule;
  onChange: (module: GameModule) => void;
}> = ({ gameModule, onChange }) => {
  const cells: BoardCell[] = gameModule.boardConfig?.cells ?? [];
  const cfg = gameModule.boardConfig ?? { width: 800, height: 500, gridSize: 40, showGrid: true };

  const setCells = (next: BoardCell[]) =>
    onChange({ ...gameModule, boardConfig: { ...cfg, cells: next } });

  const addCell = () => {
    const newCell: BoardCell = { index: cells.length, name: `格子${cells.length}`, type: 'empty' };
    setCells([...cells, newCell]);
  };

  const removeCell = (idx: number) => {
    const next = cells.filter((_, i) => i !== idx).map((c, i) => ({ ...c, index: i }));
    setCells(next);
  };

  const updateCell = (idx: number, patch: Partial<BoardCell>) => {
    const updated = { ...cells[idx], ...patch };
    // 重新計算 events（custom 型別保留使用者設定）
    if (patch.type && patch.type !== 'custom') {
      updated.events = buildCellEvents(updated.type, updated.properties ?? {});
    } else if (patch.properties && updated.type !== 'custom') {
      updated.events = buildCellEvents(updated.type, updated.properties ?? {});
    }
    setCells(cells.map((c, i) => (i === idx ? updated : c)));
  };

  const addPreset = (preset: 'basic_loop' | 'straight_10') => {
    let newCells: BoardCell[];
    if (preset === 'basic_loop') {
      // 20 格循環：起點、終點、空白、加分、扣分混合
      newCells = [
        { index: 0,  name: '起點',   type: 'start',         properties: {} },
        { index: 1,  name: '空白',   type: 'empty',         properties: {} },
        { index: 2,  name: '+5分',   type: 'bonus_score',   properties: { amount: 5 },  events: buildCellEvents('bonus_score', { amount: 5 }) },
        { index: 3,  name: '空白',   type: 'empty',         properties: {} },
        { index: 4,  name: '-3分',   type: 'penalty_score', properties: { amount: 3 },  events: buildCellEvents('penalty_score', { amount: 3 }) },
        { index: 5,  name: '空白',   type: 'empty',         properties: {} },
        { index: 6,  name: '+10分',  type: 'bonus_score',   properties: { amount: 10 }, events: buildCellEvents('bonus_score', { amount: 10 }) },
        { index: 7,  name: '空白',   type: 'empty',         properties: {} },
        { index: 8,  name: '-5分',   type: 'penalty_score', properties: { amount: 5 },  events: buildCellEvents('penalty_score', { amount: 5 }) },
        { index: 9,  name: '空白',   type: 'empty',         properties: {} },
        { index: 10, name: '+5分',   type: 'bonus_score',   properties: { amount: 5 },  events: buildCellEvents('bonus_score', { amount: 5 }) },
        { index: 11, name: '空白',   type: 'empty',         properties: {} },
        { index: 12, name: '-3分',   type: 'penalty_score', properties: { amount: 3 },  events: buildCellEvents('penalty_score', { amount: 3 }) },
        { index: 13, name: '空白',   type: 'empty',         properties: {} },
        { index: 14, name: '+10分',  type: 'bonus_score',   properties: { amount: 10 }, events: buildCellEvents('bonus_score', { amount: 10 }) },
        { index: 15, name: '空白',   type: 'empty',         properties: {} },
        { index: 16, name: '+5分',   type: 'bonus_score',   properties: { amount: 5 },  events: buildCellEvents('bonus_score', { amount: 5 }) },
        { index: 17, name: '空白',   type: 'empty',         properties: {} },
        { index: 18, name: '-5分',   type: 'penalty_score', properties: { amount: 5 },  events: buildCellEvents('penalty_score', { amount: 5 }) },
        { index: 19, name: '終點',   type: 'end',           properties: {},              events: buildCellEvents('end', {}) },
      ];
    } else {
      // 直線 10 格
      newCells = Array.from({ length: 10 }, (_, i) => ({
        index: i,
        name: i === 0 ? '起點' : i === 9 ? '終點' : `格子${i}`,
        type: (i === 0 ? 'start' : i === 9 ? 'end' : 'empty') as CellTemplateType,
        properties: {},
        events: i === 9 ? buildCellEvents('end', {}) : [],
      }));
    }
    setCells(newCells);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">格子序列（{cells.length} 格）</span>
        <Tooltip content="新增格子到序列末端" side="left">
          <Button size="sm" onClick={addCell}><Plus className="w-3.5 h-3.5" /></Button>
        </Tooltip>
      </div>

      {cells.length === 0 && (
        <div className="text-xs text-gray-400 text-center py-3">
          點擊 + 新增格子，或使用快速範本
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        <button
          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100"
          onClick={() => addPreset('straight_10')}
        >直線10格</button>
        <button
          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100"
          onClick={() => addPreset('basic_loop')}
        >循環20格</button>
        {cells.length > 0 && (
          <button
            className="text-xs px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded hover:bg-red-100"
            onClick={() => setCells([])}
          >清空</button>
        )}
      </div>

      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
        {cells.map((cell, idx) => (
          <CellRow
            key={idx}
            cell={cell}
            idx={idx}
            tokens={gameModule.tokens}
            onUpdate={patch => updateCell(idx, patch)}
            onRemove={() => removeCell(idx)}
          />
        ))}
      </div>
    </div>
  );
};

const CellRow: React.FC<{
  cell: BoardCell;
  idx: number;
  tokens: Token[];
  onUpdate: (patch: Partial<BoardCell>) => void;
  onRemove: () => void;
}> = ({ cell, idx, tokens, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const props = cell.properties ?? {};

  const typeColor: Record<CellTemplateType, string> = {
    empty:         'bg-gray-100 text-gray-500',
    start:         'bg-green-100 text-green-700',
    end:           'bg-purple-100 text-purple-700',
    bonus_score:   'bg-blue-100 text-blue-700',
    penalty_score: 'bg-red-100 text-red-700',
    bonus_token:   'bg-yellow-100 text-yellow-700',
    penalty_token: 'bg-orange-100 text-orange-700',
    draw_card:     'bg-indigo-100 text-indigo-700',
    custom:        'bg-gray-200 text-gray-700',
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-mono shrink-0">
          {idx}
        </span>
        <span className="flex-1 text-sm truncate">{cell.name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${typeColor[cell.type]}`}>
          {CELL_TYPE_LABELS[cell.type]}
        </span>
        <button
          className="text-red-400 hover:text-red-600 shrink-0"
          onClick={e => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t bg-gray-50">
          <div className="pt-2">
            <label className="block text-xs font-medium mb-0.5">格子名稱</label>
            <input
              type="text"
              className="w-full p-1.5 border rounded text-sm"
              value={cell.name}
              onChange={e => onUpdate({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-0.5">格子類型</label>
            <select
              className="w-full p-1.5 border rounded text-sm"
              value={cell.type}
              onChange={e => onUpdate({ type: e.target.value as CellTemplateType, properties: {} })}
            >
              {(Object.keys(CELL_TYPE_LABELS) as CellTemplateType[]).map(t => (
                <option key={t} value={t}>{CELL_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          {/* 類型相關屬性 */}
          {(cell.type === 'bonus_score' || cell.type === 'penalty_score') && (
            <div>
              <label className="block text-xs font-medium mb-0.5">
                {cell.type === 'bonus_score' ? '加分值' : '扣分值'}
              </label>
              <input
                type="number" min={1}
                className="w-full p-1.5 border rounded text-sm"
                value={props.amount ?? 5}
                onChange={e => onUpdate({ properties: { ...props, amount: parseInt(e.target.value) || 1 } })}
              />
            </div>
          )}
          {(cell.type === 'bonus_token' || cell.type === 'penalty_token') && (
            <>
              <div>
                <label className="block text-xs font-medium mb-0.5">Token</label>
                <select
                  className="w-full p-1.5 border rounded text-sm"
                  value={props.tokenId ?? ''}
                  onChange={e => onUpdate({ properties: { ...props, tokenId: e.target.value } })}
                >
                  <option value="">-- 選擇 Token --</option>
                  {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-0.5">數量</label>
                <input
                  type="number" min={1}
                  className="w-full p-1.5 border rounded text-sm"
                  value={props.count ?? 1}
                  onChange={e => onUpdate({ properties: { ...props, count: parseInt(e.target.value) || 1 } })}
                />
              </div>
            </>
          )}
          {cell.type === 'draw_card' && (
            <div>
              <label className="block text-xs font-medium mb-0.5">Token（直接給予）</label>
              <select
                className="w-full p-1.5 border rounded text-sm"
                value={props.tokenId ?? ''}
                onChange={e => onUpdate({ properties: { ...props, tokenId: e.target.value } })}
              >
                <option value="">-- 選擇 Token --</option>
                {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {cell.events && cell.events.length > 0 && (
            <div className="text-xs text-gray-400 bg-white border rounded p-2">
              <span className="font-medium text-gray-500">觸發事件：</span>
              {cell.events.map((e, i) => (
                <span key={i} className="ml-1">{e.trigger} → {e.action.type}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  const [leftTab, setLeftTab] = useState<'tokens' | 'actions' | 'players' | 'variables' | 'cells'>('tokens');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [showBoardConfig, setShowBoardConfig] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(280);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    e.preventDefault();
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      setSidebarWidth(Math.min(480, Math.max(200, startWidthRef.current + delta)));
    };
    const onUp = () => { isResizingRef.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

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
    { id: 'tokens'    as const, label: '元件', icon: <Layout className="w-5 h-5" /> },
    { id: 'actions'   as const, label: '動作', icon: <Zap className="w-5 h-5" /> },
    { id: 'players'   as const, label: '玩家', icon: <Users className="w-5 h-5" /> },
    { id: 'variables' as const, label: '變數', icon: <Variable className="w-5 h-5" /> },
    { id: 'cells'     as const, label: '格子', icon: <Map className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen" style={{ background: '#FBF6EC' }}>
      {/* ── 左側面板 ── */}
      <div className="flex flex-col shrink-0" style={{ width: sidebarWidth, background: '#FFFDF8', borderRight: '1px solid #F0E6D6' }}>
        {/* tabs */}
        <div className="flex gap-1 px-1 pt-1" style={{ background: '#F6EEDF', borderBottom: '1px solid #F0E6D6' }}>
          {LEFT_TABS.map(tab => {
            const tips: Record<string, string> = {
              tokens:    '管理遊戲元件（Token）：資源、卡牌、棋子',
              actions:   '設定玩家每回合可執行的動作',
              players:   '新增/刪除玩家、設定初始資源與回合行動次數',
              variables: '自訂遊戲變數（血量、魔力等）',
              cells:     '設定格子序列（棋盤路徑）',
            };
            return (
              <Tooltip key={tab.id} content={tips[tab.id]} side="bottom">
                <button
                  className="flex-1 min-w-0 py-3 text-[13px] font-semibold transition-all flex flex-col items-center justify-center gap-1.5 rounded-t-lg"
                  style={leftTab === tab.id ? {
                    color: '#E09B3D',
                    background: '#FFFDF8',
                    borderBottom: '2px solid #F4B860',
                  } : { color: '#A1907A', background: 'transparent' }}
                  onClick={() => setLeftTab(tab.id)}
                >
                  {tab.icon}
                  <span className="leading-none">{tab.label}</span>
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

        {leftTab === 'cells' && (
          <div className="flex-1 overflow-y-auto p-3">
            <CellsPanel gameModule={gameModule} onChange={onGameModuleChange} />
          </div>
        )}
      </div>

      {/* ── Resize handle ── */}
      <div
        className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize shrink-0 transition-colors active:bg-blue-500"
        onMouseDown={handleResizeMouseDown}
        title="拖曳調整側欄寬度"
      />

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
            <button
              onClick={() => setShowBoardConfig(v => !v)}
              className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
              style={showBoardConfig
                ? { background: '#F4B860', color: '#fff', boxShadow: '0 2px 6px rgba(224,155,61,0.45)' }
                : { background: '#FFFFFF', color: '#5C4A33', border: '1.5px solid #F0E6D6' }}
            >
              <Grid className="w-4 h-4 mr-1" />
              棋盤設定
            </button>
            <button
              onClick={() => downloadGameModule(gameModule, 'game_module.json')}
              className="flex items-center px-3 py-1.5 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: '#F4B860', boxShadow: '0 2px 8px rgba(224,155,61,0.5)' }}
            >
              <Save className="w-4 h-4 mr-2" />
              匯出 JSON
            </button>
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
      {rightPanelOpen ? (
        <div className="w-72 bg-white border-l flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">屬性面板</h2>
            <button
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setRightPanelOpen(false)}
              title="收合屬性面板"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
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
                <div className="flex justify-center py-2">
                  <TokenChip token={selectedToken} size={80} />
                </div>
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
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400">選擇左側元件或動作<br />以編輯屬性</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-9 bg-white border-l flex flex-col items-center pt-3 shrink-0">
          <Tooltip content="展開屬性面板" side="left">
            <button
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-100 transition-colors"
              onClick={() => setRightPanelOpen(true)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Tooltip>
          {(isActionSelected || selectedToken) && (
            <div className="mt-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
