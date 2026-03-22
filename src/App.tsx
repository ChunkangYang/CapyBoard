import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GameEditor } from './components/GameEditor';
import { RuleEditor } from './components/RuleEditor';
import { GameBoard } from './components/GameBoard';
import { GameModule } from './engine/types';
import { loadGameModule } from './utils/jsonLoader';
import demoGame from './schema/demo_game.json';

type Tab = 'editor' | 'rules' | 'board';

const defaultGameModule: GameModule = demoGame as GameModule;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [gameModule, setGameModule] = useState<GameModule>(defaultGameModule);
  // board key 用來在切換到 board tab 時重建 RuleEngine
  const [boardKey, setBoardKey] = useState(0);

  const handleTabChange = (tab: Tab) => {
    if (tab === 'board') {
      setBoardKey(k => k + 1);
    }
    setActiveTab(tab);
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await loadGameModule(file);
      setGameModule(loaded);
      setActiveTab('editor');
    } catch {
      alert('無法載入遊戲模組，請確認檔案格式正確。');
    }
    e.target.value = '';
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'editor', label: '遊戲編輯器' },
    { id: 'rules', label: '規則編輯器' },
    { id: 'board', label: '遊戲執行' },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 頂部導覽列 */}
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">桌遊大師</h1>

            <nav className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <label className="cursor-pointer text-sm text-gray-500 hover:text-gray-800 border rounded px-3 py-1.5 transition-colors hover:bg-gray-50">
              載入模組
              <input type="file" accept=".json" className="hidden" onChange={handleFileLoad} />
            </label>
          </div>
        </header>

        {/* 主內容區 */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {activeTab === 'editor' && (
            <GameEditor
              gameModule={gameModule}
              onGameModuleChange={setGameModule}
            />
          )}
          {activeTab === 'rules' && (
            <RuleEditor
              gameModule={gameModule}
              onGameModuleChange={setGameModule}
            />
          )}
          {activeTab === 'board' && (
            <GameBoard key={boardKey} gameModule={gameModule} />
          )}
        </main>
      </div>
    </DndProvider>
  );
};

export default App;
