import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, explore, goods, place, step, tileAt, stock, demolitionCheck, demolishBuilding, housingCapacity, cancelConstruction, serialize, deserialize, placement, type GameState, type Tool, DEFINITIONS, walkable } from './sim.ts';
import { regionId } from './generator.ts';
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
test('active mine demolition returns miners and their cargo immediately while retaining caves', () => {
  const s = setup(), mine = build(s, 'mine', 10, 10); run(s, 2);
  const miner = s.villagers.find(v => v.mining?.mineId === mine.id)!; assert.ok(miner);
  miner.depth = 1; miner.cargo = {resource:'stone', amount:2};
  const stone = total(s, 'stone'), cells = s.underground.length;
  s.underground.find(t => t.solid)!.order = mine.id;
  assert.ok(demolishBuilding(s, mine.id).ok);
  assert.equal(total(s, 'stone'), stone); assert.equal(miner.depth, 0); assert.equal(miner.mining, null);
  assert.equal(miner.x, mine.x); assert.equal(miner.z, mine.z); assert.equal(miner.job, null);
  assert.equal(s.underground.length, cells); assert.ok(s.underground.every(t => t.order !== mine.id));
  assert.deepEqual(deserialize(serialize(s)), s); run(s, 5);
});
test('even the only occupied bridge can be removed, rescuing residents and cancelling severed transports', () => {
  const s = setup();
  for (let z = 0; z < 24; z++) Object.assign(tileAt(s, 12, z), {kind:'water', waterway:'river'});
  const bridge = build(s, 'bridge', 12, 12), store = build(s, 'warehouse', 14, 12);
  const v = s.villagers[0]; v.x = 12; v.z = 12;
  const carrier = s.villagers[1]; carrier.x = 11; carrier.z = 12;
  carrier.task = {kind:'haul', phase:'drop', sourceId:1, destId:store.id, resource:'wood', amount:2, path:[{x:12,z:12},{x:13,z:12},{x:14,z:12}], timer:0};
  carrier.cargo = {resource:'wood', amount:2}; const wood = total(s, 'wood');
  assert.ok(demolitionCheck(s, bridge.id).ok); assert.ok(demolishBuilding(s, bridge.id).ok);
  assert.ok(walkable(s, v.x, v.z)); assert.equal(carrier.task, null); assert.equal(carrier.cargo, null);
  assert.equal(total(s, 'wood'), wood); assert.ok(placement(s, 'bridge', 12, 12).ok);
  assert.deepEqual(deserialize(serialize(s)), s); run(s, 5);
});
test('demolishing the last building preserves stock and permits a fresh camp at another location', () => {
  const s = setup(), before = stock(s);
  assert.equal(place(s, 'camp', 10, 10).ok, false, 'only one camp may exist');
  assert.ok(demolishBuilding(s, 1).ok); assert.equal(s.buildings.length, 0);
  assert.deepEqual(s.returns, before); assert.equal(housingCapacity(s), 0);
  const restored = deserialize(serialize(s)); run(restored, 25); assert.equal(restored.villagers.length, 10);
  assert.ok(place(restored, 'camp', 10, 10).ok); run(restored, 10);
  assert.ok(restored.buildings[0].complete); assert.deepEqual(stock(restored), before);
  assert.equal(housingCapacity(restored), 10); assert.ok(placement(restored, 'warehouse', 8, 12).ok);
  assert.deepEqual(deserialize(serialize(restored)), restored);
});
test('every finished building kind can be demolished, saved and replaced on its tile', () => {
  for (const kind of Object.keys(DEFINITIONS) as Exclude<Tool, 'road'>[]) {
    const s = setup();
    if (kind === 'outpost') assert.ok(explore(s, regionId(-1,0)).ok);
    if (kind === 'camp') { assert.ok(demolishBuilding(s, 1).ok); }
    if (kind === 'bridge') Object.assign(tileAt(s, 10, 10), {kind:'water', waterway:'river'});
    const b = build(s, kind, kind === 'outpost' ? 15 : 10, 10);
    assert.ok(demolishBuilding(s, b.id).ok, kind);
    assert.ok(placement(s, kind === 'bridge' ? 'bridge' : 'warehouse', b.x, b.z).ok, kind);
    assert.deepEqual(deserialize(serialize(s)), s); run(s, 1);
  }
});
test('construction cancellation without any storage retains material for a future camp', () => {
  const s = setup(); assert.ok(demolishBuilding(s, 1).ok);
  const result = place(s, 'house', 10, 10); assert.ok(result.ok);
  const b = s.buildings.find(b => b.id === result.id)!; b.delivered.wood = 3;
  assert.equal(demolishBuilding(s, b.id).ok, false);
  const before = s.returns!.wood; assert.ok(cancelConstruction(s, b.id)); assert.equal(s.returns!.wood, before + 3);
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('bridge demolition reroutes deliveries over a remaining crossing without losing cargo', () => {
  const s = setup();
  for (let z = 0; z < 24; z++) Object.assign(tileAt(s, 12, z), {kind:'water', waterway:'river'});
  const bridge = build(s, 'bridge', 12, 12); build(s, 'bridge', 12, 13);
  const store = build(s, 'warehouse', 14, 12), v = s.villagers[0]; v.x = 11; v.z = 12;
  v.task = {kind:'haul', phase:'drop', sourceId:1, destId:store.id, resource:'wood', amount:2, path:[{x:12,z:12},{x:13,z:12},{x:14,z:12}], timer:0};
  v.cargo = {resource:'wood', amount:2}; const wood = total(s, 'wood');
  assert.ok(demolishBuilding(s, bridge.id).ok);
  assert.ok(v.task!.path.some(p => p.x === 12 && p.z === 13));
  assert.ok(!v.task!.path.some(p => p.x === 12 && p.z === 12)); assert.equal(v.cargo?.amount, 2);
  run(s, 8); assert.equal(store.inventory.wood, 2); assert.equal(total(s, 'wood'), wood);
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('bridge demolition releases miners whose surface approach is cut off', () => {
  const s = setup();
  for (let z = 0; z < 24; z++) Object.assign(tileAt(s, 12, z), {kind:'water', waterway:'river'});
  const bridge = build(s, 'bridge', 12, 12), mine = build(s, 'mine', 14, 12);
  const v = s.villagers[0]; v.x = 11; v.z = 12; v.job = mine.id;
  v.mining = {mineId:mine.id, depth:1, target:{x:14,z:12}, stage:'approach', path:[{x:12,z:12},{x:13,z:12},{x:14,z:12}], timer:0};
  assert.ok(demolishBuilding(s, bridge.id).ok); assert.equal(v.mining, null); assert.equal(v.job, null);
  assert.deepEqual(deserialize(serialize(s)), s); run(s, 2);
});
