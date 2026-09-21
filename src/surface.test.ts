import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tileAt, place, step, goods, stock, serialize, deserialize, placement, regrowForest, BIOMES, markStoneForQuarrying, type GameState } from './sim.ts';
import { treeGrowthStage, excavationCheck, orderExcavation, pitResource, surfaceHeight } from './surface.ts';
function setup() {
  const s = createGame(42);
  for (const t of s.tiles) Object.assign(t, { kind: 'grass', waterway: null, node: null, amount: 0, sapling: 0 });
  const result = place(s, 'quarry', 9, 10); assert.ok(result.ok);
  const b = s.buildings.find(b => b.id === result.id)!; b.complete = true; b.progress = 1;
  s.buildings[0].inventory = goods(); s.villagers[0].job = b.id; s.villagers[0].x = 9; s.villagers[0].z = 10;
  return { s, b };
}
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function excavated(s: GameState, x: number, z: number, depth: number) { tileAt(s, x, z).excavation = { depth, remaining: 0, ordered: false }; }

test('five visible young growth stages remain buildable; mature tree alone blocks building', () => {
  const { s } = setup(), t = tileAt(s, 14, 12); s.buildings[0].inventory = goods(100, 100, 100); t.biome = 'meadow';
  for (let stage = 1; stage <= 5; stage++) {
    t.sapling = 1 + (stage - 1) * BIOMES.meadow.growth / 5;
    assert.equal(treeGrowthStage(t), stage); assert.ok(placement(s, 'house', t.x, t.z).ok);
  }
  t.sapling = BIOMES.meadow.growth - 1; regrowForest(s);
  assert.equal(t.node, 'tree'); assert.equal(treeGrowthStage(t), 6); assert.equal(placement(s, 'house', t.x, t.z).ok, false);
  const young = tileAt(s, 15, 12); young.sapling = 360;
  assert.ok(place(s, 'house', young.x, young.z).ok); assert.equal(young.sapling, 0);
});
test('growth advances gradually with visible revisions and foresters accelerate rather than skip maturity rules', () => {
  const { s } = setup(), t = tileAt(s, 14, 12); t.biome = 'forest'; t.sapling = 1;
  const stages = new Set<number>();
  for (let i = 0; i < 24; i++) { stages.add(treeGrowthStage(t)); regrowForest(s); }
  assert.deepEqual([...stages], [1, 2, 3, 4, 5]); assert.equal(t.node, 'tree');
  const other = setup(); other.s.level = 2; other.s.buildings[0].inventory = goods(100, 100, 100);
  const result = place(other.s, 'forester', 12, 12); assert.ok(result.ok);
  other.s.buildings.find(b => b.id === result.id)!.complete = true;
  const faster = tileAt(other.s, 14, 12); faster.biome = 'forest'; faster.sapling = 1;
  for (let i = 0; i < 11; i++) regrowForest(other.s);
  assert.equal(faster.node, null); assert.equal(treeGrowthStage(faster), 5);
  regrowForest(other.s); assert.equal(faster.node, 'tree');
});
test('priority stone is depleted before ordinary deposits and becomes a possible pit', () => {
  const { s } = setup(), near = tileAt(s, 10, 10), target = tileAt(s, 13, 10);
  Object.assign(near, { node: 'rock', amount: 100 }); Object.assign(target, { node: 'rock', amount: 3 });
  assert.ok(markStoneForQuarrying(s, 13, 10));
  for (let i = 0; i < 1000 && target.node; i++) step(s, .1);
  assert.equal(target.node, null); assert.equal(target.priorityQuarrying, undefined); assert.equal(near.amount, 100);
  assert.ok(orderExcavation(s, 13, 10).ok);
});
test('pit crews produce finite layers, conserve output, and cannot jump the eight-neighbor rule', () => {
  const { s } = setup(), t = tileAt(s, 13, 10), originalHeight = surfaceHeight(t);
  assert.ok(orderExcavation(s, 13, 10).ok);
  assert.equal(placement(s, 'road', 13, 10).ok, false);
  run(s, 200); assert.equal(t.excavation?.depth, 1); assert.equal(stock(s).stone, 20);
  assert.ok(surfaceHeight(t) < originalHeight); assert.equal(orderExcavation(s, 13, 10).ok, false);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (dx || dz) excavated(s, 13 + dx, 10 + dz, 1);
  assert.ok(orderExcavation(s, 13, 10).ok); run(s, 200); assert.equal(t.excavation?.depth, 2);
  assert.equal(orderExcavation(s, 13, 10).ok, false);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) excavated(s, 13 + dx, 10 + dz, Math.abs(dx) <= 1 && Math.abs(dz) <= 1 ? 2 : 1);
  assert.ok(orderExcavation(s, 13, 10).ok); run(s, 200); assert.equal(t.excavation?.depth, 3);
  assert.equal(orderExcavation(s, 13, 10).ok, false);
  assert.equal(stock(s).stone + stock(s).coal, 60);
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('lignite distribution is seeded per field and layer with 5/10 percent frequencies', () => {
  const counts = [0, 0, 0];
  for (let z = 0; z < 100; z++) for (let x = 0; x < 100; x++) for (let layer = 1; layer <= 3; layer++) counts[layer - 1] += Number(pitResource(42, x, z, layer) === 'coal');
  assert.equal(counts[0], 0); assert.ok(counts[1] > 400 && counts[1] < 600); assert.ok(counts[2] > 850 && counts[2] < 1150);
});
test('coal layer uses separate quarry capacity, obeys pause, and resumes identically after saving', () => {
  const { s, b } = setup();
  const target = s.tiles.find(t => Math.abs(t.x - b.x) + Math.abs(t.z - b.z) <= 7 && t.x > 11 && t.z > 3 && pitResource(s.seed, t.x, t.z, 2) === 'coal')!;
  assert.ok(target);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) excavated(s, target.x + dx, target.z + dz, 1);
  b.inventory.stone = 20; s.buildings[0].inventory.stone = 100;
  orderExcavation(s, target.x, target.z); run(s, 7);
  orderExcavation(s, target.x, target.z, false); run(s, 30);
  const left = target.excavation!.remaining; run(s, 20); assert.equal(target.excavation!.remaining, left);
  orderExcavation(s, target.x, target.z); const loaded = deserialize(serialize(s)); run(s, 200); run(loaded, 200);
  assert.deepEqual(loaded, s); assert.equal(stock(s).coal, 20); assert.equal(target.excavation!.depth, 2);
});
test('pit orders protect buildings, roads, water and mature trees; malformed depths are rejected', () => {
  const { s } = setup();
  assert.equal(orderExcavation(s, 9, 10).ok, false); assert.equal(orderExcavation(s, 8, 13).ok, false);
  const t = tileAt(s, 14, 12); t.kind = 'water'; assert.equal(excavationCheck(s, t.x, t.z).ok, false);
  t.kind = 'grass'; t.node = 'tree'; t.amount = 20; assert.equal(orderExcavation(s, t.x, t.z).ok, false);
  t.node = null; t.amount = 0; t.sapling = 400; assert.ok(orderExcavation(s, t.x, t.z).ok); assert.equal(t.sapling, 0);
  t.excavation!.depth = 4; assert.throws(() => deserialize(serialize(s)), /beschädigt/);
  t.excavation!.depth = 2; t.excavation!.remaining = 0; t.excavation!.ordered = false; assert.throws(() => deserialize(serialize(s)), /beschädigt/);
});

test('two quarries reserve the final layer units without duplication or exceeding storage caps', () => {
  const { s } = setup();
  const result = place(s, 'quarry', 10, 11); assert.ok(result.ok);
  const second = s.buildings.find(b => b.id === result.id)!; second.complete = true; second.progress = 1;
  s.villagers[1].job = second.id;
  orderExcavation(s, 12, 10);
  for (let i = 0; i < 2000; i++) {
    step(s, .1);
    const t = tileAt(s, 12, 10);
    const reserved = s.villagers.filter(v => v.task?.kind === 'excavate' && v.task.phase === 'work').reduce((sum, v) => sum + v.task!.amount, 0);
    assert.ok(reserved <= t.excavation!.remaining);
    for (const b of s.buildings.filter(b => b.kind === 'quarry')) assert.ok(b.inventory.stone <= 20);
  }
  assert.equal(tileAt(s, 12, 10).excavation!.depth, 1); assert.equal(stock(s).stone, 20);
});
