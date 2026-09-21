import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, place, step, goods, stock, serialize, deserialize, DEFINITIONS, housingCapacity, populationCap, workerTarget, type GameState, type Building, type Tool } from './sim.ts';
import { openMine, undergroundAt, revealCave } from './mining.ts';

function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function setup() {
  const s = createGame(42); s.level = 4;
  for (const t of s.tiles) Object.assign(t, { kind: 'grass', node: null, amount: 0, waterway: null, sapling: 0 });
  s.buildings[0].inventory = goods(1000, 1000, 1000); return s;
}
function build(s: GameState, kind: Tool, x: number, z: number, finish = true) {
  const result = place(s, kind, x, z); assert.ok(result.ok, result.reason);
  const b = s.buildings.find(b => b.id === result.id)!;
  if (finish) { b.delivered = { ...DEFINITIONS[b.kind].cost }; b.progress = .999; step(s, .1); assert.ok(b.complete); }
  return b;
}
function fronts(s: GameState, b: Building) {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz]) => {
    const t = undergroundAt(s, b.x + dx, b.z + dz, 1)!;
    Object.assign(t, { solid: true, revealed: true, ore: 'ironOre', amount: 8, order: b.id }); return t;
  });
}

test('a real mining house consumes materials and houses four residents at its entrance', () => {
  const s = setup(), before = stock(s), b = build(s, 'miningHouse', 10, 10, false);
  run(s, 90);
  assert.ok(b.complete); assert.equal(s.villagers.length, 14); assert.equal(housingCapacity(s), 14);
  const residents = s.villagers.filter(v => v.home === b.id);
  assert.equal(residents.length, 4); assert.ok(residents.every(v => v.job === null));
  for (const r of ['wood', 'planks', 'stone'] as const) assert.equal(stock(s)[r], before[r] - DEFINITIONS.miningHouse.cost[r]);
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('mining-house residents get nearby mine vacancies while every business receives a first worker', () => {
  const s = setup();
  const logger = build(s, 'woodcutter', 7, 10), near = build(s, 'mine', 11, 10), far = build(s, 'mine', 18, 10);
  near.autoMine = false; far.autoMine = false;
  // Free all idle residents and vacancies together; the new residents get first choice.
  for (const v of s.villagers) { v.job = null; v.task = null; v.mining = null; v.depth = 0; }
  near.mineWorkers = 4; far.mineWorkers = 4;
  const home = build(s, 'miningHouse', 10, 10);
  assert.ok(s.villagers.some(v => v.home === home.id && v.job === near.id));
  assert.ok(!s.villagers.some(v => v.job === far.id), 'distant mine needs a local settlement and residents');
  assert.ok(s.villagers.some(v => v.job === logger.id));
  assert.ok(s.villagers.filter(v => v.job === null).length >= 2);
});

test('four miners reserve different fronts, preserve ore, and resume a saved team identically', () => {
  const s = setup(), b = build(s, 'mine', 10, 10); b.autoMine = false; b.mineWorkers = 4;
  const targets = fronts(s, b); revealCave(s, b, 1);
  run(s, 3);
  const crew = s.villagers.filter(v => v.job === b.id); assert.equal(crew.length, 4);
  assert.equal(new Set(crew.map(v => `${v.mining?.target.x}/${v.mining?.target.z}`)).size, 4);
  assert.ok(crew.every(v => v.mining));
  const copy = deserialize(serialize(s)); run(s, 120); run(copy, 120); assert.deepEqual(copy, s);
  assert.ok(targets.every(t => !t.solid));
  assert.equal(stock(s).ironOre + s.villagers.reduce((n, v) => n + (v.cargo?.resource === 'ironOre' ? v.cargo.amount : 0), 0), 32);
});

test('reducing or pausing a working team finishes loads before releasing staff', () => {
  for (const pause of [false, true]) {
    const s = setup(), b = build(s, 'mine', 10, 10); b.autoMine = false; b.mineWorkers = 4; fronts(s, b);
    for (let i = 0; i < 150 && s.villagers.filter(v => v.mining?.stage === 'work').length < 4; i++) step(s, .1);
    assert.equal(s.villagers.filter(v => v.mining?.stage === 'work').length, 4);
    if (pause) b.active = false; else b.mineWorkers = 1;
    const copy = deserialize(serialize(s)); run(s, 100); run(copy, 100); assert.deepEqual(copy, s);
    assert.equal(s.villagers.filter(v => v.job === b.id).length, pause ? 0 : 1);
    assert.ok(stock(s).ironOre >= 8, 'all four initial loads were delivered');
    assert.ok(s.villagers.every(v => v.job === b.id || (!v.mining && !v.depth)));
  }
});

test('a crew reserves mine storage space before starting more loads', () => {
  const s = setup(), b = build(s, 'mine', 10, 10); b.autoMine = false; b.mineWorkers = 4; fronts(s, b);
  b.inventory.ironOre = 38;
  // Hold carriers in long tasks to isolate capacity reservation from collection.
  for (const v of s.villagers) v.task = { kind: 'haul', phase: 'drop', destId: 1, resource: 'wood', amount: 1, path: [], timer: 100 };
  for (const v of s.villagers.slice(0, 4)) { v.task = null; v.job = b.id; }
  step(s, .1); assert.equal(s.villagers.filter(v => v.mining).length, 1);
  run(s, 30); assert.equal(b.inventory.ironOre, 40); assert.ok(s.villagers.every(v => !v.mining));
});

test('housing permits growth past 64 up to 96, caps new arrivals, and survives loading', () => {
  const s = setup();
  for (let i = 0; i < 22; i++) build(s, 'miningHouse', 2 + i % 11, 2 + Math.floor(i / 11));
  assert.equal(populationCap(s), 96); assert.equal(housingCapacity(s), 96); assert.equal(s.villagers.length, 96);
  assert.equal(new Set(s.villagers.map(v => v.id)).size, 96);
  assert.ok(s.buildings.filter(b => b.kind === 'miningHouse').every(b => s.villagers.filter(v => v.home === b.id).length <= 4));
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('legacy v3 mines keep one workplace and corrupt staff or residence fields are rejected', () => {
  const s = setup(), b = build(s, 'mine', 10, 10); assert.equal(b.mineWorkers, undefined);
  const legacy = deserialize(serialize(s)); assert.equal(workerTarget(legacy.buildings.find(n => n.id === b.id)!), 1);
  b.mineWorkers = 5; assert.throws(() => deserialize(serialize(s))); b.mineWorkers = 1;
  s.villagers[0].home = b.id; assert.throws(() => deserialize(serialize(s)));
});

test('residents move to a higher-priority nearby mine after finishing work', () => {
  const s = setup(), home = build(s, 'miningHouse', 10, 10), logger = build(s, 'woodcutter', 9, 10);
  const resident = s.villagers.find(v => v.home === home.id)!;
  resident.job = logger.id; resident.task = { kind: 'haul', phase: 'drop', destId: 1, resource: 'wood', amount: 1, path: [], timer: 2 };
  // Other residents are busy carrying, leaving a vacancy until the miner's job ends.
  for (const v of s.villagers.filter(v => v.home !== home.id)) { v.job = null; v.task = { kind: 'haul', phase: 'drop', destId: 1, resource: 'wood', amount: 1, path: [], timer: 10 }; }
  const mine = build(s, 'mine', 11, 10); mine.autoMine = false; mine.mineWorkers = 4; mine.priority = 2;
  step(s, .1); assert.equal(resident.job, logger.id, 'current work finishes first');
  run(s, 4); assert.equal(resident.job, mine.id);
});
