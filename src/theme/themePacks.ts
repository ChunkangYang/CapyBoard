import { GameModule } from '../engine/types';

/** 主題包 — 定義「一份美術資源如何餵進遊戲」的圖層規格。
 *  目前以 CSS 漸層 + emoji 氛圍出貨；每個圖層都預留 imageUrl（data URI 或網址），
 *  日後把 AI 生圖填進去即可無縫升級成圖片美術，不動渲染邏輯。 */
export interface ThemePack {
  id: string;
  name: string;
  /** 遊玩區背景（CSS background）。有 bgImageUrl 時優先用圖。 */
  bg: string;
  bgImageUrl?: string;
  /** 面板/卡片底色 */
  panel: string;
  /** 強調色（暖色系） */
  accent: string;
  accentDark: string;
  /** 次要文字色 */
  muted: string;
  /** 氛圍裝飾 emoji（漂浮在背景，營造主題感）；日後可換成貼圖 */
  ambiance: string[];
  /** token 若無自訂 icon 時，依主題給的預設圖示池 */
  tokenFallback: string[];
}

// ─── 內建主題包 ────────────────────────────────────────────────────────────────
export const THEME_PACKS: Record<string, ThemePack> = {
  cozy: {
    id: 'cozy',
    name: '溫馨客廳',
    bg: 'radial-gradient(circle at 20% 20%, #FFF3DE 0%, #FBEFDC 45%, #F6E6CC 100%)',
    panel: '#FFFDF8',
    accent: '#F4B860',
    accentDark: '#E09B3D',
    muted: '#A1907A',
    ambiance: ['🌿', '☕', '🧶', '🪵'],
    tokenFallback: ['🍯', '🌰', '🍄', '🧺'],
  },
  mine: {
    id: 'mine',
    name: '礦坑淘金',
    bg: 'linear-gradient(160deg, #F3E4CB 0%, #E8CFA6 55%, #D9B784 100%)',
    panel: '#FFF8EC',
    accent: '#E0A33D',
    accentDark: '#B87A22',
    muted: '#9A8461',
    ambiance: ['⛏️', '💎', '🪨', '🥇', '✨'],
    tokenFallback: ['🪨', '🥇', '💎', '⛏️'],
  },
  magic: {
    id: 'magic',
    name: '魔法卡牌',
    bg: 'radial-gradient(circle at 70% 30%, #F3E8FB 0%, #EFE0F6 40%, #F6EAD8 100%)',
    panel: '#FFFAF3',
    accent: '#B89FD4',
    accentDark: '#9174B8',
    muted: '#A08FB0',
    ambiance: ['✨', '🔮', '🌙', '⭐', '🃏'],
    tokenFallback: ['🃏', '✨', '🔮', '⭐'],
  },
  adventure: {
    id: 'adventure',
    name: '骰子冒險',
    bg: 'linear-gradient(160deg, #E8F3E4 0%, #F1EAD2 50%, #FBE9CE 100%)',
    panel: '#FCFBF0',
    accent: '#8FBF9F',
    accentDark: '#5FA075',
    muted: '#8A9A82',
    ambiance: ['🎲', '🏕️', '⭐', '🧭', '🏆'],
    tokenFallback: ['🎲', '🏆', '⭐', '🪙'],
  },
};

export const DEFAULT_THEME = THEME_PACKS.cozy;

/** 依遊戲內容（名稱 / token 類型 / 關鍵字）自動挑選最貼合的主題包。 */
export function pickThemePack(module: GameModule): ThemePack {
  // 明確指定優先
  const explicit = (module.theme as any)?.pack as string | undefined;
  if (explicit && THEME_PACKS[explicit]) return THEME_PACKS[explicit];

  const name = module.gameName?.zh ?? '';
  const tokenNames = module.tokens.map(t => t.name).join('');
  const hay = name + tokenNames;

  const hasCard = module.tokens.some(t => t.type === 'card') || (module.piles?.length ?? 0) > 0;
  const hasDice = module.tokens.some(t => t.type === 'dice') || module.actions.some(a => a.type === 'rollDice');

  if (/礦|金|淘|寶石|礦石|黃金/.test(hay)) return THEME_PACKS.mine;
  if (/卡|牌|魔法|素材|合成/.test(hay) || hasCard) return THEME_PACKS.magic;
  if (/骰|冒險|星|獎盃|探索/.test(hay) || hasDice) return THEME_PACKS.adventure;
  return DEFAULT_THEME;
}
