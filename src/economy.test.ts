import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, setProductionRecipe, productionChoice, place, step, stock, goods, serialize, deserialize, cancelConstruction, DEFINITIONS, RESOURCES, type GameState, type Tool, type Building } from './sim.ts';
import { capacity, roomFor, economyRows, recordFlow, useEquipment } from './economy.ts';
import { undergroundAt, revealCave } from './mining.ts';
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function setup() { const s = createGame(42); s.level = 5; for (const t of s.tiles) Object.assign(t, { kind: 'grass', node: null, amount: 0, sapling: 0, waterway: null }); s.buildings[0].inventory = goods(); return s; }
function build(s: GameState, kind: Tool, x: number, z: number) { const result = place(s, kind, x, z); assert.ok(result.ok, result.reason); const b = s.buildings.find(n => n.id === result.id)!; b.delivered = { ...DEFINITIONS[b.kind].cost }; b.progress = .999; b.active = false; step(s, .1); b.active = true; return b; }
function count(s: GameState, r: keyof ReturnType<typeof goods>) { return stock(s)[r] + s.villagers.reduce((n, v) => n + (v.cargo?.resource === r ? v.cargo.amount : 0), 0) + (s.returns?.[r] ?? 0); }

test('concurrent carriers reserve the last warehouse space and use the next available store', () => {
  const s = setup(), mine = build(s, 'mine', 10, 10); mine.active = false; const other = build(s, 'warehouse', 15, 15); mine.inventory.stone = 40; s.buildings[0].inventory.stone = 99;
  const before = count(s, 'stone');
  for (let i = 0; i < 600; i++) { step(s, .1); for (const b of [s.buildings[0], other, mine]) assert.ok(b.inventory.stone <= capacity(b, 'stone')); }
  assert.equal(s.buildings[0].inventory.stone, 100); assert.ok(other.inventory.stone > 0); assert.equal(count(s, 'stone'), before);
});

test('full stores stop new gather orders and resumed production fits output capacity', () => {
  const s = setup(), b = build(s, 'farm', 10, 10); s.buildings[0].inventory.food = 100; b.inventory.food = 19;
  run(s, 30); assert.equal(b.inventory.food, 19); assert.equal(s.villagers.filter(v => v.job === b.id && v.task).length, 0);
  s.buildings[0].inventory.food -= 2; run(s, 50); assert.ok(b.inventory.food <= 20); assert.ok(s.buildings[0].inventory.food <= 100); assert.ok(count(s, 'food') >= 119);
});

test('workshop uses local ingredients and manufactures tools rather than specialist equipment', () => {
  const s = setup(), b = build(s, 'workshop', 10, 10); b.inventory.stone = 2; b.inventory.planks = 2;
  assert.equal(capacity(b, 'stone'), 10); assert.equal(capacity(b, 'planks'), 10);
  run(s, 50); assert.equal(stock(s).tools, 2); assert.equal(stock(s).stone, 0); assert.equal(stock(s).planks, 0); assert.equal(stock(s).shears, 0);
});

test('sheep, weaver and tailor deliver an actual food-to-clothing chain with finite shears', () => {
  const s = setup(); s.level = 3; s.buildings[0].inventory.food = 3; s.buildings[0].inventory.shears = 1;
  build(s, 'sheepfold', 9, 10); build(s, 'weaver', 10, 10); const tailor = build(s, 'tailor', 11, 10);
  run(s, 240); assert.equal(stock(s).clothes, 6); assert.equal(stock(s).food, 0); assert.equal(stock(s).wool, 0); assert.equal(stock(s).cloth, 0); assert.equal(stock(s).shears, 0); assert.equal(tailor.equipmentUses, 14);
  const copy = deserialize(serialize(s)); run(s, 15); run(copy, 15); assert.deepEqual(copy, s);
});

test('tailoring waits for shears, consumes one per 20 cycles and retains garments', () => {
  const s = setup(), b = build(s, 'tailor', 10, 10); s.buildings[0].inventory.cloth = 25;
  run(s, 20); assert.equal(stock(s).clothes, 0);
  s.buildings[0].inventory.shears = 1; run(s, 400);
  assert.equal(stock(s).clothes, 20); assert.equal(b.equipmentUses, 0); assert.equal(count(s, 'cloth'), 5);
});

test('drills accelerate a mining cycle and wear is charged once per cycle', () => {
  const durations: number[] = [];
  for (const equipped of [false, true]) {
    const s = setup(), mine = build(s, 'mine', 10, 10); mine.autoMine = false;
    // Remove the fixture's automatic initial trip before scheduling the marked target.
    for (const v of s.villagers) { v.task = null; v.mining = null; v.depth = 0; v.x = mine.x; v.z = mine.z; }
    const t = undergroundAt(s, 11, 10, 1)!; Object.assign(t, { revealed: true, solid: true, ore: 'ironOre', amount: 8, order: mine.id }); revealCave(s, mine, 1);
    if (equipped) mine.inventory.drill = 1;
    for (let i = 0; i < 20; i++) { step(s, .1); const worker = s.villagers.find(v => v.mining?.stage === 'work'); if (worker) { durations.push(worker.mining!.timer); break; } }
    assert.equal(mine.equipmentUses ?? 0, equipped ? 39 : 0);
  }
  assert.equal(durations.length, 2); assert.ok(Math.abs(durations[1] * 1.5 - durations[0]) < .001);
});

test('metal manufacturing makes wire, gears and useful machine parts', () => {
  const s = setup(); s.buildings[0].inventory.copper = 1; s.buildings[0].inventory.iron = 1;
  const wire = build(s, 'manufactory', 9, 10), gears = build(s, 'manufactory', 10, 10), parts = build(s, 'manufactory', 11, 10);
  gears.manufacture = 'gears'; parts.manufacture = 'machineParts';
  run(s, 150); assert.equal(stock(s).machineParts, 2); assert.equal(stock(s).wire, 0); assert.equal(stock(s).gears, 0); assert.equal(stock(s).copper, 0); assert.equal(stock(s).iron, 0);
  const farm = build(s, 'farm', 12, 10); run(s, 50); assert.ok((farm.equipmentUses ?? 0) > 0); assert.ok(stock(s).machineParts < 2); assert.ok(wire.complete);
});

test('higher priority reassigns a busy worker only after finishing its task', () => {
  const s = setup();
  const buildings: Building[] = []; for (let i = 0; i < 8; i++) buildings.push(build(s, 'woodcutter', 4 + i, 8));
  const target = build(s, 'workshop', 10, 10); target.priority = 2;
  for (const [i, v] of s.villagers.entries()) { v.job = i < 8 ? buildings[i].id : null; v.task = { kind: 'haul', phase: 'drop', destId: 1, resource: 'wood', amount: 1, path: [], timer: 2 }; }
  step(s, .1); assert.ok(!s.villagers.some(v => v.job === target.id)); run(s, 5);
  assert.ok(s.villagers.some(v => v.job === target.id)); assert.equal(s.villagers.filter(v => v.job === null).length, 2);
});

test('full warehouse refunds wait separately and are restored without losses when space opens', () => {
  const s = setup(); s.buildings[0].inventory.wood = 100; const result = place(s, 'house', 10, 10); const b = s.buildings.find(b => b.id === result.id)!; b.delivered.wood = 3;
  assert.ok(cancelConstruction(s, b.id)); assert.equal(s.buildings[0].inventory.wood, 100); assert.equal(s.returns?.wood, 3);
  s.buildings[0].inventory.wood -= 2; step(s, .1); assert.equal(s.buildings[0].inventory.wood, 100); assert.equal(s.returns?.wood, 1);
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('dashboard measures production and consumption, not transport, and expires old observations', () => {
  const s = setup(); s.time = 60;
  recordFlow(s, 'produced', 'stone', 10); recordFlow(s, 'consumed', 'stone', 4);
  let row = economyRows(s).find(r => r.resource === 'stone')!; assert.equal(row.produced, 10); assert.equal(row.consumed, 4); assert.equal(row.balance, 6);
  const mine = build(s, 'mine', 10, 10); mine.active = false; mine.inventory.stone = 10; const before = s.economy!.buckets.reduce((n, b) => n + b.produced.stone, 0); run(s, 30);
  assert.equal(s.economy!.buckets.reduce((n, b) => n + b.produced.stone, 0), before);
  s.time = 400; row = economyRows(s).find(r => r.resource === 'stone')!; assert.equal(row.produced, 0); assert.equal(row.consumed, 0);
});

test('legacy saves migrate once, remove excess and retain the reached civilisation', () => {
  for (const [oldLevel, newLevel] of [[2, 2], [3, 4], [4, 4]]) {
    const s = setup(); s.level = oldLevel; const raw = JSON.parse(serialize(s)); delete raw.economyVersion; delete raw.economy; delete raw.returns; raw.buildings[0].inventory.stone = 999;
    for (const a of [raw.buildings[0].inventory, raw.buildings[0].delivered]) for (const r of ['shears', 'drill', 'wool', 'cloth', 'clothes', 'wire', 'gears', 'machineParts']) delete a[r];
    const migrated = deserialize(JSON.stringify(raw)); assert.equal(migrated.level, newLevel); assert.equal(migrated.buildings[0].inventory.stone, 100); assert.equal(migrated.economyVersion, 2); assert.deepEqual(deserialize(serialize(migrated)), migrated);
  }
});


test('dashboard displays a dash without activity and balanced only for equal actual flows', () => {
  const s = setup(); s.time = 60;
  assert.equal(economyRows(s).find(r => r.resource === 'stone')!.status, '-');
  recordFlow(s, 'produced', 'stone', 5); recordFlow(s, 'consumed', 'stone', 5);
  assert.equal(economyRows(s).find(r => r.resource === 'stone')!.status, 'Ausgeglichen');
});


test('legacy in-flight deliveries are rescheduled instead of overbooking a full warehouse', () => {
  const s = setup(); s.buildings[0].inventory.stone = 500;
  for (const v of s.villagers) { v.cargo = { resource: 'stone', amount: 2 }; v.task = { kind: 'haul', phase: 'drop', destId: 1, resource: 'stone', amount: 2, path: [], timer: 0 }; }
  const raw = JSON.parse(serialize(s)); delete raw.economyVersion;
  const migrated = deserialize(JSON.stringify(raw)); assert.equal(migrated.buildings[0].inventory.stone, 100); assert.equal(migrated.returns!.stone, 20); assert.ok(migrated.villagers.every(v => !v.task && !v.cargo));
  migrated.buildings[0].inventory.stone = 90; step(migrated, .1); assert.equal(migrated.buildings[0].inventory.stone, 100); assert.equal(migrated.returns!.stone, 10);
});


test('switching a busy smelter preserves the iron batch then makes copper and survives save/load', () => {
  const s = setup(), b = build(s, 'smelter', 10, 10);
  Object.assign(b.inventory, {ironOre:1, copperOre:1, coal:2});
  for (let i=0; i<300 && !s.villagers.some(v=>v.job===b.id && v.task?.kind==='craft'); i++) step(s,.1);
  assert.ok(s.villagers.some(v=>v.job===b.id && v.task?.kind==='craft'));
  assert.ok(setProductionRecipe(s,b,'copper')); assert.equal(productionChoice(b),'iron'); assert.equal(b.pendingRecipe,'copper');
  const copy = deserialize(serialize(s)); run(s,90); run(copy,90); assert.deepEqual(copy,s);
  assert.equal(count(s,'iron'),1); assert.equal(count(s,'copper'),1);
  assert.equal(count(s,'ironOre'),0); assert.equal(count(s,'copperOre'),0); assert.equal(count(s,'coal'),0);
  assert.equal(productionChoice(b),'copper'); assert.equal(b.pendingRecipe,undefined);
});

test('queued changes preserve output and batch size in academy, forge and manufactory', () => {
  for (const kind of ['academy','forge','manufactory'] as const) {
    const s=setup(), b=build(s,kind,10,10);
    const first = kind==='academy' ? 'copper' : kind==='forge' ? 'shears' : 'gears';
    const next = kind==='academy' ? 'gold' : kind==='forge' ? 'drill' : 'wire';
    assert.ok(setProductionRecipe(s,b,first));
    Object.assign(b.inventory, kind==='academy' ? {copper:1} : kind==='forge' ? {iron:1,tools:1} : {iron:1});
    for(let i=0;i<300 && !s.villagers.some(v=>v.job===b.id && v.task?.kind==='craft');i++) step(s,.1);
    assert.ok(s.villagers.some(v=>v.job===b.id && v.task?.kind==='craft'));
    assert.ok(setProductionRecipe(s,b,next)); run(s,80);
    assert.equal(count(s,kind==='academy' ? 'knowledge' : first),kind==='academy' ? 6 : kind==='forge' ? 1 : 2);
    if(kind!=='academy') assert.equal(count(s,next),0);
    assert.equal(productionChoice(b),next); assert.equal(b.pendingRecipe,undefined);
  }
});

test('recipe selection during ingredient transport can be replaced, cancelled, saved and validated', () => {
  const s=setup(), b=build(s,'smelter',10,10); s.buildings[0].inventory.ironOre=1;
  for(let i=0;i<300 && !s.villagers.some(v=>v.job===b.id && v.task?.kind==='haul');i++) step(s,.1);
  assert.ok(s.villagers.some(v=>v.job===b.id && v.task?.kind==='haul'));
  assert.ok(setProductionRecipe(s,b,'copper')); assert.equal(b.pendingRecipe,'copper');
  assert.ok(setProductionRecipe(s,b,'iron')); assert.equal(b.pendingRecipe,undefined);
  assert.ok(setProductionRecipe(s,b,'copper')); assert.ok(setProductionRecipe(s,b,'gold')); assert.equal(b.pendingRecipe,'gold');
  assert.equal(setProductionRecipe(s,b,'diamond'),false); assert.equal(b.pendingRecipe,'gold');
  const copy=deserialize(serialize(s)); run(s,40); run(copy,40); assert.deepEqual(copy,s);
  assert.equal(productionChoice(b),'gold'); assert.equal(count(s,'ironOre'),1); assert.equal(count(s,'gold'),0);
  const bad=deserialize(serialize(s));bad.buildings.find(n=>n.id===b.id)!.pendingRecipe='diamond';
  assert.throws(()=>deserialize(serialize(bad)));
});
