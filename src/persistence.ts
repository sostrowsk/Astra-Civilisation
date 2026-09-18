import { createGame, deserialize, serialize, type GameState } from './sim.ts';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const SAVE_KEY = 'astra-civilisation:save:v2';
export const LEGACY_KEY = 'astra-civilisation:save:v1';
export function loadGame(storage: StorageLike, sandbox = false) {
  const suffix = sandbox ? ':sandbox' : '';
  try {
    const current = storage.getItem(SAVE_KEY + suffix), legacy = current === null ? storage.getItem(LEGACY_KEY + suffix) : null;
    const raw = current ?? legacy;
    return { state: raw ? deserialize(raw) : createGame(), canSave: true, notice: legacy ? 'Dein Tal wurde übernommen. Der ursprüngliche MVP-Spielstand bleibt als Sicherung erhalten.' : current ? 'Willkommen zurück. Neue Horizonte warten auf dich.' : '' };
  } catch {
    return { state: createGame(), canSave: false, notice: 'Der Spielstand konnte nicht gelesen werden. Die gespeicherten Daten bleiben unverändert. Automatisches Speichern ist gesperrt; ein bestätigtes neues Spiel hebt die Sperre auf.' };
  }
}
export function saveGame(storage: StorageLike, state: GameState, sandbox = false) { storage.setItem(SAVE_KEY + (sandbox ? ':sandbox' : ''), serialize(state)); }
