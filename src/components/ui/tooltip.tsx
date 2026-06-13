import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  wide?: boolean;        // 長說明文字：自動換行 + 較寬，用於 help popup
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 400,
  wide = false,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const posClass: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-1.5',
  };

  const sizeClass = wide
    ? 'w-56 whitespace-normal leading-relaxed text-left'
    : 'whitespace-nowrap';

  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute z-50 rounded-lg border px-2.5 py-1.5 text-xs ${sizeClass} ${posClass[side]}`}
          style={{
            background: '#FFFDF8',
            color: '#5C4A33',
            borderColor: '#F0E6D6',
            boxShadow: '0 4px 14px rgba(120,80,30,0.12)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};
