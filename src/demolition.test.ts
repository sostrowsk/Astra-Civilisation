import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, goods, place, step, tileAt, stock, demolitionCheck, demolishBuilding, housingCapacity, serialize, deserialize, placement, type GameState, type Tool } from './sim.ts';
import { openMine } from './mining.ts';
function setup() {
  const s = createGame(42); s.level = 5;
  for (const t of s.tiles) Object.assign(t, { kind: 'grass', node: null, amount: 0, sapling: 0, waterway: null });
  s.buildings[0].inventory = goods(100, 100, 100);
  return s;
}
function build(s: GameState, kind: Tool, x: number, z: number) {
  const result = place(s, kind, x, z); assert.ok(result.ok, result.reason);
  const b = s.buildings.find(n => n.id === result.id)!; b.complete = true; b.progress = 1;
  if (b.kind === 'mine') openMine(s, b);
  return b;
}
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function total(s: GameState, r: 'wood' | 'stone' | 'tools') { return stock(s)[r] + (s.returns?.[r] ?? 0) + s.villagers.reduce((n, v) => n + (v.cargo?.resource === r ? v.cargo.amount : 0), 0); }

test('house demolition frees the same tile for a new building without losing residents or refunding building cost', () => {
  const s = setup(), house = build(s, 'house', 10, 10), before = stock(s), people = s.villagers.length;
  assert.equal(housingCapacity(s), 12); assert.ok(demolishBuilding(s, house.id).ok);
  assert.equal(housingCapacity(s), 10); assert.equal(s.villagers.length, people); assert.deepEqual(stock(s), before);
  assert.ok(placement(s, 'warehouse', 10, 10).ok); assert.ok(place(s, 'warehouse', 10, 10).ok);
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('warehouse demolition preserves inventory and cargo exactly once, clears references, and respects remaining capacity', () => {
  const s = setup(), store = build(s, 'warehouse', 10, 10); store.inventory.wood = 40;
  s.villagers[0].task = {kind:'haul', phase:'drop', sourceId:store.id, destId:1, resource:'wood', amount:2, path:[], timer:0}; s.villagers[0].cargo = {resource:'wood', amount:2};
  s.villagers[1].task = {kind:'haul', phase:'pickup', sourceId:store.id, destId:1, resource:'wood', amount:2, path:[], timer:0};
  s.villagers[2].task = {kind:'haul', phase:'drop', sourceId:1, destId:store.id, resource:'stone', amount:2, path:[], timer:0}; s.villagers[2].cargo = {resource:'stone', amount:2};
  const wood = total(s, 'wood'), stone = total(s, 'stone');
  assert.ok(demolishBuilding(s, store.id).ok); assert.equal(total(s, 'wood'), wood); assert.equal(total(s, 'stone'), stone);
  assert.equal(s.buildings[0].inventory.wood, 100); assert.equal(s.returns!.wood, 42); assert.equal(s.returns!.stone, 2);
  assert.ok(s.villagers.slice(0, 3).every(v => !v.task && !v.cargo));
  assert.equal(demolishBuilding(s, store.id).ok, false); assert.equal(total(s, 'wood'), wood);
  const loaded = deserialize(serialize(s)); run(s, 5); run(loaded, 5); assert.deepEqual(s, loaded);
});
test('demolition releases workers and removes mining-house references without deleting inhabitants', () => {
  const s = setup(), home = build(s, 'miningHouse', 10, 10), workshop = build(s, 'workshop', 11, 10);
  s.villagers[0].home = home.id; s.villagers[0].job = workshop.id;
  workshop.inventory.tools = 3;
  s.villagers[0].task = {kind:'craft', phase:'work', destId:workshop.id, resource:'tools', amount:1, timer:4, path:[]};
  assert.ok(demolishBuilding(s, home.id).ok); assert.equal(s.villagers[0].home, undefined); assert.equal(s.villagers.length, 10);
  assert.ok(demolishBuilding(s, workshop.id).ok); assert.equal(s.villagers[0].job, null); assert.equal(s.villagers[0].task, null);
  assert.equal(total(s, 'tools'), 3); assert.deepEqual(deserialize(serialize(s)), s);
});
test('mine must finish its crews first and demolition clears orders while retaining explored caves', () => {
  const s = setup(), mine = build(s, 'mine', 10, 10); run(s, 2);
  assert.ok(s.villagers.some(v => v.mining?.mineId === mine.id));
  assert.equal(demolishBuilding(s, mine.id).ok, false); mine.active = false;
  run(s, 100); assert.ok(!s.villagers.some(v => v.mining));
  const cells = s.underground.length; s.underground.find(t => t.solid)!.order = mine.id;
  assert.ok(demolishBuilding(s, mine.id).ok); assert.equal(s.underground.length, cells);
  assert.ok(s.underground.every(t => t.order !== mine.id)); assert.deepEqual(deserialize(serialize(s)), s);
});
test('bridges cannot cut off buildings or workers, but an unused redundant bridge can be removed', () => {
  const s = setup();
  for (let z = 0; z < 24; z++) Object.assign(tileAt(s, 12, z), {kind:'water', waterway:'river'});
  const bridge = build(s, 'bridge', 12, 12); build(s, 'house', 14, 12);
  assert.equal(demolitionCheck(s, bridge.id).ok, false);
  build(s, 'bridge', 12, 13);
  const v = s.villagers[0]; v.x = 12; v.z = 12; assert.equal(demolitionCheck(s, bridge.id).ok, false);
  v.x = 11; assert.ok(demolishBuilding(s, bridge.id).ok);
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('founding camp and unfinished construction use their existing protection/cancellation rules', () => {
  const s = setup(), before = serialize(s); assert.equal(demolishBuilding(s, 1).ok, false); assert.equal(serialize(s), before);
  const result = place(s, 'house', 10, 10); assert.ok(result.ok); assert.equal(demolishBuilding(s, result.id!).ok, false);
});
