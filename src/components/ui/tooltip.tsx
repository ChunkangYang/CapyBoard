import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delay = 400,
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

  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-md ${posClass[side]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};
