// 音效系統 — 以 Web Audio API 即時合成，無需任何音檔素材。
// 溫馨家庭風：柔和木琴/鈴聲質感，非電子刺耳音。
// 靜音狀態存 localStorage，全站共用。

const MUTE_KEY = 'capyboard_muted';

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // 瀏覽器政策：需在使用者互動後 resume
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

export function setMuted(m: boolean): void {
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ }
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

/** 播一個柔和的音符（帶輕微 attack/decay 包絡，木琴感）。 */
function tone(freq: number, start: number, dur: number, gain = 0.15, type: OscillatorType = 'sine') {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// 音符頻率（C 大調，溫暖）
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, C6: 1046.5,
};

export type SfxName =
  | 'click' | 'gain' | 'spend' | 'trade' | 'dice' | 'draw'
  | 'move' | 'score' | 'turn' | 'win' | 'lose' | 'start';

export function playSfx(name: SfxName): void {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  switch (name) {
    case 'click':
      tone(N.E5, 0, 0.12, 0.08, 'triangle');
      break;
    case 'gain':      // 上升三連音，愉悅
      tone(N.E5, 0, 0.14, 0.12, 'sine');
      tone(N.G5, 0.07, 0.16, 0.12, 'sine');
      break;
    case 'spend':     // 下降兩音
      tone(N.G4, 0, 0.14, 0.11, 'sine');
      tone(N.D4, 0.08, 0.16, 0.11, 'sine');
      break;
    case 'trade':     // 來回兩音
      tone(N.C5, 0, 0.12, 0.1, 'triangle');
      tone(N.G5, 0.09, 0.14, 0.1, 'triangle');
      break;
    case 'dice':      // 骰子滾動感：快速隨機小音
      for (let i = 0; i < 5; i++) tone(300 + Math.random() * 400, i * 0.06, 0.06, 0.06, 'square');
      break;
    case 'draw':      // 抽牌：短促上滑
      tone(N.A4, 0, 0.1, 0.09, 'triangle');
      tone(N.C6, 0.06, 0.12, 0.08, 'triangle');
      break;
    case 'move':
      tone(N.C5, 0, 0.09, 0.08, 'sine');
      break;
    case 'score':     // 加分：明亮鈴音
      tone(N.C5, 0, 0.12, 0.11, 'sine');
      tone(N.E5, 0.06, 0.14, 0.11, 'sine');
      tone(N.G5, 0.12, 0.2, 0.11, 'sine');
      break;
    case 'turn':      // 換人：柔和提示
      tone(N.D5, 0, 0.14, 0.1, 'sine');
      break;
    case 'start':     // 開始：上行琶音
      tone(N.C4, 0, 0.14, 0.1);
      tone(N.E4, 0.08, 0.14, 0.1);
      tone(N.G4, 0.16, 0.14, 0.1);
      tone(N.C5, 0.24, 0.28, 0.12);
      break;
    case 'win':       // 勝利：歡樂號角琶音
      tone(N.C5, 0, 0.16, 0.14, 'triangle');
      tone(N.E5, 0.12, 0.16, 0.14, 'triangle');
      tone(N.G5, 0.24, 0.16, 0.14, 'triangle');
      tone(N.C6, 0.36, 0.5, 0.16, 'triangle');
      tone(N.G5, 0.36, 0.5, 0.08, 'sine');
      break;
    case 'lose':      // 失敗：下行嘆息
      tone(N.G4, 0, 0.2, 0.12, 'sine');
      tone(N.E4, 0.16, 0.22, 0.12, 'sine');
      tone(N.C4, 0.34, 0.4, 0.12, 'sine');
      break;
  }
}

/** 依 action 型別對應音效。 */
export function sfxForAction(actionType: string): SfxName {
  switch (actionType) {
    case 'gainToken': return 'gain';
    case 'spendToken': return 'spend';
    case 'tradeToken': return 'trade';
    case 'rollDice': return 'dice';
    case 'drawCard': return 'draw';
    case 'moveToken': return 'move';
    default: return 'click';
  }
}
