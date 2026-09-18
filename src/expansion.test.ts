import { playCampaign } from '../scripts/campaign.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, place, step, findPath, stock, goods, serialize, deserialize, explore, expeditionStatus, advanceCivilisation, civilisationProgress, populationCap, regrowForest, tileAt, WIDTH, HEIGHT, ORIGINAL_WIDTH, ORIGINAL_HEIGHT, REGIONS, BIOMES, RESOURCES, recipeFor, type GameState, type BuildingKind, type Building } from './sim.ts';
import { loadGame, saveGame, SAVE_KEY, LEGACY_KEY } from './persistence.ts';
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function until(s: GameState, predicate: () => boolean, seconds = 900) {
  for (let i = 0; i < seconds * 10; i++) { if (predicate()) return; step(s, .1); }
  assert.ok(predicate(), `Timed out: t=${s.time.toFixed(1)}, level=${s.level}, stock=${JSON.stringify(stock(s))}, goals=${JSON.stringify(civilisationProgress(s))}, unfinished=${JSON.stringify(s.buildings.filter(b => !b.complete))}`);
}
function build(s: GameState, kind: Exclude<BuildingKind, 'camp'>, x: number, z: number) {
  const result = place(s, kind, x, z); assert.ok(result.ok, `${kind} ${x}/${z}: ${result.reason}`); return s.buildings.find(b => b.id === result.id)!;
}
function legacySave() {
  const current = createGame(); build(current, 'woodcutter', 7, 10); run(current, 3);
  const old: any = JSON.parse(serialize(current)); old.version = 1;
  for (const k of ['level', 'regions', 'ecologyTick', 'woodGrown']) delete old[k];
  old.tiles = current.tiles.filter(t => t.x < ORIGINAL_WIDTH && t.z < ORIGINAL_HEIGHT).map(({ biome, region, discovered, sapling, ...t }) => t);
  for (const b of old.buildings) for (const field of ['inventory', 'delivered']) for (const r of ['food', 'tools', 'knowledge']) delete b[field][r];
  return old;
}
class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test('legacy migration preserves every original tile, inventory, citizen and running route', () => {
  const old = legacySave(), next = deserialize(JSON.stringify(old));
  assert.equal(next.version, 2); assert.equal(next.tiles.length, WIDTH * HEIGHT);
  assert.deepEqual(next.villagers, old.villagers);
  for (const t of old.tiles) for (const key of Object.keys(t)) assert.deepEqual((tileAt(next, t.x, t.z) as any)[key], t[key]);
  for (const b of old.buildings) assert.deepEqual(next.buildings.find(n => n.id === b.id), { ...b, inventory: { ...goods(), ...b.inventory }, delivered: { ...goods(), ...b.delivered } });
  assert.deepEqual(next.regions, [0]); assert.equal(next.level, 1);
  run(next, 40); assert.ok(next.buildings[1].complete);
  assert.deepEqual(deserialize(serialize(next)), next);
});
test('storage migration leaves original save untouched and sandbox cannot affect it', () => {
  const storage = new MemoryStorage(), raw = JSON.stringify(legacySave()); storage.setItem(LEGACY_KEY, raw);
  const loaded = loadGame(storage); assert.ok(loaded.canSave); assert.match(loaded.notice, /übernommen/);
  saveGame(storage, loaded.state); assert.equal(storage.getItem(LEGACY_KEY), raw);
  const v2 = storage.getItem(SAVE_KEY); saveGame(storage, createGame(7), true); assert.equal(storage.getItem(SAVE_KEY), v2);
  assert.equal(loadGame(storage, true).state.seed, 7);
});
test('corrupt current save is protected instead of silently replaced with an older save', () => {
  const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, '{broken'); storage.setItem(LEGACY_KEY, JSON.stringify(legacySave()));
  const loaded = loadGame(storage); assert.equal(loaded.canSave, false); assert.equal(storage.getItem(SAVE_KEY), '{broken');
  assert.equal(loadGame({ getItem() { throw new Error('denied'); }, setItem() {} }).canSave, false);
});
test('biomes have different deposits and agriculture rates', () => {
  const s = createGame();
  const forest = s.tiles.filter(t => t.region === 1 && t.node === 'tree');
  const highland = s.tiles.filter(t => t.region === 2 && t.node === 'rock');
  assert.ok(forest.length > 100); assert.ok(highland.length > 70);
  assert.ok(forest.every(t => t.amount === 24)); assert.ok(highland.every(t => t.amount === 140));
  const farm = { ...s.buildings[0], kind: 'farm' as const };
  assert.ok(recipeFor(s, farm)!.seconds < recipeFor(s, { ...farm, x: 30, z: 30 })!.seconds);
});
test('exploration validates prerequisites, pays exactly once and unlocks only the requested region', () => {
  const s = createGame(); s.buildings[0].inventory = goods(100, 200, 200, 200, 200, 200);
  assert.equal(explore(s, 1).ok, false); s.won = true;
  assert.equal(explore(s, 3).ok, false);
  assert.equal(explore(s, 999).ok, false);
  assert.equal(findPath(s, { x: 8, z: 12 }, { x: 27, z: 12 }), null);
  const before = stock(s); assert.ok(explore(s, 1).ok);
  for (const r of RESOURCES) assert.equal(stock(s)[r], before[r] - REGIONS[1].cost[r]);
  assert.equal(explore(s, 1).ok, false); assert.equal(tileAt(s, 27, 12).discovered, true); assert.equal(tileAt(s, 27, 30).discovered, false);
});
test('an expedition cannot spend goods reserved for a construction delivery', () => {
  const s = createGame(); s.won = true; s.buildings[0].inventory = goods(20, 24, 16);
  build(s, 'house', 7, 10); step(s, .1);
  assert.ok(s.villagers.some(v => v.task?.phase === 'pickup'));
  assert.equal(explore(s, 1).ok, false);
});
test('new buildings and undiscovered land are locked until their era and expedition', () => {
  const s = createGame(); assert.equal(place(s, 'farm', 7, 10).ok, false);
  assert.equal(place(s, 'road', 27, 12).ok, false);
  assert.equal(advanceCivilisation(s).ok, false); assert.equal(s.level, 1);
});
test('sparse woodland regenerates slowly without occupying buildings, roads or active routes', () => {
  const s = createGame();
  for (const t of s.tiles) if (t.discovered && t.node === 'tree') { t.node = null; t.amount = 0; }
  const road = { x: 7, z: 11 }; assert.ok(place(s, 'road', road.x, road.z).ok);
  const before = s.tiles.filter(t => t.discovered && t.node === 'tree').length;
  run(s, 240);
  assert.ok(s.woodGrown > 0); assert.ok(s.tiles.some(t => t.discovered && t.node === 'tree'));
  assert.equal(before, 0); assert.equal(tileAt(s, 7, 11).node, null); assert.equal(tileAt(s, 8, 12).node, null);
  assert.ok(findPath(s, { x: 8, z: 12 }, road));
});
test('regrowth never closes a one-tile route to an inhabited outpost', () => {
  const s = createGame();
  // The candidate is three cells from both buildings, so building buffers alone cannot protect this choke point.
  for (const t of s.tiles) if (t.discovered && t.kind === 'grass') { t.node = 'rock'; t.amount = 1; }
  for (const z of [12, 13, 14, 15, 16, 17, 18]) { const t = tileAt(s, 8, z); t.road = false; t.node = null; t.amount = 0; }
  s.villagers.forEach(v => { v.x = 8; v.z = 12; });
  const b: Building = { ...s.buildings[0], id: s.nextId++, kind: 'outpost', x: 8, z: 18 }; s.buildings.push(b);
  tileAt(s, 8, 15).sapling = 200; regrowForest(s);
  assert.equal(tileAt(s, 8, 15).node, null); assert.ok(findPath(s, s.buildings[0], b));
});
test('ecology continues identically after save/restore and stays density bounded', () => {
  const s = createGame(); run(s, 70); const restored = deserialize(serialize(s));
  run(s, 240); run(restored, 240); assert.deepEqual(restored, s);
  assert.ok(s.tiles.filter(t => t.discovered && t.node === 'tree').length < 220);
});

test('complete campaign reaches all four eras through real production, delivery and exploration', () => {
  const { state } = playCampaign();
  assert.equal(state.level, 4); assert.equal(state.regions.length, 6);
  console.log(`Four eras and six regions completed in ${(state.time / 60).toFixed(1)} simulation minutes.`);
});


test('active foresters accelerate nearby saplings; paused foresters do not', () => {
  const active = createGame(); active.level = 2;
  const forester = build(active, 'forester', 6, 13); forester.complete = true; forester.progress = 1;
  const sapling = tileAt(active, 2, 13); sapling.node = null; sapling.amount = 0; sapling.sapling = 1;
  const paused = deserialize(serialize(active)); paused.buildings.find(b => b.id === forester.id)!.active = false;
  for (let i = 0; i < 3; i++) { regrowForest(active); regrowForest(paused); }
  assert.equal(tileAt(active, 2, 13).node, 'tree'); assert.equal(tileAt(paused, 2, 13).node, null);
});
test('the highest era supports 64 individually named residents and no overflow', () => {
  const s = createGame(); s.level = 4; s.buildings[0].inventory = goods(500, 500, 500);
  for (let x = 5; x <= 11; x++) for (let z = 8; z <= 16; z++) {
    if (s.buildings.length > 31) break;
    const result = place(s, 'house', x, z); if (!result.ok) continue;
    const b = s.buildings.find(b => b.id === result.id)!; b.delivered = goods(3, 4, 2); b.progress = .9999;
  }
  run(s, 1); assert.equal(s.villagers.length, 64); assert.ok(s.villagers.every(v => typeof v.name === 'string' && v.name));
  assert.equal(new Set(s.villagers.map(v => v.name)).size, 64); assert.deepEqual(deserialize(serialize(s)), s);
});
test('legacy saves with missing inventory data are rejected before migration', () => {
  const old = legacySave(); delete old.buildings[0].inventory;
  assert.throws(() => deserialize(JSON.stringify(old)));
});
