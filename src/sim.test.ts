import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, place, placement, step, findPath, cancelConstruction, stock, serialize, deserialize, RESOURCES, DEFINITIONS, type GameState, type BuildingKind } from './sim.ts';

function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function until(s: GameState, done: () => boolean, seconds = 500) {
  for (let i = 0; i < seconds * 10; i++) { if (done()) return; step(s, .1); }
  assert.ok(done(), `Timed out at ${s.time.toFixed(1)} seconds: ${JSON.stringify(s.buildings.map(b => ({ kind: b.kind, complete: b.complete, delivered: b.delivered, inventory: b.inventory })))}`);
}
function build(s: GameState, kind: Exclude<BuildingKind, 'camp'>, x: number, z: number) {
  const result = place(s, kind, x, z); assert.ok(result.ok, result.reason); return s.buildings.find(b => b.id === result.id)!;
}
function materials(s: GameState) {
  let wood = 0, stone = 0;
  for (const t of s.tiles) { if (t.node === 'tree') wood += t.amount; if (t.node === 'rock') stone += t.amount; }
  for (const b of s.buildings) for (const a of [b.inventory, b.delivered]) { wood += a.wood + a.planks / 2; stone += a.stone; }
  for (const v of s.villagers) if (v.cargo) { if (v.cargo.resource === 'stone') stone += v.cargo.amount; else wood += v.cargo.amount / (v.cargo.resource === 'planks' ? 2 : 1); }
  return { wood, stone };
}

test('deterministic starting world and river block passage', () => {
  const s = createGame(); assert.deepEqual(s, createGame()); assert.equal(s.villagers.length, 10);
  assert.equal(findPath(s, { x: 8, z: 12 }, { x: 17, z: 12 }), null);
  assert.ok(findPath(s, { x: 8, z: 12 }, { x: 7, z: 10 }));
  assert.deepEqual(stock(s), { wood: 18, planks: 4, stone: 12 });
});
test('placement rejects water, occupied tiles, deposits and disconnected east bank', () => {
  const s = createGame();
  for (const [x, z] of [[13, 10], [8, 12], [4, 10], [17, 12], [-1, 3]]) assert.equal(placement(s, 'house', x, z).ok, false);
  assert.equal(placement(s, 'outpost', 7, 10).ok, false);
  assert.equal(placement(s, 'bridge', 7, 10).ok, false);
  assert.equal(placement(s, 'bridge', 14, 12).x, 13);
});
test('construction uses physical deliveries, prevents duplicates and conserves materials', () => {
  const s = createGame(), before = materials(s);
  const house = build(s, 'house', 7, 10);
  assert.deepEqual(stock(s), { wood: 18, planks: 4, stone: 12 }, 'planning alone does not consume stock');
  run(s, 1); assert.ok(s.villagers.some(v => v.task));
  until(s, () => house.complete);
  for (const r of RESOURCES) assert.equal(house.delivered[r], DEFINITIONS.house.cost[r]);
  assert.equal(s.villagers.length, 12);
  assert.deepEqual(materials(s), before);
});
test('simultaneous construction cannot overspend limited plank supplies', () => {
  const s = createGame(), before = materials(s);
  build(s, 'house', 7, 10); build(s, 'house', 9, 10);
  run(s, 100);
  assert.equal(s.buildings.filter(b => b.kind === 'house' && b.complete).length, 1);
  assert.deepEqual(materials(s), before);
  for (const b of s.buildings) for (const r of RESOURCES) assert.ok(b.inventory[r] >= 0 && b.delivered[r] <= DEFINITIONS[b.kind].cost[r]);
});
test('cancel in-flight deliveries returns material without duplication', () => {
  const s = createGame(), before = materials(s), b = build(s, 'house', 11, 16);
  until(s, () => s.villagers.some(v => v.cargo !== null));
  assert.ok(cancelConstruction(s, b.id)); run(s, 50);
  assert.deepEqual(materials(s), before); assert.deepEqual(stock(s), { wood: 18, planks: 4, stone: 12 });
  assert.ok(s.villagers.every(v => !v.task && !v.cargo));
  assert.equal(cancelConstruction(s, 1), false);
});
test('cancel partially delivered construction refunds goods already on site', () => {
  const s = createGame(), before = materials(s), b = build(s, 'bridge', 13, 12);
  until(s, () => b.delivered.planks > 0);
  assert.ok(cancelConstruction(s, b.id)); run(s, 50);
  assert.deepEqual(materials(s), before); assert.deepEqual(stock(s), { wood: 18, planks: 4, stone: 12 });
});
test('save and restore preserve in-flight task reservations and produce identical outcomes', () => {
  const s = createGame(); build(s, 'woodcutter', 7, 10); build(s, 'sawmill', 9, 10);
  run(s, 18); assert.ok(s.villagers.some(v => v.task));
  const restored = deserialize(serialize(s)); assert.deepEqual(restored, s);
  run(s, 60); run(restored, 60); assert.deepEqual(restored, s);
});
test('save validation rejects invalid shapes, resources, ids and task destinations', () => {
  assert.throws(() => deserialize('{}'));
  assert.throws(() => deserialize('not json'));
  const s = createGame(); s.buildings[0].inventory.wood = -1; assert.throws(() => deserialize(serialize(s)));
  const b = createGame(); b.villagers[0].job = 999; assert.throws(() => deserialize(serialize(b)));
  const c = createGame(); c.villagers[0].x = 1000; assert.throws(() => deserialize(serialize(c)));
  const d = createGame(); d.buildings[0].kind = '__proto__' as BuildingKind; assert.throws(() => deserialize(serialize(d)));
});
test('full mission: gather, process, bridge and found an eastern outpost with no cheats', () => {
  const s = createGame(), before = materials(s);
  const woodcutter = build(s, 'woodcutter', 7, 10);
  const sawmill = build(s, 'sawmill', 9, 10);
  const quarry = build(s, 'quarry', 9, 8);
  until(s, () => woodcutter.complete && sawmill.complete && quarry.complete);
  const bridge = build(s, 'bridge', 13, 12);
  until(s, () => bridge.complete, 700);
  assert.ok(findPath(s, { x: 8, z: 12 }, { x: 17, z: 12 }));
  const outpost = build(s, 'outpost', 17, 12);
  until(s, () => outpost.complete, 700);
  assert.equal(s.won, true); assert.ok(s.time < 1200);
  assert.deepEqual(materials(s), before, 'all wood equivalents and stone conserved through gathering, processing and building');
  for (const b of s.buildings) for (const r of RESOURCES) assert.ok(b.inventory[r] >= 0);
  const restored = deserialize(serialize(s)); assert.equal(restored.won, true);
  console.log(`Mission completed normally in ${s.time.toFixed(1)} simulation seconds.`);
});
test('paused producer finishes its task and returns worker to transport', () => {
  const s = createGame(), b = build(s, 'woodcutter', 7, 10);
  until(s, () => s.villagers.some(v => v.job === b.id && v.task));
  b.active = false; run(s, 60);
  assert.ok(s.villagers.every(v => v.job !== b.id));
});
test('roads are free, persist and cannot be placed twice on the same tile', () => {
  const s = createGame(), before = stock(s); assert.ok(place(s, 'road', 7, 11).ok);
  assert.equal(place(s, 'road', 7, 11).ok, false); assert.deepEqual(stock(s), before);
  assert.ok(deserialize(serialize(s)).tiles.find(t => t.x === 7 && t.z === 11)?.road);
});
test('a sawmill built first cannot consume the founding reserve and deadlock the game', () => {
  const s = createGame(), before = materials(s), mill = build(s, 'sawmill', 9, 10);
  until(s, () => mill.complete); run(s, 300);
  assert.ok(stock(s).wood >= 4); assert.ok(stock(s).stone >= 2);
  const logger = build(s, 'woodcutter', 7, 10);
  until(s, () => logger.complete);
  run(s, 30); assert.ok(s.tiles.some(t => t.node === 'tree' && t.amount < 14));
  assert.deepEqual(materials(s), before);
});
test('zero or invalid time steps do not advance the simulation', () => {
  const s = createGame(), before = serialize(s);
  step(s, 0); step(s, -1); step(s, Number.NaN); step(s, Infinity);
  assert.equal(serialize(s), before);
});
