import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Layers, Zap, BookOpen, Play, Trophy, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

const STORAGE_KEY = 'ib_onboarding_done';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    icon: <Layers className="w-10 h-10 text-blue-500" />,
    title: '歡迎使用桌遊大師！',
    description:
      '桌遊大師讓你用視覺化介面設計自己的桌遊，不需要寫程式。' +
      '你可以定義資源（Token）、玩家動作和勝利規則，然後馬上遊玩測試。',
    tip: '整個教學大約 2 分鐘，也可以隨時跳過。',
  },
  {
    icon: <BookOpen className="w-10 h-10 text-emerald-500" />,
    title: '步驟一：建立遊戲',
    description:
      '點擊首頁的「新建遊戲」按鈕，或選擇一個內建範例遊戲來開始編輯。' +
      '每個遊戲模組都可以獨立儲存、複製和匯出為 JSON 檔案。',
    tip: '範例遊戲「骰子冒險」是最簡單的入門範本。',
  },
  {
    icon: <Layers className="w-10 h-10 text-yellow-500" />,
    title: '步驟二：設定 Token（資源）',
    description:
      '在「遊戲編輯器」頁籤中，你可以新增 Token 作為遊戲資源（金幣、血量、卡牌等）。' +
      'Token 有三種類型：counter（數量）、card（卡牌）、piece（棋子）。',
    tip: 'Token 新增後，可以直接拖拉到棋盤佈局區擺放。',
  },
  {
    icon: <Zap className="w-10 h-10 text-orange-500" />,
    title: '步驟三：設計玩家動作',
    description:
      '在「遊戲編輯器」的「動作」區塊新增玩家每回合可以執行的動作。' +
      '內建動作包含：獲得 Token、消耗 Token、擲骰子、抽牌、移動棋子等。',
    tip: '每回合可執行的動作次數可以在「玩家設定」中調整。',
  },
  {
    icon: <BookOpen className="w-10 h-10 text-purple-500" />,
    title: '步驟四：設定規則與勝利條件',
    description:
      '切換到「規則編輯器」頁籤，設定遊戲觸發規則。' +
      '最常用的是：當玩家分數 ≥ 10 時觸發「遊戲獲勝」。' +
      '規則由「觸發時機 → 條件 → 動作」三部分組成。',
    tip: '一定要設定至少一個勝利條件，否則遊戲無法結束！',
  },
  {
    icon: <Play className="w-10 h-10 text-blue-500" />,
    title: '步驟五：快速測試',
    description:
      '點擊頂部工具列的「⚡ 快速測試」按鈕，不用切換頁籤就能在右側面板試玩。' +
      '或直接進入「遊戲執行」頁籤開始完整遊玩。',
    tip: '測試時可以使用「倒退」按鈕回到前一步，最多可回退 20 步。',
  },
  {
    icon: <Trophy className="w-10 h-10 text-yellow-500" />,
    title: '你已準備好了！',
    description:
      '以上就是桌遊大師的核心流程。嘗試從「骰子冒險」範例遊戲開始，' +
      '修改規則或新增動作，感受看看設計的樂趣吧！',
    tip: '有任何問題，點擊首頁右上角的「？ 使用說明」重新開啟教學。',
  },
];

interface OnboardingTourProps {
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 進度條 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* 內容 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-gray-400 font-medium">
              {step + 1} / {STEPS.length}
            </span>
            <button onClick={finish} className="text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="p-3 bg-gray-50 rounded-full">
              {current.icon}
            </div>
            <h2 className="text-lg font-bold text-gray-800">{current.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{current.description}</p>
            {current.tip && (
              <div className="w-full bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-xs text-blue-700 text-left">
                💡 {current.tip}
              </div>
            )}
          </div>
        </div>

        {/* 操作列 */}
        <div className="flex items-center gap-2 px-6 pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> 上一步
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            className="text-gray-400 text-xs"
          >
            跳過
          </Button>
          {isLast ? (
            <Button size="sm" onClick={finish} className="gap-1">
              開始使用 <Trophy className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
              下一步 <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const shouldShowOnboarding = () => !localStorage.getItem(STORAGE_KEY);
export const resetOnboarding = () => localStorage.removeItem(STORAGE_KEY);
