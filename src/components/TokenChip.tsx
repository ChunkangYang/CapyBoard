import React from 'react';
import { Token } from '../engine/types';

// ─── Chip palette ─────────────────────────────────────────────────────────────
// 溫馨家庭風配色：以暖色系蠟筆色取代賭場的紅黑綠，但保留籌碼的內外圈造型。
export type ChipPalette = { base: string; light: string; dark: string; spot: string; text: string };

export const CHIP_PALETTES: Record<Token['type'], ChipPalette> = {
  resource: { base: '#F4B860', light: '#FBD08A', dark: '#E09B3D', spot: '#FFF7E8', text: '#7A4E12' }, // 蜂蜜橘
  card:     { base: '#EF8E72', light: '#F7AE97', dark: '#D96E50', spot: '#FFF1EC', text: '#7E3322' }, // 蜜桃珊瑚
  dice:     { base: '#8FBF9F', light: '#B0D6BC', dark: '#6FA582', spot: '#EFFAF1', text: '#2F5C3E' }, // 抹茶綠
  custom:   { base: '#B89FD4', light: '#D0BCE6', dark: '#9A7CC0', spot: '#F5EFFB', text: '#4C357A' }, // 薰衣草紫
};

export const chipPaletteFor = (token: Token): ChipPalette =>
  CHIP_PALETTES[token.type] ?? CHIP_PALETTES.custom;

/** 賭場籌碼造型元件：外圈邊點 + 內圈虛線環 + 中心符號 / emoji。 */
export const TokenChip: React.FC<{
  token: Token;
  size?: number;
  selected?: boolean;
  dragging?: boolean;
}> = ({ token, size = 56, selected = false, dragging = false }) => {
  const c = chipPaletteFor(token);
  const center = token.icon?.trim() || token.name?.trim()?.[0] || '?';

  return (
    <div
      className="relative shrink-0 transition-transform duration-150"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        // 外圈交錯邊點（白色蠟筆點）營造籌碼鋸齒
        background: `repeating-conic-gradient(from 0deg, ${c.base} 0deg 23deg, ${c.spot} 23deg 36deg)`,
        boxShadow: selected
          ? `0 0 0 3px ${c.dark}, 0 6px 14px rgba(0,0,0,0.18)`
          : '0 3px 8px rgba(120,80,30,0.22)',
        opacity: dragging ? 0.45 : 1,
        transform: selected ? 'scale(1.06)' : undefined,
      }}
    >
      {/* 內圈面盤 */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          inset: '14%',
          background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 70%)`,
          border: `${Math.max(2, size * 0.045)}px dashed ${c.spot}`,
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)',
          color: c.text,
          fontSize: size * 0.42,
          lineHeight: 1,
        }}
      >
        <span style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.5))' }}>{center}</span>
      </div>
      {/* 光澤高光，立體硬幣感 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)' }}
      />
    </div>
  );
};
