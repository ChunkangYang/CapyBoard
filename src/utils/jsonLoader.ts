import { GameModule } from '../engine/types';

export const loadGameModule = async (file: File): Promise<GameModule> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const gameModule = JSON.parse(content) as GameModule;
        resolve(gameModule);
      } catch (error) {
        reject(new Error('無法解析遊戲模組檔案'));
      }
    };
    reader.onerror = () => reject(new Error('無法讀取檔案'));
    reader.readAsText(file);
  });
};

export const exportGameModule = (gameModule: GameModule): string => {
  return JSON.stringify(gameModule, null, 2);
};

export const downloadGameModule = (gameModule: GameModule, filename: string): void => {
  const content = exportGameModule(gameModule);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateGameModule = (gameModule: any): boolean => {
  // 基本驗證
  if (!gameModule.gameName?.zh || !gameModule.gameName?.en) {
    return false;
  }
  if (!Array.isArray(gameModule.players) || gameModule.players.length === 0) {
    return false;
  }
  if (!Array.isArray(gameModule.tokens)) {
    return false;
  }
  if (!Array.isArray(gameModule.actions)) {
    return false;
  }
  if (!Array.isArray(gameModule.rules)) {
    return false;
  }
  if (!gameModule.turn?.currentPlayerId || !gameModule.turn?.actionsPerTurn) {
    return false;
  }
  return true;
};


