import React from 'react';

/** 水豚吉祥物 — 純 SVG，可縮放。CapyBoard 品牌識別。
 *  暖色蠟筆調，簡約溫潤，符合設計準則。 */
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
      {/* 耳朵 */}
      <ellipse cx="20" cy="18" rx="6" ry="7" fill="#B0763E" />
      <ellipse cx="44" cy="18" rx="6" ry="7" fill="#B0763E" />
      <ellipse cx="20" cy="19" rx="3" ry="3.5" fill="#8A5A2C" />
      <ellipse cx="44" cy="19" rx="3" ry="3.5" fill="#8A5A2C" />
      {/* 頭身 */}
      <ellipse cx="32" cy="38" rx="22" ry="20" fill="#C68B4E" />
      {/* 口鼻部 */}
      <ellipse cx="32" cy="46" rx="15" ry="12" fill="#D9A66C" />
      {/* 鼻孔 */}
      <ellipse cx="27" cy="45" rx="1.6" ry="2.2" fill="#5C3A1A" />
      <ellipse cx="37" cy="45" rx="1.6" ry="2.2" fill="#5C3A1A" />
      {/* 眼睛 */}
      {mood === 'happy' || mood === 'cheer' ? (
        <>
          <path d="M22 33 q4 -4 8 0" stroke="#4A2E14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M34 33 q4 -4 8 0" stroke="#4A2E14" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="26" cy="34" r="2.6" fill="#3D2712" />
          <circle cx="38" cy="34" r="2.6" fill="#3D2712" />
          <circle cx="27" cy="33.2" r="0.8" fill="#fff" />
          <circle cx="39" cy="33.2" r="0.8" fill="#fff" />
        </>
      )}
      {/* 嘴 */}
      <path d="M29 51 q3 2.5 6 0" stroke="#7A4E24" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* 腮紅 */}
      <ellipse cx="19" cy="43" rx="3.2" ry="2" fill="#EF8E72" opacity="0.55" />
      <ellipse cx="45" cy="43" rx="3.2" ry="2" fill="#EF8E72" opacity="0.55" />
      {/* cheer 時頭上小星 */}
      {mood === 'cheer' && (
        <text x="50" y="14" fontSize="12">✨</text>
      )}
    </svg>
  );
};
