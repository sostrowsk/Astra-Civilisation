import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, explore, place, step, goods, serialize, deserialize, stock, tileAt, findPath, syncResidents, demolishBuilding, DEFINITIONS, type GameState, type Tool } from './sim.ts';
import { isMerchant, merchantCapacity, inLocalArea, workerPath } from './logistics.ts';
import { regionId } from './generator.ts';
import { capacity } from './economy.ts';
function setup(level = 3) {
  const s = createGame(42); s.level = level;
  s.buildings[0].inventory = goods(80,80,80); assert.ok(explore(s, regionId(-1,0)).ok);
  for (const t of s.tiles) Object.assign(t, {kind:'grass', node:null, amount:0, sapling:0, waterway:null});
  s.buildings[0].inventory = goods(80,80,80); return s;
}
function build(s: GameState, kind: Tool, x: number, z: number) {
  const p = place(s, kind, x, z); assert.ok(p.ok, p.reason);
  const b = s.buildings.find(b => b.id === p.id)!; b.complete = true; b.progress = 1; return b;
}
function run(s: GameState, seconds: number, check = () => {}) { for (let i=0; i<seconds*10; i++) { step(s,.1); check(); } }
function allGoods(s: GameState) { const result = stock(s); for (const r of Object.keys(result) as (keyof typeof result)[]) result[r] += s.returns?.[r] ?? 0; for (const v of s.villagers) if(v.cargo) result[v.cargo.resource] += v.cargo.amount; return result; }

test('every warehouse has exactly four dedicated traders, no producer jobs, and no duplicate arrivals after load', () => {
  const s=setup(), wh=build(s,'warehouse',10,12); build(s,'quarry',9,10); step(s,.1);
  const traders=s.villagers.filter(isMerchant); assert.equal(traders.length,4); assert.equal(s.villagers.length,14);
  assert.ok(traders.every(v=>v.home===wh.id && v.job===null && !v.mining));
  const copy=deserialize(serialize(s)); run(copy,2); assert.equal(copy.villagers.filter(isMerchant).length,4);
});
test('ordinary residents cannot use a detour outside their local area; traders can', () => {
  const s=setup(), v=s.villagers[0]; v.x=8;v.z=12;
  for(let z=3;z<=21;z++) Object.assign(tileAt(s,9,z),{kind:'water',waterway:'river'});
  const target={x:10,z:12}; assert.ok(findPath(s,v,target)); assert.equal(workerPath(s,v,target),null);
  build(s,'warehouse',7,12); syncResidents(s);
  assert.ok(workerPath(s,s.villagers.find(isMerchant)!,target));
});
test('remote construction waits for traders and local workers never leave their own area', () => {
  const s=setup(); const p=place(s,'outpost',23,12); assert.ok(p.ok);
  const outpost=s.buildings.find(b=>b.id===p.id)!; run(s,8);
  assert.equal(outpost.delivered.wood,0); assert.ok(!outpost.complete);
  build(s,'warehouse',10,12);
  run(s,100,()=>assert.ok(s.villagers.filter(v=>!isMerchant(v)).every(v=>inLocalArea(s,v,v))));
  assert.ok(outpost.complete); assert.deepEqual(deserialize(serialize(s)),s);
});
test('trading upgrades reserve and move 2, 8 and 16 goods while respecting storage limits', () => {
  for (const [level,load] of [[2,2],[3,8],[4,16]]) {
    const s=setup(level); build(s,'outpost',23,12); build(s,'warehouse',10,12);
    s.buildings[0].inventory=goods(80); const before=allGoods(s); step(s,.1);
    const traders=s.villagers.filter(isMerchant); assert.equal(merchantCapacity(s),load);
    assert.ok(traders.some(v=>v.task?.amount===load));
    run(s,50,()=>{for(const b of s.buildings) assert.ok(b.inventory.wood<=capacity(b,'wood'));});
    assert.deepEqual(allGoods(s),before); assert.ok(s.buildings.find(b=>b.kind==='outpost')!.inventory.wood>0);
    const copy=deserialize(serialize(s));run(s,10);run(copy,10);assert.deepEqual(copy,s);
  }
});
test('ordinary carriers do not transfer stock across overlapping settlement borders', () => {
  const s=setup(); const outpost=build(s,'outpost',14,12), logger=build(s,'woodcutter',13,11);
  logger.active=false;logger.inventory.wood=10;s.buildings[0].inventory=goods();
  run(s,10); assert.equal(s.buildings[0].inventory.wood,0);assert.ok(outpost.inventory.wood>0);
});
test('warehouse demolition recovers a full wagon, preserves traders and reuses them on rebuilding', () => {
  const s=setup(4), wh=build(s,'warehouse',10,12), outpost=build(s,'outpost',23,12);syncResidents(s);
  const trader=s.villagers.find(isMerchant)!;trader.cargo={resource:'wood',amount:16};trader.task={kind:'haul',phase:'drop',sourceId:wh.id,destId:outpost.id,resource:'wood',amount:16,path:[],timer:1,vehicle:'coach'};
  const before=allGoods(s);assert.ok(demolishBuilding(s,wh.id).ok);assert.deepEqual(allGoods(s),before);
  run(s,1);assert.equal(trader.task,null);assert.equal(s.villagers.filter(isMerchant).length,4);
  const replacement=build(s,'warehouse',11,12);step(s,.1);assert.equal(s.villagers.filter(isMerchant).length,4);
  assert.ok(s.villagers.filter(isMerchant).every(v=>v.home===replacement.id));assert.deepEqual(deserialize(serialize(s)),s);
});
test('old saves gain homes and traders without losing carried goods or repeating the migration', () => {
  const s=setup(), wh=build(s,'warehouse',10,12); delete s.logisticsVersion;
  for(const v of s.villagers) {delete v.home;delete v.origin;delete v.settlement;}
  s.villagers[0].cargo={resource:'wood',amount:2};s.villagers[0].task={kind:'haul',phase:'drop',sourceId:1,destId:wh.id,resource:'wood',amount:2,path:[],timer:1};
  const before=allGoods(s), loaded=deserialize(serialize(s));assert.deepEqual(allGoods(loaded),before);
  assert.equal(loaded.villagers.filter(isMerchant).length,4);assert.ok(loaded.villagers.every(v=>v.origin));
  assert.deepEqual(deserialize(serialize(loaded)),loaded);
});
test('local houses at an outpost supply nearby production while traders import its ingredients', () => {
  const s=setup(); const outpost=build(s,'outpost',23,12);build(s,'warehouse',10,12);
  const p=place(s,'house',22,12);assert.ok(p.ok);const home=s.buildings.find(b=>b.id===p.id)!;home.delivered={...DEFINITIONS.house.cost};home.progress=.99;
  const mill=build(s,'sawmill',23,13);step(s,.1);assert.ok(home.complete);
  const residents=s.villagers.filter(v=>v.home===home.id);assert.equal(residents.length,2);assert.ok(residents.every(v=>v.settlement===outpost.id));
  run(s,100);assert.ok(s.villagers.some(v=>v.job===mill.id && v.home===home.id));
  assert.ok(mill.inventory.planks>0 || s.economy!.buckets.some(b=>b.produced.planks>0));
});
test('each warehouse dispatches only one cart and one coach, reserved until the return journey finishes', () => {
  const s=setup(4);build(s,'outpost',23,12);const wh=build(s,'warehouse',10,12);s.buildings[0].inventory=goods(100);
  step(s,.1);const crew=s.villagers.filter(isMerchant);
  assert.equal(crew.filter(v=>v.task?.vehicle==='coach').length,1);
  assert.equal(crew.filter(v=>v.task?.vehicle==='cart').length,1);
  assert.equal(crew.filter(v=>v.task && !v.task.vehicle).length,2);
  const coach=crew.find(v=>v.task?.vehicle==='coach')!;
  for(let i=0;i<600 && coach.task?.kind!=='return';i++) step(s,.1);
  assert.equal(coach.task?.kind,'return');assert.equal(coach.task.vehicle,'coach');
  const copy=deserialize(serialize(s));assert.deepEqual(copy,s);
  for(let i=0;i<600 && coach.task?.kind==='return';i++) {
    assert.ok(crew.filter(v=>v.task?.vehicle==='coach').length<=1);
    assert.ok(crew.filter(v=>v.task?.vehicle==='cart').length<=1); step(s,.1);
  }
  assert.equal(coach.x,wh.x);assert.equal(coach.z,wh.z);assert.equal(coach.task,null);
  const bad=deserialize(serialize(copy)), a=bad.villagers.filter(isMerchant);
  a[1].task={...a[0].task!,vehicle:'coach'};
  assert.throws(()=>deserialize(serialize(bad)), 'duplicate vehicle reservation is rejected');
});
test('demolishing a trader home cancels trips between two other depots and preserves their wagon load', () => {
  const s=setup(4), home=build(s,'warehouse',10,12), dest=build(s,'outpost',23,12);syncResidents(s);
  const v=s.villagers.find(isMerchant)!;v.cargo={resource:'wood',amount:16};
  v.task={kind:'haul',phase:'drop',sourceId:1,destId:dest.id,resource:'wood',amount:16,path:[],timer:1,vehicle:'coach'};
  const before=allGoods(s);assert.ok(demolishBuilding(s,home.id).ok);assert.equal(v.task,null);assert.equal(v.home,undefined);
  assert.deepEqual(allGoods(s),before);assert.deepEqual(deserialize(serialize(s)),s);
});
test('trader homes and origin areas remain saveable after every settlement center is demolished', () => {
  const s=setup(4);const wh=build(s,'warehouse',10,12);syncResidents(s);
  assert.ok(demolishBuilding(s,1).ok);assert.ok(demolishBuilding(s,wh.id).ok);
  build(s,'warehouse',11,12);syncResidents(s);
  assert.deepEqual(deserialize(serialize(s)),s);run(s,1);assert.deepEqual(deserialize(serialize(s)),s);
});
