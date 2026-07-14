import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ModuleMeta } from '../utils/moduleStorage';
import { GameModule } from '../engine/types';
import { Plus, Upload, Edit, Play, Copy, Trash2, Users, FileText, X, LayoutTemplate } from 'lucide-react';
import { Capybara } from './Capybara';

interface HomePageProps {
  modules: Array<{ id: string; meta: ModuleMeta; module: GameModule }>;
  onNew: () => void;
  onNewFromTemplate: (template: GameModule) => void;
  onImport: (module: GameModule) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
}

// ─── New Game Modal ───────────────────────────────────────────────────────────
const NewGameModal: React.FC<{
  templates: Array<{ id: string; meta: ModuleMeta; module: GameModule }>;
  onBlank: () => void;
  onTemplate: (module: GameModule) => void;
  onClose: () => void;
}> = ({ templates, onBlank, onTemplate, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
    <div
      className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <span className="font-semibold text-gray-800">建立新遊戲</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4">
        {/* 空白遊戲 */}
        <button
          className="w-full text-left p-4 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          onClick={onBlank}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-medium text-gray-800 group-hover:text-blue-700">空白遊戲</div>
              <div className="text-xs text-gray-400 mt-0.5">從零開始設計你的桌遊</div>
            </div>
          </div>
        </button>

        {templates.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex-1 border-t" />
              <span>或從範本開始</span>
              <div className="flex-1 border-t" />
            </div>
            <div className="space-y-2">
              {templates.map(({ id, meta, module }) => (
                <button
                  key={id}
                  className="w-full text-left p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  onClick={() => onTemplate(module)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                      {module.theme?.primaryColor
                        ? <span style={{ color: module.theme.primaryColor }}>🎲</span>
                        : '🎲'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate group-hover:text-blue-700">{meta.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {meta.playerCount} 人 · {module.rules.length} 規則 · {module.actions.length} 動作
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {module.tokens.slice(0, 3).map(t => (
                        <span key={t.id} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                          {t.icon}{t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({
  modules,
  onNew,
  onNewFromTemplate,
  onImport,
  onEdit,
  onPlay,
  onCopy,
  onDelete,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as GameModule;
      onImport(parsed);
    } catch {
      alert('無法載入遊戲模組，請確認檔案格式正確。');
    }
    e.target.value = '';
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 標題區 */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-2">
          <span style={{ animation: 'capy-float 4s ease-in-out infinite', display: 'inline-block' }}>
            <Capybara size={72} mood="happy" />
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mb-1" style={{ color: '#5C4A33' }}>CapyBoard</h1>
        <p style={{ color: '#A1907A' }}>水豚桌遊工坊 — 設計你的桌遊，分享你的創意</p>
      </div>

      {/* 操作列 */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> 新建遊戲
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" /> 匯入 JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <span className="text-sm text-gray-400 ml-auto">{modules.length} 個遊戲</span>
      </div>

      {/* 遊戲列表 */}
      {modules.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-1">尚無遊戲</p>
          <p className="text-sm">點擊「新建遊戲」開始設計你的第一個桌遊</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ id, meta, module }) => (
            <Card
              key={id}
              className="hover:shadow-md transition-shadow group relative"
            >
              {/* 確認刪除覆蓋層 */}
              {confirmDeleteId === id && (
                <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center gap-3 z-10">
                  <p className="text-sm font-medium text-gray-700">確定刪除「{meta.name}」？</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { onDelete(id); setConfirmDeleteId(null); }}
                    >
                      確定刪除
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate">{meta.name}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {meta.playerCount} 人
                  </span>
                  <span>{module.rules.length} 規則</span>
                  <span>{module.actions.length} 動作</span>
                </div>
              </CardHeader>

              <CardContent className="pt-1 pb-3">
                <div className="text-xs text-gray-400 mb-3">
                  更新：{formatDate(meta.updatedAt)}
                </div>

                {/* Token 預覽 */}
                <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
                  {module.tokens.slice(0, 4).map(t => (
                    <span key={t.id} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      {t.name}
                    </span>
                  ))}
                  {module.tokens.length > 4 && (
                    <span className="text-xs text-gray-400">+{module.tokens.length - 4}</span>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-1.5">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => onPlay(id)}>
                    <Play className="w-3.5 h-3.5" /> 遊玩
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => onEdit(id)}>
                    <Edit className="w-3.5 h-3.5" /> 編輯
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onCopy(id)} title="複製">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => setConfirmDeleteId(id)}
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建遊戲 Modal */}
      {showNewModal && (
        <NewGameModal
          templates={modules}
          onBlank={() => { onNew(); setShowNewModal(false); }}
          onTemplate={module => { onNewFromTemplate(module); setShowNewModal(false); }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
};
