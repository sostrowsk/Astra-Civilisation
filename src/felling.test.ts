import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tileAt, place, step, goods, stock, serialize, deserialize, placement, markTreeForFelling, treeFellingStatus, type GameState } from './sim.ts';
function setup() {
  const s = createGame(42);
  for (const t of s.tiles) Object.assign(t, { kind: 'grass', waterway: null, node: null, amount: 0, sapling: 0 });
  const result = place(s, 'woodcutter', 9, 10); assert.ok(result.ok);
  const hut = s.buildings.find(b => b.id === result.id)!; hut.complete = true; hut.progress = 1;
  s.buildings[0].inventory = goods();
  const worker = s.villagers[0]; worker.job = hut.id; worker.x = 9; worker.z = 10;
  return { s, hut, worker };
}
function tree(s: GameState, x: number, z: number, amount = 8) { const t = tileAt(s, x, z); Object.assign(t, { node: 'tree', amount, road: false }); return t; }
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }

test('marked tree outranks nearer trees until cleared; wood is delivered and building becomes possible', () => {
  const { s, worker } = setup(), near = tree(s, 10, 10), target = tree(s, 13, 10, 5);
  assert.ok(markTreeForFelling(s, target.x, target.z)); step(s, .1);
  assert.deepEqual(worker.task?.node, { x: 13, z: 10 });
  assert.match(treeFellingStatus(s, target), /Alva/);
  for (let i = 0; i < 1500 && target.node; i++) step(s, .1);
  assert.equal(target.node, null); assert.equal(target.priorityFelling, undefined); assert.equal(near.amount, 8);
  assert.ok(s.events.some(e => e.message.includes('13 / 10')));
  s.buildings[0].inventory.planks = 4; s.buildings[0].inventory.stone = 2;
  run(s, 10);
  assert.ok(stock(s).wood >= 5); assert.ok(placement(s, 'house', target.x, target.z).ok);
});

test('marking preserves ongoing work and cancellation restores ordinary target choice', () => {
  const { s, worker } = setup(); tree(s, 10, 10); const far = tree(s, 13, 10);
  step(s, .1); const task = worker.task;
  markTreeForFelling(s, far.x, far.z); assert.equal(worker.task, task);
  for (let i = 0; i < 500 && worker.task === task; i++) step(s, .1);
  step(s, .1); assert.deepEqual(worker.task?.node, { x: 13, z: 10 });
  const other = setup(); tree(other.s, 10, 10); tree(other.s, 13, 10);
  markTreeForFelling(other.s, 13, 10); markTreeForFelling(other.s, 13, 10, false); step(other.s, .1);
  assert.deepEqual(other.worker.task?.node, { x: 10, z: 10 });
});

test('inaccessible and out-of-range priorities do not block reachable ordinary trees', () => {
  const { s, worker } = setup(); tree(s, 10, 10); const blocked = tree(s, 13, 10), far = tree(s, 23, 10);
  for (const [x, z] of [[12, 10], [14, 10], [13, 9], [13, 11]]) tileAt(s, x, z).kind = 'water';
  markTreeForFelling(s, blocked.x, blocked.z); markTreeForFelling(s, far.x, far.z);
  assert.match(treeFellingStatus(s, blocked), /begehbarer Weg/); assert.match(treeFellingStatus(s, far), /Umkreis von 9/);
  step(s, .1); assert.deepEqual(worker.task?.node, { x: 10, z: 10 });
});

test('priority respects paused businesses and full output then resumes with space', () => {
  const { s, hut, worker } = setup(), target = tree(s, 13, 10);
  markTreeForFelling(s, target.x, target.z); hut.active = false;
  assert.match(treeFellingStatus(s, target), /pausiert/); run(s, 1); assert.equal(target.amount, 8);
  hut.active = true; hut.inventory.wood = 20; s.buildings[0].inventory.wood = 100;
  run(s, 1); assert.equal(worker.task, null); assert.match(treeFellingStatus(s, target), /freien Platz/);
  hut.inventory.wood = 18; step(s, .1); assert.deepEqual(s.villagers.find(v => v.id === worker.id)?.task?.node, { x: 13, z: 10 });
});

test('felling priorities survive save/load and reject invalid markers without changing old saves', () => {
  const { s } = setup(); const target = tree(s, 13, 10); markTreeForFelling(s, target.x, target.z);
  const loaded = deserialize(serialize(s)); assert.equal(tileAt(loaded, 13, 10).priorityFelling, true);
  run(s, 10); run(loaded, 10); assert.deepEqual(loaded, s);
  const old = createGame(42); assert.deepEqual(deserialize(serialize(old)), old);
  assert.equal(markTreeForFelling(old, 8, 12), false); assert.equal(markTreeForFelling(old, -999, -999), false);
  const invalid = JSON.parse(serialize(loaded)); invalid.tiles.find((t: {x:number;z:number}) => t.x === 13 && t.z === 10).priorityFelling = 'yes';
  assert.throws(() => deserialize(JSON.stringify(invalid)), /beschädigt/);
});
