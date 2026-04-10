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
import demoGame from './schema/demo_game.json';
import exampleResource from './schema/example_resource.json';
import exampleCards from './schema/example_cards.json';
import exampleDice from './schema/example_dice.json';
import { Undo2, Redo2, Download, ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';

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

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState(() => getAllModules());
  const [boardKey, setBoardKey] = useState(0);

  // undo/redo 歷史
  const [history, setHistory] = useState<GameModule[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const currentModule = historyIndex >= 0 ? history[historyIndex] : null;

  // 第一次載入：若 localStorage 為空，預置範例遊戲
  useEffect(() => {
    if (!hasAnyModules()) {
      const defaults: Array<[string, GameModule]> = [
        [generateModuleId(), demoGame as GameModule],
        [generateModuleId(), exampleResource as GameModule],
        [generateModuleId(), exampleCards as GameModule],
        [generateModuleId(), exampleDice as GameModule],
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
  };

  // ── 模組變更（帶 undo/redo）──
  const handleModuleChange = useCallback((updated: GameModule) => {
    if (isUndoRedoRef.current) return;
    setHistory(prev => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(updated);
      // 限制歷史 50 步
      if (newHist.length > 50) newHist.shift();
      return newHist;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));

    // 自動存回 localStorage
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

  // ── 首頁 ──
  if (view === 'home') {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">桌遊大師</h1>
            </div>
          </header>
          <main>
            <HomePage
              modules={modules}
              onNew={handleNew}
              onImport={handleImport}
              onEdit={id => enterEdit(id)}
              onPlay={id => enterPlay(id)}
              onCopy={id => { copyModule(id); refreshModules(); }}
              onDelete={id => { deleteModule(id); refreshModules(); }}
            />
          </main>
        </div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="復原 (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="重做 (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
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

            {/* 匯出 JSON */}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1 text-gray-600"
              onClick={() => downloadGameModule(currentModule, `${currentModule.gameName.zh}.json`)}
              title="匯出 JSON"
            >
              <Download className="w-4 h-4" /> 匯出
            </Button>
          </div>
        </header>

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
      </div>
    </DndProvider>
  );
};

export default App;
