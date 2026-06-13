import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from './ui/tooltip';
import { helpContent } from './helpContent';

interface HelpHintProps {
  hkey: string;                                  // 對應 helpContent 的 key
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/** 設定項目旁的說明圖示：hover 顯示暖色說明 popup。
 *  說明內容集中在 helpContent，這裡只負責呈現。 */
export const HelpHint: React.FC<HelpHintProps> = ({ hkey, side = 'top' }) => {
  const entry = helpContent[hkey];
  if (!entry) return null;

  return (
    <Tooltip
      wide
      side={side}
      content={
        <span>
          <span className="block font-semibold mb-0.5" style={{ color: '#E09B3D' }}>
            {entry.title}
          </span>
          <span className="block">{entry.body}</span>
        </span>
      }
    >
      <button
        type="button"
        className="inline-flex items-center justify-center align-middle transition-colors hover:opacity-70"
        style={{ color: '#A1907A' }}
        aria-label={`說明：${entry.title}`}
        onClick={e => e.preventDefault()}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </Tooltip>
  );
};
