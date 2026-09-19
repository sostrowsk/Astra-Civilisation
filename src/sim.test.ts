import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, place, placement, step, cancelConstruction, stock, serialize, deserialize, RESOURCES, DEFINITIONS, goods, type GameState, type BuildingKind } from './sim.ts';
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function until(s: GameState, done: () => boolean, seconds = 500) { for (let i = 0; i < seconds * 10; i++) { if (done()) return; step(s, .1); } assert.ok(done(), `Timed out at ${s.time}`); }
function build(s: GameState, kind: Exclude<BuildingKind, 'camp'>, x: number, z: number) { const result = place(s, kind, x, z); assert.ok(result.ok, result.reason); return s.buildings.find(b => b.id === result.id)!; }
function materials(s: GameState) {
  let wood = 0, stone = 0;
  for (const t of s.tiles) { if (t.node === 'tree') wood += t.amount; if (t.node === 'rock') stone += t.amount; }
  for (const b of s.buildings) for (const a of [b.inventory, b.delivered]) { wood += a.wood + a.planks / 2; stone += a.stone; }
  for (const v of s.villagers) if (v.cargo) { if (v.cargo.resource === 'stone') stone += v.cargo.amount; else wood += v.cargo.amount / (v.cargo.resource === 'planks' ? 2 : 1); }
  return { wood: wood - s.woodGrown, stone };
}
test('construction delivers materials physically and conserves resources', () => {
  const s = createGame(42), before = materials(s), house = build(s, 'house', 7, 10);
  assert.deepEqual(stock(s), goods(18, 4, 12)); run(s, 1); assert.ok(s.villagers.some(v => v.task)); until(s, () => house.complete);
  for (const r of RESOURCES) assert.equal(house.delivered[r], DEFINITIONS.house.cost[r]);
  assert.equal(s.villagers.length, 12); assert.deepEqual(materials(s), before);
});
test('simultaneous construction cannot overspend supplies', () => {
  const s = createGame(42), before = materials(s); build(s, 'house', 7, 10); build(s, 'house', 9, 10); run(s, 100);
  assert.equal(s.buildings.filter(b => b.kind === 'house' && b.complete).length, 1); assert.deepEqual(materials(s), before);
  for (const b of s.buildings) for (const r of RESOURCES) assert.ok(b.inventory[r] >= 0 && b.delivered[r] <= DEFINITIONS[b.kind].cost[r]);
});
test('cancelling in-flight and partially delivered construction refunds without duplication', () => {
  for (const partial of [false, true]) {
    const s = createGame(42), before = materials(s), b = build(s, 'house', 11, 16);
    until(s, () => partial ? b.delivered.wood > 0 : s.villagers.some(v => v.cargo !== null));
    assert.ok(cancelConstruction(s, b.id)); run(s, 50); assert.deepEqual(materials(s), before); assert.deepEqual(stock(s), goods(18, 4, 12));
  }
});
test('save restore preserves tasks and deterministic simulation', () => {
  const s = createGame(42); build(s, 'woodcutter', 7, 10); build(s, 'sawmill', 9, 10); run(s, 18);
  const restored = deserialize(serialize(s)); assert.deepEqual(restored, s); run(s, 60); run(restored, 60); assert.deepEqual(restored, s);
});
test('validation rejects corrupt resources, ids, positions, old versions and jobs', () => {
  for (const change of [(s: GameState) => s.buildings[0].inventory.wood = -1, (s: GameState) => s.villagers[0].job = 999, (s: GameState) => s.villagers[0].x = 1000, (s: GameState) => s.buildings[0].kind = '__proto__' as BuildingKind]) {
    const s = createGame(42); change(s); assert.throws(() => deserialize(serialize(s)));
  }
  assert.throws(() => deserialize('{}')); assert.throws(() => deserialize('not json'));
  assert.throws(() => deserialize(serialize(createGame(42)).replace('"version":3', '"version":2')));
});
test('opening economy and outpost complete with no cheats', () => {
  const s = createGame(42), before = materials(s);
  const logger = build(s, 'woodcutter', 7, 10), sawmill = build(s, 'sawmill', 9, 10), quarry = build(s, 'quarry', 9, 8);
  until(s, () => logger.complete && sawmill.complete && quarry.complete);
  const post = build(s, 'outpost', 11, 9); until(s, () => post.complete, 900);
  assert.ok(s.won); assert.deepEqual(materials(s), before); assert.equal(deserialize(serialize(s)).won, true);
});
test('paused producer finishes and returns worker to transport', () => {
  const s = createGame(42), b = build(s, 'woodcutter', 7, 10); until(s, () => s.villagers.some(v => v.job === b.id && v.task)); b.active = false; run(s, 60); assert.ok(s.villagers.every(v => v.job !== b.id));
});
test('roads cost nothing and placement protects occupied, missing and deposit tiles', () => {
  const s = createGame(42), before = stock(s); assert.ok(place(s, 'road', 7, 11).ok); assert.equal(place(s, 'road', 7, 11).ok, false); assert.deepEqual(stock(s), before);
  for (const [x, z] of [[8, 12], [4, 10], [-100, 0]]) assert.equal(placement(s, 'house', x, z).ok, false);
});
test('sawmill first preserves woodcutter founding reserve', () => {
  const s = createGame(42), before = materials(s), mill = build(s, 'sawmill', 9, 10); until(s, () => mill.complete); run(s, 200); assert.ok(stock(s).wood >= 4);
  const logger = build(s, 'woodcutter', 7, 10); until(s, () => logger.complete); run(s, 30); assert.deepEqual(materials(s), before);
});
test('invalid time increments do not change game', () => { const s = createGame(42), before = serialize(s); for (const dt of [0, -1, NaN, Infinity]) step(s, dt); assert.equal(serialize(s), before); });
