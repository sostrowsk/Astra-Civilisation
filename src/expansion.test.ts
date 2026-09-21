import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tileAt, explore, expeditionStatus, goods, stock, knownRegions, worldBounds, serialize, deserialize, place, step, regrowForest, findPath, type GameState } from './sim.ts';
import { generateChunk, generateTile, terrainSample, regionId, regionCoords, seedNumber } from './generator.ts';
import { loadGame, saveGame, SAVE_KEY } from './persistence.ts';
const fund = (s: GameState) => { s.won = true; s.level = 4; s.buildings[0].inventory = goods(1000, 1000, 1000, 1000, 1000, 1000); };
test('same seed reproduces terrain; different seeds vary mountains, water and biomes', () => {
  assert.deepEqual(createGame(42), createGame(42)); assert.notDeepEqual(createGame(41).tiles, createGame(42).tiles);
  const values = new Set<string>(); let water = 0, peaks = 0, lakes = 0;
  for (let z = -120; z <= 120; z += 2) for (let x = -120; x <= 120; x += 2) { const t = terrainSample(42, x, z); values.add(t.biome); water += Number(t.water); lakes += Number(t.lake); peaks += Number(t.height > 4); }
  assert.equal(values.size, 4); assert.ok(water > 100 && lakes > 50 && peaks > 100); assert.equal(seedNumber('Bergtal'), seedNumber('Bergtal')); assert.equal(seedNumber('4294967297'), 1);
});
test('chunk generation matches global samples at every boundary in either generation order', () => {
  for (const seed of [1, 42, 999]) {
    const a = generateChunk(seed, regionId(0, 0)), b = generateChunk(seed, regionId(1, 0));
    for (const t of [...b, ...a]) assert.deepEqual(t, generateTile(seed, t.x, t.z));
    for (let z = -24; z <= 48; z++) { const l = terrainSample(seed, 25, z), r = terrainSample(seed, 26, z); assert.ok(Math.abs(l.height - r.height) <= 1.25); }
  }
});
test('water and mountain formations cross exploration borders', () => {
  let waterCrossings = 0, mountainCrossings = 0;
  for (let cz = -4; cz <= 4; cz++) for (let x = -100; x < 100; x++) {
    const a = terrainSample(42, x, cz * 24 - 1), b = terrainSample(42, x, cz * 24);
    if (a.water && b.water) waterCrossings++; if (a.height > 3 && b.height > 3) mountainCrossings++;
  }
  assert.ok(waterCrossings > 50); assert.ok(mountainCrossings > 50);
});
test('region ids roundtrip signed coordinates and world extends in all directions', () => {
  for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) assert.deepEqual(regionCoords(regionId(x, z)), { cx: x, cz: z });
  const s = createGame(42); fund(s);
  for (const [x, z] of [[-1, 0], [0, -1], [1, 0], [0, 1], [2, 0], [3, 0], [4, 0]]) assert.ok(explore(s, regionId(x, z)).ok);
  assert.equal(s.regions.length, 8); assert.equal(s.tiles.length, 8 * 624); assert.equal(worldBounds(s).minX, -26); assert.ok(knownRegions(s).some(r => r.x === 130));
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('expeditions validate tiers, adjacency, reservations and charge only once', () => {
  const s = createGame(42), id = regionId(1, 0); assert.equal(explore(s, id).ok, false); fund(s);
  assert.equal(explore(s, regionId(10, 0)).ok, false);
  const cost = knownRegions(s).find(r => r.id === id)!.cost, before = stock(s); assert.ok(explore(s, id).ok); assert.equal(stock(s).planks, before.planks - cost.planks);
  const after = stock(s); assert.equal(explore(s, id).ok, false); assert.deepEqual(stock(s), after);
  const reserved = createGame(42); reserved.won = true; reserved.buildings[0].inventory = goods(20, cost.planks, cost.stone); place(reserved, 'house', 7, 10); step(reserved, .1); assert.equal(expeditionStatus(reserved, id).ok, false);
});
test('diamonds can pay an expedition without removing other supplies', () => {
  const s = createGame(42); s.won = true; s.buildings[0].inventory.diamond = 2; const before = stock(s); assert.ok(explore(s, regionId(-1, 0), true).ok); assert.deepEqual(stock(s), { ...before, diamond: 0 });
});
test('safe starting clearing and resources remain reachable over 100 seeds', () => {
  for (let seed = 0; seed < 100; seed++) { const s = createGame(seed); for (const p of [{ x: 7, z: 10 }, { x: 9, z: 8 }, { x: 11, z: 9 }]) assert.ok(findPath(s, s.buildings[0], p)); assert.equal(tileAt(s, 4, 10).node, 'tree'); assert.equal(tileAt(s, 9, 6).node, 'rock'); }
});
test('forest regrowth respects roads and buildings and stays deterministic', () => {
  const s = createGame(42); place(s, 'road', 6, 11); const copy = deserialize(serialize(s));
  for (let i = 0; i < 80; i++) { s.ecologyTick++; copy.ecologyTick++; regrowForest(s); regrowForest(copy); }
  assert.deepEqual(copy, s); assert.equal(tileAt(s, 6, 11).node, null); assert.equal(tileAt(s, 8, 12).node, null); assert.ok(s.woodGrown > 0);
});
test('legacy saves are disabled, new storage is isolated and corrupt v3 is protected', () => {
  const values = new Map<string, string>([['astra-civilisation:save:v2', 'old test data']]), store = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
  const loaded = loadGame(store); assert.ok(loaded.canSave); assert.match(loaded.notice, /deaktiviert/); saveGame(store, loaded.state); const current = values.get(SAVE_KEY); saveGame(store, createGame(7), true); assert.equal(values.get(SAVE_KEY), current); assert.equal(loadGame(store, true).state.seed, 7);
  values.set(SAVE_KEY, '{bad'); assert.equal(loadGame(store).canSave, false); assert.equal(values.get(SAVE_KEY), '{bad');
});

test('all five eras gate livestock, textile production and metal manufacturing in order', async () => {
  const { DEFINITIONS, advanceCivilisation, civilisationProgress, populationCap, RESOURCES, ERAS } = await import('./sim.ts');
  const s = createGame(42); fund(s); s.level = 1;
  const add = (kind: import('./sim.ts').BuildingKind) => s.buildings.push({ id: s.nextId++, kind, x: 6, z: 10, complete: true, active: true, progress: 1, inventory: goods(), delivered: { ...DEFINITIONS[kind].cost } });
  for (const kind of ['woodcutter', 'sawmill', 'quarry', 'warehouse', 'outpost'] as const) add(kind);
  for (let i = 0; i < 59; i++) add('house');
  for (let i = 10; i < 14; i++) s.villagers.push({ ...s.villagers[0], id: i + 1, name: 'Person ' + i });
  assert.ok(civilisationProgress(s).ready); assert.ok(advanceCivilisation(s).ok); assert.equal(s.villagers.length, 36);
  add('farm'); add('mine'); add('smelter');
  assert.ok(advanceCivilisation(s).ok); assert.equal(s.level, 3); assert.equal(populationCap(s), 52);
  assert.equal(DEFINITIONS.sheepfold.tier, 3); assert.equal(DEFINITIONS.weaver.tier, 3); assert.equal(DEFINITIONS.tailor.tier, 3);
  for (const kind of ['sheepfold', 'weaver', 'tailor', 'warehouse'] as const) add(kind);
  assert.ok(explore(s, regionId(-1, 0)).ok); assert.ok(explore(s, regionId(0, -1)).ok);
  assert.equal(advanceCivilisation(s).ok, false, 'clothing is required'); s.buildings[0].inventory.clothes = 40;
  assert.ok(advanceCivilisation(s).ok); assert.equal(s.villagers.length, 104);
  for (const kind of ['townhall', 'workshop', 'academy', 'forge'] as const) add(kind);
  s.buildings[0].inventory.copper = 10; s.buildings[0].inventory.iron = 10;
  assert.ok(advanceCivilisation(s).ok); assert.equal(s.villagers.length, 136); assert.equal(new Set(s.villagers.map(v => v.name)).size, 136);
  assert.deepEqual(ERAS.map(e => e.name), ['Pionierlager', 'Dorf', 'Viehzucht', 'Kleinstadt', 'Manufaktur']);
  assert.equal(advanceCivilisation(s).ok, false); for (const r of RESOURCES) assert.ok(stock(s)[r] >= 0);
});

test('a mature sapling cannot close the only corridor to another building', () => {
  const s = createGame(42);
  for (const t of s.tiles) Object.assign(t, { kind: 'water', waterway: 'lake', node: null, amount: 0, sapling: 0, road: false });
  for (let z = 12; z <= 18; z++) Object.assign(tileAt(s, 8, z), { kind: 'grass', waterway: null });
  for (const v of s.villagers) { v.x = 8; v.z = 12; }
  s.buildings.push({ ...s.buildings[0], id: s.nextId++, x: 8, z: 18, kind: 'house', inventory: goods() });
  tileAt(s, 8, 15).sapling = 1000; regrowForest(s);
  assert.equal(tileAt(s, 8, 15).node, null); assert.ok(findPath(s, s.buildings[0], { x: 8, z: 18 }));
});
