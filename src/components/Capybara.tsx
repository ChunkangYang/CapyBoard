import React from 'react';

/** 水豚吉祥物 — 純 SVG，可縮放。CapyBoard 品牌識別。
 *  水豚特徵：磚塊般方正的長頭、耳朵極小且貼在頭頂、口鼻部長而鈍、
 *  幅寬扁平的大黑鼻（最關鍵辨識點）。暖色蠟筆調，符合設計準則。 */
export const Capybara: React.FC<{
  size?: number;
  mood?: 'happy' | 'chill' | 'cheer';
  className?: string;
}> = ({ size = 48, mood = 'chill', className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="capybara"
    >
      {/* 極小的耳朵（水豚耳朵很小、貼在頭頂兩側，不像熊那樣又大又圓） */}
      <ellipse cx="18" cy="15" rx="3.4" ry="2.8" fill="#9C6A38" />
      <ellipse cx="46" cy="15" rx="3.4" ry="2.8" fill="#9C6A38" />
      <ellipse cx="18" cy="15.3" rx="1.5" ry="1.3" fill="#6E4622" />
      <ellipse cx="46" cy="15.3" rx="1.5" ry="1.3" fill="#6E4622" />

      {/* 磚塊般方正的長頭（水豚是方臉長頭，圓角小、頂部偏平） */}
      <rect x="11" y="13" width="42" height="45" rx="11" fill="#B67E47" />
      {/* 長而鈍的口鼻部（佔下半、略淺、更寬，營造長臉感） */}
      <path d="M14 40 q0 16 18 16 q18 0 18 -16 q0 -6 -18 -6 q-18 0 -18 6 Z" fill="#C9955C" />

      {/* 眼睛（小、靠上、間距寬） */}
      {mood === 'happy' || mood === 'cheer' ? (
        <>
          <path d="M20 28 q3.5 -3.5 7 0" stroke="#3D2712" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M37 28 q3.5 -3.5 7 0" stroke="#3D2712" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="23.5" cy="28" rx="2.3" ry="2.7" fill="#3D2712" />
          <ellipse cx="40.5" cy="28" rx="2.3" ry="2.7" fill="#3D2712" />
          <circle cx="24.4" cy="27" r="0.8" fill="#fff" />
          <circle cx="41.4" cy="27" r="0.8" fill="#fff" />
        </>
      )}

      {/* 幅寬扁平的大黑鼻 — 水豚最關鍵的辨識特徵 */}
      <rect x="21" y="40" width="22" height="12" rx="5" fill="#4A2E16" />
      {/* 鼻孔（左右分開的橫向鼻孔） */}
      <ellipse cx="27" cy="46" rx="2" ry="2.6" fill="#1B0F07" />
      <ellipse cx="37" cy="46" rx="2" ry="2.6" fill="#1B0F07" />
      {/* 鼻樑高光 */}
      <rect x="30" y="41.5" width="4" height="3.2" rx="1.4" fill="#6B4526" opacity="0.65" />

      {/* 嘴（鼻下短線） */}
      <path d="M28.5 54.5 q3.5 2.2 7 0" stroke="#7A4E24" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* 腮紅（很淡） */}
      <ellipse cx="16.5" cy="46" rx="2.6" ry="1.6" fill="#EF8E72" opacity="0.4" />
      <ellipse cx="47.5" cy="46" rx="2.6" ry="1.6" fill="#EF8E72" opacity="0.4" />

      {/* cheer 時頭上小星 */}
      {mood === 'cheer' && <text x="49" y="12" fontSize="12">✨</text>}
    </svg>
  );
};
