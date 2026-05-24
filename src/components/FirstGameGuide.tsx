import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface GuideStep {
  title: string;
  tab?: string;
  instructions: string[];
  note?: string;
  done?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: '目標：製作一個「擲骰積分」遊戲',
    instructions: [
      '規則很簡單：玩家每回合擲一次骰子，骰出的點數加到分數，',
      '第一個達到 20 分的玩家獲勝。',
      '',
      '整個流程只需要：',
      '1. 新增一個「分數」Token',
      '2. 新增一個「擲骰子」動作',
      '3. 設定一條「分數 ≥ 20 獲勝」規則',
    ],
    note: '先點擊首頁「新建遊戲」，然後回來跟著步驟操作。',
  },
  {
    title: '步驟一：新增 Token（分數）',
    tab: '遊戲編輯器',
    instructions: [
      '1. 進入「遊戲編輯器」頁籤',
      '2. 在左側「Token 管理」區塊，點擊「＋ 新增 Token」',
      '3. 名稱填寫：分數',
      '4. 類型選擇：counter（計數）',
      '5. 初始數量設為：0',
    ],
    done: '你應該在 Token 列表看到「分數」已新增',
  },
  {
    title: '步驟二：新增動作（擲骰子）',
    tab: '遊戲編輯器',
    instructions: [
      '1. 在「動作」區塊點擊「＋ 新增動作」',
      '2. 動作名稱：擲骰子',
      '3. 動作類型：選擇「擲骰子」',
      '4. 骰子面數保持預設 6',
    ],
    note: '擲骰子動作會自動將結果加到玩家分數，稍後規則中會用到。',
    done: '動作列表應出現「擲骰子」',
  },
  {
    title: '步驟三：設定勝利規則',
    tab: '規則編輯器',
    instructions: [
      '1. 切換到「規則編輯器」頁籤',
      '2. 點擊「＋ 新增規則」',
      '3. 觸發時機：選「動作結束後」',
      '4. 在「條件」區塊，新增條件：',
      '   - 類型：玩家分數',
      '   - 比較：≥',
      '   - 數值：20',
      '5. 在「觸發動作」區塊，新增：',
      '   - 類型：遊戲獲勝',
      '   - 玩家：{currentPlayer}',
    ],
    done: '規則列表應顯示一條規則，且驗證警告中「無勝利條件」應消失',
  },
  {
    title: '步驟四：測試遊玩！',
    tab: '快速測試 / 遊戲執行',
    instructions: [
      '1. 點擊頂部工具列的「⚡ 快速測試」',
      '2. 在右側面板中，點選玩家的「擲骰子」動作',
      '3. 觀察分數累積，直到達到 20 分',
      '4. 應出現「🎉 遊戲結束！玩家X 獲勝」',
    ],
    note: '如果規則沒有觸發，請確認規則中的 Token 是「分數」且條件數值正確。',
    done: '恭喜！你完成了第一個桌遊的設計 🎉',
  },
];

interface FirstGameGuideProps {
  onClose: () => void;
}

export const FirstGameGuide: React.FC<FirstGameGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const current = GUIDE_STEPS[step];
  const isLast = step === GUIDE_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* 進度條 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((step + 1) / GUIDE_STEPS.length) * 100}%` }}
          />
        </div>

        {/* 標題列 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">
              如何設計你的第一個遊戲 · {step + 1}/{GUIDE_STEPS.length}
            </div>
            <h2 className="text-base font-bold text-gray-800">{current.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 ml-4 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 操作頁籤提示 */}
        {current.tab && (
          <div className="mx-5 mb-3 flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded px-3 py-1.5">
            <span>📂 操作位置：</span>
            <span className="font-semibold">{current.tab}</span>
          </div>
        )}

        {/* 步驟說明 */}
        <div className="px-5 pb-3 max-h-72 overflow-y-auto">
          <ul className="space-y-1">
            {current.instructions.map((line, i) => (
              line === '' ? (
                <li key={i} className="h-2" />
              ) : (
                <li key={i} className="text-sm text-gray-700 leading-relaxed">
                  {line}
                </li>
              )
            ))}
          </ul>

          {current.note && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
              ⚠️ {current.note}
            </div>
          )}

          {current.done && (
            <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>完成確認：{current.done}</span>
            </div>
          )}
        </div>

        {/* 操作列 */}
        <div className="flex items-center gap-2 px-5 py-4 border-t bg-gray-50">
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
          {isLast ? (
            <Button size="sm" onClick={onClose} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              完成教學 <CheckCircle2 className="w-4 h-4" />
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
