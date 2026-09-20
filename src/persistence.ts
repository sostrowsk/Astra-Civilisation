import { createGame, deserialize, serialize, type GameState } from './sim.ts';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const SAVE_KEY = 'astra-civilisation:save:v3';
export const LEGACY_KEY = 'astra-civilisation:save:v1';
export function loadGame(storage: StorageLike, sandbox = false) {
  const suffix = sandbox ? ':sandbox' : '';
  try {
    const current = storage.getItem(SAVE_KEY + suffix);
    const old = !current && (storage.getItem('astra-civilisation:save:v2' + suffix) || storage.getItem(LEGACY_KEY + suffix));
    return { state: current ? deserialize(current) : createGame(), canSave: true, notice: old ? 'Neue Weltgeneration: Alte Testpartien sind deaktiviert. Deine Reise beginnt in einer neuen Seed-Welt.' : current ? 'Willkommen zurück in deiner Welt.' : '' };
  } catch {
    return { state: createGame(), canSave: false, notice: 'Der Spielstand konnte nicht gelesen werden. Die gespeicherten Daten bleiben unverändert. Automatisches Speichern ist gesperrt; ein bestätigtes neues Spiel hebt die Sperre auf.' };
  }
}
export function saveGame(storage: StorageLike, state: GameState, sandbox = false) { storage.setItem(SAVE_KEY + (sandbox ? ':sandbox' : ''), serialize(state)); }

// IndexedDB gives growing worlds room beyond localStorage's small per-origin quota.
let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('astra-civilisation', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error('Spielstand-Datenbank ist in einem anderen Fenster blockiert.')); };
  });
  return database;
}
export async function readDatabase(key: string): Promise<string | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('saves', 'readonly'), request = transaction.objectStore('saves').get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
export const browserSaveStore = {
  read: readDatabase,
  async list(prefix: string): Promise<string[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly');
      const request = tx.objectStore('saves').getAll(IDBKeyRange.bound(prefix, prefix + '\uffff'));
      request.onsuccess = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
      request.onerror = () => reject(request.error);
    });
  },
  async write(entries: [string, string | null][]): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite'), store = tx.objectStore('saves');
      for (const [key, value] of entries) value === null ? store.delete(key) : store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  },
};
export async function readStoredGame(sandbox = false): Promise<string | null> {
  const key = SAVE_KEY + (sandbox ? ':sandbox' : ''), raw = await readDatabase(key);
  // Version-3 development saves can be imported cheaply; v1/v2 remain disabled.
  if (raw !== null) return raw;
  try { return localStorage.getItem(key); } catch { return null; }
}
export async function loadStoredGame(sandbox = false) {
  try {
    const raw = await readStoredGame(sandbox);
    let old = false;
    try { const suffix = sandbox ? ':sandbox' : ''; old = !!(localStorage.getItem('astra-civilisation:save:v2' + suffix) || localStorage.getItem(LEGACY_KEY + suffix)); } catch { /* IndexedDB can still work when localStorage is unavailable. */ }
    return { state: raw ? deserialize(raw) : createGame(), canSave: true, notice: raw ? 'Willkommen zurück in deiner Welt.' : old ? 'Neue Weltgeneration: Alte Testpartien sind deaktiviert.' : '' };
  } catch {
    return { state: createGame(), canSave: false, notice: 'Der gespeicherte Spielstand konnte nicht geladen werden. Er bleibt unverändert; automatisches Überschreiben ist gesperrt.' };
  }
}
export async function saveStoredGame(state: GameState, sandbox = false) {
  const raw = serialize(state), db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('saves', 'readwrite');
    transaction.objectStore('saves').put(raw, SAVE_KEY + (sandbox ? ':sandbox' : ''));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
