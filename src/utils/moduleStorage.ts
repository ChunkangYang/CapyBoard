import { GameModule } from '../engine/types';

const STORAGE_KEY = 'infinityboard_modules';

export interface ModuleMeta {
  id: string;
  name: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredEntry {
  meta: ModuleMeta;
  module: GameModule;
}

interface StoredData {
  [id: string]: StoredEntry;
}

function loadRaw(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredData;
  } catch {
    // 解析失敗時回傳空
  }
  return {};
}

function persist(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAllModules(): Array<{ id: string; meta: ModuleMeta; module: GameModule }> {
  const data = loadRaw();
  return Object.values(data)
    .sort((a, b) => b.meta.updatedAt.localeCompare(a.meta.updatedAt))
    .map(entry => ({ id: entry.meta.id, meta: entry.meta, module: entry.module }));
}

export function getModule(id: string): GameModule | null {
  const data = loadRaw();
  return data[id]?.module ?? null;
}

export function saveModule(id: string, module: GameModule): void {
  const data = loadRaw();
  const existing = data[id];
  data[id] = {
    meta: {
      id,
      name: module.gameName.zh,
      playerCount: module.players.length,
      createdAt: existing?.meta.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    module,
  };
  persist(data);
}

export function deleteModule(id: string): void {
  const data = loadRaw();
  delete data[id];
  persist(data);
}

export function copyModule(id: string): string {
  const data = loadRaw();
  const original = data[id];
  if (!original) return id;
  const newId = `module_${Date.now()}`;
  const copied: GameModule = {
    ...JSON.parse(JSON.stringify(original.module)),
    gameName: {
      ...original.module.gameName,
      zh: `${original.module.gameName.zh}（副本）`,
      en: `${original.module.gameName.en} (Copy)`,
    },
  };
  data[newId] = {
    meta: {
      id: newId,
      name: copied.gameName.zh,
      playerCount: copied.players.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    module: copied,
  };
  persist(data);
  return newId;
}

export function generateModuleId(): string {
  return `module_${Date.now()}`;
}

export function hasAnyModules(): boolean {
  return Object.keys(loadRaw()).length > 0;
}
