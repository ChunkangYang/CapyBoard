import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameEditor } from './components/GameEditor';
import { RuleEditor } from './components/RuleEditor';
import { GameBoard } from './components/GameBoard';
import { HomePage } from './components/HomePage';
import { GameModule } from './engine/types';
import { downloadGameModule } from './utils/jsonLoader';
import {
  getAllModules,
  saveModule,
  deleteModule,
  copyModule,
  generateModuleId,
  hasAnyModules,
} from './utils/moduleStorage';
import { validateGameModule } from './utils/gameValidator';
import demoGame from './schema/demo_game.json';
import exampleResource from './schema/example_resource.json';
import exampleCards from './schema/example_cards.json';
import exampleDice from './schema/example_dice.json';
import { Undo2, Redo2, Download, ArrowLeft, Zap, X, AlertTriangle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './components/ui/button';
import { Tooltip } from './components/ui/tooltip';
import { OnboardingTour, shouldShowOnboarding } from './components/OnboardingTour';
import { FirstGameGuide } from './components/FirstGameGuide';

type Tab = 'editor' | 'rules' | 'board';
type View = 'home' | 'edit' | 'play';

const EMPTY_MODULE: GameModule = {
  gameName: { zh: '新遊戲', en: 'New Game' },
  players: [
    { id: 'player1', name: '玩家1', tokens: [], score: 0 },
    { id: 'player2', name: '玩家2', tokens: [], score: 0 },
  ],
  tokens: [],
  actions: [],
  rules: [],
  turn: { currentPlayerId: 'player1', actionsPerTurn: 1 },
  board: { items: [] },
  boardConfig: { width: 800, height: 500, gridSize: 40, showGrid: true },
};

// ─── Validation Banner ─────────────────────────────────────────────────────────
const ValidationBanner: React.FC<{ module: GameModule }> = ({ module }) => {
  const issues = validateGameModule(module);
  const [open, setOpen] = useState(false);

  if (issues.length === 0) return null;

  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  const bannerColor = errors.length > 0
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-amber-50 border-amber-200 text-amber-700';

  return (
    <div className={`border-b px-4 py-1.5 text-xs ${bannerColor}`}>
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setOpen(v => !v)}
      >
        {errors.length > 0
          ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        }
        <span>
          遊戲驗證：
          {errors.length > 0 && <span className="font-semibold">{errors.length} 個錯誤</span>}
          {errors.length > 0 && warnings.length > 0 && <span className="mx-1">·</span>}
          {warnings.length > 0 && <span>{warnings.length} 個警告</span>}
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
      </div>
      {open && (
        <ul className="mt-1.5 space-y-0.5 ml-5 list-disc">
          {issues.map((issue, i) => (
            <li key={i} className={issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}>
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Quick Test Drawer ────────────────────────────────────────────────────────
const QuickTestDrawer: React.FC<{
  module: GameModule;
  onClose: () => void;
  boardKey: number;
}> = ({ module, onClose, boardKey }) => (
  <div className="fixed inset-0 z-40 flex justify-end">
    {/* 半透明背景 */}
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    {/* 面板本體 */}
    <div className="relative bg-white shadow-2xl w-[720px] max-w-[90vw] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-700 text-sm">快速測試</span>
          <span className="text-xs text-gray-400">（基於目前儲存的遊戲設定）</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DndProvider backend={HTML5Backend}>
          <GameBoard key={boardKey} gameModule={module} />
        </DndProvider>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState(() => getAllModules());
  const [boardKey, setBoardKey] = useState(0);
  const [quickTestOpen, setQuickTestOpen] = useState(false);
  const [quickTestKey, setQuickTestKey] = useState(0);
  const [showTour, setShowTour] = useState(() => shouldShowOnboarding());
  const [showGuide, setShowGuide] = useState(false);

  // undo/redo 歷史
  const [history, setHistory] = useState<GameModule[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const currentModule = historyIndex >= 0 ? history[historyIndex] : null;

  // 第一次載入：若 localStorage 為空，預置範例遊戲
  useEffect(() => {
    if (!hasAnyModules()) {
      const base = Date.now();
      const defaults: Array<[string, GameModule]> = [
        [`module_${base}`, demoGame as GameModule],
        [`module_${base + 1}`, exampleResource as GameModule],
        [`module_${base + 2}`, exampleCards as GameModule],
        [`module_${base + 3}`, exampleDice as GameModule],
      ];
      defaults.forEach(([id, mod]) => saveModule(id, mod));
      setModules(getAllModules());
    }
  }, []); // eslint-disable-line

  const refreshModules = () => setModules(getAllModules());

  // ── 進入編輯模式 ──
  const enterEdit = (id: string) => {
    const mod = modules.find(m => m.id === id)?.module;
    if (!mod) return;
    const initial = JSON.parse(JSON.stringify(mod)) as GameModule;
    setHistory([initial]);
    setHistoryIndex(0);
    setActiveModuleId(id);
    setActiveTab('editor');
    setView('edit');
  };

  // ── 進入遊玩模式 ──
  const enterPlay = (id: string) => {
    const mod = modules.find(m => m.id === id)?.module;
    if (!mod) return;
    const initial = JSON.parse(JSON.stringify(mod)) as GameModule;
    setHistory([initial]);
    setHistoryIndex(0);
    setActiveModuleId(id);
    setActiveTab('board');
    setBoardKey(k => k + 1);
    setView('play');
  };

  // ── 新建遊戲 ──
  const handleNew = () => {
    const id = generateModuleId();
    const newMod = JSON.parse(JSON.stringify(EMPTY_MODULE)) as GameModule;
    saveModule(id, newMod);
    refreshModules();
    enterEdit(id);
  };

  // ── 從模板建立 ──
  const handleNewFromTemplate = (template: GameModule) => {
    const id = generateModuleId();
    const copy = JSON.parse(JSON.stringify(template)) as GameModule;
    copy.gameName = { zh: `${copy.gameName.zh}（副本）`, en: `${copy.gameName.en} (Copy)` };
    saveModule(id, copy);
    refreshModules();
    enterEdit(id);
  };

  // ── 匯入 JSON ──
  const handleImport = (mod: GameModule) => {
    const id = generateModuleId();
    saveModule(id, mod);
    refreshModules();
    enterEdit(id);
  };

  // ── 返回首頁 ──
  const handleBack = () => {
    if (activeModuleId && currentModule) {
      saveModule(activeModuleId, currentModule);
      refreshModules();
    }
    setView('home');
    setHistory([]);
    setHistoryIndex(-1);
    setActiveModuleId(null);
    setQuickTestOpen(false);
  };

  // ── 模組變更（帶 undo/redo）──
  const handleModuleChange = useCallback((updated: GameModule) => {
    if (isUndoRedoRef.current) return;
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(updated);
      if (newHist.length > 50) newHist.shift();
      return newHist;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));

    if (activeModuleId) {
      saveModule(activeModuleId, updated);
    }
  }, [historyIndex, activeModuleId]); // eslint-disable-line

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    isUndoRedoRef.current = true;
    setHistoryIndex(prev => prev - 1);
    if (activeModuleId && history[historyIndex - 1]) {
      saveModule(activeModuleId, history[historyIndex - 1]);
    }
    setTimeout(() => { isUndoRedoRef.current = false; }, 0);
  }, [historyIndex, history, activeModuleId]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedoRef.current = true;
    setHistoryIndex(prev => prev + 1);
    if (activeModuleId && history[historyIndex + 1]) {
      saveModule(activeModuleId, history[historyIndex + 1]);
    }
    setTimeout(() => { isUndoRedoRef.current = false; }, 0);
  }, [historyIndex, history, activeModuleId]);

  // 鍵盤快捷鍵 Ctrl+Z / Ctrl+Y
  useEffect(() => {
    if (view !== 'edit') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault(); handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault(); handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, handleUndo, handleRedo]);

  const handleTabChange = (tab: Tab) => {
    if (tab === 'board') setBoardKey(k => k + 1);
    setActiveTab(tab);
  };

  const handleOpenQuickTest = () => {
    setQuickTestKey(k => k + 1); // 每次開啟都重置 GameBoard
    setQuickTestOpen(true);
  };

  // ── 首頁 ──
  if (view === 'home') {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">桌遊大師</h1>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 text-xs gap-1"
                  onClick={() => setShowGuide(true)}
                  title="如何設計你的第一個遊戲"
                >
                  📖 新手教學
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 text-xs gap-1"
                  onClick={() => setShowTour(true)}
                  title="重新開啟功能介紹"
                >
                  ？ 使用說明
                </Button>
              </div>
            </div>
          </header>
          <main>
            <HomePage
              modules={modules}
              onNew={handleNew}
              onNewFromTemplate={handleNewFromTemplate}
              onImport={handleImport}
              onEdit={id => enterEdit(id)}
              onPlay={id => enterPlay(id)}
              onCopy={id => { copyModule(id); refreshModules(); }}
              onDelete={id => { deleteModule(id); refreshModules(); }}
            />
          </main>
        </div>
        {showTour && <OnboardingTour onClose={() => setShowTour(false)} />}
        {showGuide && <FirstGameGuide onClose={() => setShowGuide(false)} />}
      </DndProvider>
    );
  }

  // ── 編輯 / 遊玩模式 ──
  if (!currentModule) return null;

  const EDIT_TABS: { id: Tab; label: string }[] = [
    { id: 'editor', label: '遊戲編輯器' },
    { id: 'rules',  label: '規則編輯器' },
    { id: 'board',  label: '遊戲執行' },
  ];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 頂部導覽列 */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-2 flex items-center gap-3">
            {/* 返回 */}
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 text-gray-600">
              <ArrowLeft className="w-4 h-4" /> 首頁
            </Button>

            <div className="h-5 border-l border-gray-200" />

            {/* Undo / Redo */}
            {view === 'edit' && (
              <>
                <Tooltip content="復原 (Ctrl+Z)" side="bottom">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="重做 (Ctrl+Y)" side="bottom">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRedo}
                    disabled={!canRedo}
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <div className="h-5 border-l border-gray-200" />
              </>
            )}

            {/* Tab 切換 */}
            <nav className="flex gap-1">
              {EDIT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* 快速測試（編輯模式限定） */}
            {view === 'edit' && activeTab !== 'board' && (
              <Tooltip content="不切換頁籤，在右側面板快速試玩" side="bottom">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={handleOpenQuickTest}
                >
                  <Zap className="w-4 h-4" /> 快速測試
                </Button>
              </Tooltip>
            )}

            {/* 匯出 JSON */}
            <Tooltip content="將遊戲模組匯出為 JSON 檔案" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1 text-gray-600"
                onClick={() => downloadGameModule(currentModule, `${currentModule.gameName.zh}.json`)}
              >
                <Download className="w-4 h-4" /> 匯出
              </Button>
            </Tooltip>
          </div>
        </header>

        {/* 驗證警告列（編輯模式限定） */}
        {view === 'edit' && <ValidationBanner module={currentModule} />}

        {/* 主內容區 */}
        <main className={`flex-1 ${activeTab !== 'editor' ? 'container mx-auto px-4 py-6' : ''}`}>
          {activeTab === 'editor' && (
            <GameEditor
              gameModule={currentModule}
              onGameModuleChange={handleModuleChange}
            />
          )}
          {activeTab === 'rules' && (
            <RuleEditor
              gameModule={currentModule}
              onGameModuleChange={handleModuleChange}
            />
          )}
          {activeTab === 'board' && (
            <GameBoard key={boardKey} gameModule={currentModule} />
          )}
        </main>

        {/* 快速測試 Drawer */}
        {quickTestOpen && currentModule && (
          <QuickTestDrawer
            module={currentModule}
            onClose={() => setQuickTestOpen(false)}
            boardKey={quickTestKey}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default App;
