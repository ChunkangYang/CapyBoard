import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ModuleMeta } from '../utils/moduleStorage';
import { GameModule } from '../engine/types';
import { Plus, Upload, Edit, Play, Copy, Trash2, Users, FileText } from 'lucide-react';

interface HomePageProps {
  modules: Array<{ id: string; meta: ModuleMeta; module: GameModule }>;
  onNew: () => void;
  onImport: (module: GameModule) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  modules,
  onNew,
  onImport,
  onEdit,
  onPlay,
  onCopy,
  onDelete,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">桌遊大師</h1>
        <p className="text-gray-500">設計你的桌遊，分享你的創意</p>
      </div>

      {/* 操作列 */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={onNew} className="gap-2">
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
    </div>
  );
};
