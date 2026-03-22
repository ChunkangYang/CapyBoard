import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Token, GameModule } from '../engine/types';
import { createDragItem, createBoardItem, calculateDropPosition, snapToGrid } from '../utils/dragDropHelpers';
import { downloadGameModule } from '../utils/jsonLoader';
import { Plus, Trash2, Save } from 'lucide-react';

interface GameEditorProps {
  gameModule: GameModule;
  onGameModuleChange: (module: GameModule) => void;
}

const DraggableToken: React.FC<{ 
  token: Token; 
  onSelect: (token: Token) => void;
  isSelected: boolean;
}> = ({ token, onSelect, isSelected }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'token',
    item: () => createDragItem('token', token.id, token.name),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(token);
  };

  return (
    <div
      ref={drag}
      className={`p-3 border rounded cursor-move transition-colors ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected 
          ? 'bg-blue-100 border-blue-300' 
          : 'bg-yellow-100 hover:bg-yellow-200 border-gray-300'
      }`}
      onClick={handleClick}
    >
      <div className="text-sm font-medium">{token.name}</div>
      <div className="text-xs text-gray-600">{token.type}</div>
    </div>
  );
};

const DroppableWorkspace: React.FC<{
  onDrop: (item: any, position: { x: number; y: number }) => void;
  boardItems: any[];
  onItemClick: (item: any) => void;
}> = ({ onDrop, boardItems, onItemClick }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ['token', 'card', 'dice'],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const workspaceRect = (drop as any).current?.getBoundingClientRect();
        if (workspaceRect) {
          const position = calculateDropPosition(offset.x, offset.y, workspaceRect);
          const snappedPosition = snapToGrid(position);
          console.log('拖曳項目:', item);
          console.log('放置位置:', snappedPosition);
          onDrop(item, snappedPosition);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`relative w-full h-96 border-2 border-dashed rounded-lg p-4 ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      style={{ minHeight: '400px' }}
    >
      <div className="text-center text-gray-500 mt-32">
        {isOver ? '放開滑鼠放置元件' : '拖放元件到此處建立遊戲場景'}
      </div>
      
      {/* 顯示已放置的元件 */}
      {boardItems.map((item, index) => (
        <div
          key={index}
          className="absolute cursor-pointer p-2 bg-white border rounded shadow-sm hover:shadow-md transition-shadow"
          style={{
            left: item.position.x,
            top: item.position.y,
            minWidth: '60px',
            minHeight: '40px'
          }}
          onClick={() => onItemClick(item)}
        >
          <div className="text-sm font-medium text-center">{item.name}</div>
        </div>
      ))}
    </div>
  );
};

export const GameEditor: React.FC<GameEditorProps> = ({ gameModule, onGameModuleChange }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState<any>(null);
  const [boardItems, setBoardItems] = useState<any[]>([]);

  const handleDrop = (item: any, position: { x: number; y: number }) => {
    console.log('handleDrop 被調用:', { item, position });
    const newItem = createBoardItem(item, position);
    console.log('創建的 boardItem:', newItem);
    setBoardItems(prev => {
      const newItems = [...prev, newItem];
      console.log('更新後的 boardItems:', newItems);
      return newItems;
    });
  };

  const handleItemClick = (item: any) => {
    setSelectedBoardItem(item);
    // 找到對應的 token 來顯示在屬性面板
    const token = gameModule.tokens.find(t => t.id === item.id);
    if (token) {
      setSelectedToken(token);
    }
  };

  const handleSave = () => {
    downloadGameModule(gameModule, 'game_module.json');
  };

  const addToken = () => {
    const newToken: Token = {
      id: `token_${Date.now()}`,
      name: '新元件',
      type: 'resource',
    };
    
    const updatedModule = {
      ...gameModule,
      tokens: [...gameModule.tokens, newToken],
    };
    onGameModuleChange(updatedModule);
    console.log('新元件已添加:', newToken);
  };

  const removeToken = (tokenId: string) => {
    const updatedModule = {
      ...gameModule,
      tokens: gameModule.tokens.filter(t => t.id !== tokenId),
    };
    onGameModuleChange(updatedModule);
    // 同時移除工作區中的相關元件
    setBoardItems(boardItems.filter(item => item.id !== tokenId));
  };

  return (
    <div className="flex h-screen bg-gray-50">
        {/* 左側元件面板 */}
        <div className="w-64 bg-white border-r p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">元件面板</h2>
            <Button onClick={addToken} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {gameModule.tokens.map((token) => (
              <div key={token.id} className="flex items-center gap-2">
                <DraggableToken 
                  token={token} 
                  onSelect={setSelectedToken}
                  isSelected={selectedToken?.id === token.id}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeToken(token.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 中央工作區 */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">桌遊大師 - 遊戲編輯器</h1>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              儲存模組
            </Button>
          </div>
          
          <DroppableWorkspace 
            onDrop={handleDrop} 
            boardItems={boardItems}
            onItemClick={handleItemClick}
          />
          
          {/* 測試按鈕 */}
          <div className="mt-4">
            <Button 
              onClick={() => {
                console.log('測試按鈕點擊');
                const testItem = createDragItem('token', 'test', '測試元件');
                const testPosition = { x: 100, y: 100 };
                handleDrop(testItem, testPosition);
              }}
              variant="outline"
            >
              測試添加元件
            </Button>
          </div>
          
          {/* 元件統計 */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">工作區統計</h3>
            <div className="text-sm text-gray-600">
              已放置元件: {boardItems.length} 個
            </div>
          </div>
        </div>

        {/* 右側屬性面板 */}
        <div className="w-64 bg-white border-l p-4">
          <h2 className="text-lg font-semibold mb-4">屬性面板</h2>
          {selectedToken ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名稱</label>
                <input
                  type="text"
                  value={selectedToken.name}
                  onChange={(e) => {
                    const updatedToken = { ...selectedToken, name: e.target.value };
                    const updatedModule = {
                      ...gameModule,
                      tokens: gameModule.tokens.map(t => 
                        t.id === selectedToken.id ? updatedToken : t
                      ),
                    };
                    onGameModuleChange(updatedModule);
                    setSelectedToken(updatedToken);
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">類型</label>
                <select
                  value={selectedToken.type}
                  onChange={(e) => {
                    const updatedToken = { ...selectedToken, type: e.target.value as any };
                    const updatedModule = {
                      ...gameModule,
                      tokens: gameModule.tokens.map(t => 
                        t.id === selectedToken.id ? updatedToken : t
                      ),
                    };
                    onGameModuleChange(updatedModule);
                    setSelectedToken(updatedToken);
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="resource">資源</option>
                  <option value="card">卡片</option>
                  <option value="dice">骰子</option>
                  <option value="custom">自訂</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">選擇元件以編輯屬性</div>
          )}
                 </div>
       </div>
   );
 };


