import { createGame, deserialize, serialize, type GameState } from './sim.ts';

export interface SaveStore {
  read(key: string): Promise<string | null>;
  list(prefix: string): Promise<string[]>;
  write(entries: [string, string | null][]): Promise<void>;
}
export interface SavedWorld {
  id: string; name: string; seed: number; updatedAt: number;
  day: number; level: number; population: number; regions: number;
}
export class SaveLibrary {
  private prefix: string;
  private store: SaveStore;
  constructor(store: SaveStore, sandbox = false) { this.store = store; this.prefix = `worlds:${sandbox ? 'sandbox' : 'normal'}:`; }
  private key(kind: string, id = '') { return this.prefix + kind + ':' + id; }
  private metadata(id: string, name: string, state: GameState): SavedWorld {
    return { id, name: name.trim().slice(0, 60) || `Tal ${state.seed}`, seed: state.seed, updatedAt: Date.now(), day: Math.floor(state.time / 120) + 1, level: state.level, population: state.villagers.length, regions: state.regions.length };
  }
  async list(): Promise<SavedWorld[]> {
    return (await this.store.list(this.key('meta'))).map(raw => JSON.parse(raw) as SavedWorld).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  async open(readLegacy: () => Promise<string | null>) {
    const active = await this.store.read(this.key('active'));
    if (active) return this.load(active);
    // Recover an existing library before importing the old single save again.
    const existing = (await this.list())[0];
    if (existing) { const loaded = await this.load(existing.id); await this.activate(existing.id); return loaded; }
    const raw = await readLegacy(), state = raw ? deserialize(raw) : createGame();
    const slot = await this.create(state, raw ? 'Mein bisheriges Tal' : 'Mein erstes Tal');
    return { state, slot };
  }
  async load(id: string) {
    const [raw, meta] = await Promise.all([this.store.read(this.key('data', id)), this.store.read(this.key('meta', id))]);
    if (!raw || !meta) throw new Error('Dieser Spielstand ist nicht mehr vorhanden.');
    return { state: deserialize(raw), slot: JSON.parse(meta) as SavedWorld };
  }
  async activate(id: string) {
    await this.load(id); // Never point startup at an unreadable save.
    await this.store.write([[this.key('active'), id]]);
  }
  async create(state: GameState, name: string) {
    const slot = this.metadata(crypto.randomUUID(), name, state);
    await this.store.write([[this.key('data', slot.id), serialize(state)], [this.key('meta', slot.id), JSON.stringify(slot)], [this.key('active'), slot.id]]);
    return slot;
  }
  async save(slot: SavedWorld, state: GameState) {
    const next = this.metadata(slot.id, slot.name, state);
    await this.store.write([[this.key('data', slot.id), serialize(state)], [this.key('meta', slot.id), JSON.stringify(next)]]);
    return next;
  }
  async rename(id: string, name: string) {
    const { slot } = await this.load(id);
    const next = { ...slot, name: name.trim().slice(0, 60) || slot.name };
    await this.store.write([[this.key('meta', id), JSON.stringify(next)]]);
    return next;
  }
  async remove(id: string) {
    if (await this.store.read(this.key('active')) === id) throw new Error('Wechsle zuerst in ein anderes Tal, bevor du das aktive Spiel löschst.');
    await this.store.write([[this.key('data', id), null], [this.key('meta', id), null]]);
  }
}
