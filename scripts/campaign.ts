import assert from 'node:assert/strict';
import { createGame, place, step, findPath, stock, goods, serialize, deserialize, explore, expeditionStatus, advanceCivilisation, civilisationProgress, populationCap, regrowForest, tileAt, WIDTH, HEIGHT, ORIGINAL_WIDTH, ORIGINAL_HEIGHT, REGIONS, BIOMES, RESOURCES, recipeFor, type GameState, type BuildingKind, type Building } from '../src/sim.ts';
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function until(s: GameState, predicate: () => boolean, seconds = 900) {
  for (let i = 0; i < seconds * 10; i++) { if (predicate()) return; step(s, .1); }
  assert.ok(predicate(), `Timed out: t=${s.time.toFixed(1)}, level=${s.level}, stock=${JSON.stringify(stock(s))}, goals=${JSON.stringify(civilisationProgress(s))}, unfinished=${JSON.stringify(s.buildings.filter(b => !b.complete))}`);
}
function build(s: GameState, kind: Exclude<BuildingKind, 'camp'>, x: number, z: number) {
  const result = place(s, kind, x, z); assert.ok(result.ok, `${kind} ${x}/${z}: ${result.reason}`); return s.buildings.find(b => b.id === result.id)!;
}

export function playCampaign() {
  const checkpoints: Record<string, string> = {};
  const s = createGame();
  // Reserve the planned neighbourhood using normal, free roads before trees can return.
  for (const [x, z] of [[7,14],[8,14],[9,14],[10,14],[11,14],[7,15],[8,15],[9,15],[10,15],[11,15],[10,16],[11,16],[8,10],[10,10],[8,11]]) assert.ok(place(s, 'road', x, z).ok);
  const initial = [build(s, 'woodcutter', 7, 10), build(s, 'sawmill', 9, 10), build(s, 'quarry', 9, 8)];
  until(s, () => initial.every(b => b.complete));
  const bridge = build(s, 'bridge', 13, 12); until(s, () => bridge.complete);
  const outpost = build(s, 'outpost', 17, 12); until(s, () => outpost.complete);
  const warehouse = build(s, 'warehouse', 7, 11);
  const houses = [build(s, 'house', 7, 14), build(s, 'house', 8, 14)];
  until(s, () => civilisationProgress(s).ready); checkpoints.village = serialize(s); assert.ok(advanceCivilisation(s).ok); assert.equal(populationCap(s), 32);
  const farm1 = build(s, 'farm', 10, 15), farm2 = build(s, 'farm', 11, 15), forester = build(s, 'forester', 6, 10);
  const warehouse2 = build(s, 'warehouse', 10, 11);
  for (const p of [[9, 14], [10, 14], [11, 14], [7, 15]]) houses.push(build(s, 'house', p[0], p[1]));
  until(s, () => expeditionStatus(s, 1).ok); assert.ok(explore(s, 1).ok);
  assert.equal(place(s, 'farm', 30, 12).ok, false, 'outpost first in new region');
  const forestOutpost = build(s, 'outpost', 27, 12); until(s, () => forestOutpost.complete);
  const forestLogger = build(s, 'woodcutter', 29, 12);
  until(s, () => expeditionStatus(s, 2).ok); assert.ok(explore(s, 2).ok);
  const mountainOutpost = build(s, 'outpost', 12, 25); until(s, () => mountainOutpost.complete);
  const mountainQuarry = build(s, 'quarry', 12, 27);
  until(s, () => civilisationProgress(s).ready); assert.ok(advanceCivilisation(s).ok); assert.equal(populationCap(s), 48); checkpoints.city = serialize(s);
  const workshop = build(s, 'workshop', 8, 10), academy = build(s, 'academy', 10, 10);
  for (const p of [[8, 15], [9, 15], [10, 16], [11, 16]]) houses.push(build(s, 'house', p[0], p[1]));
  until(s, () => workshop.complete && academy.complete);
  const townhall = build(s, 'townhall', 8, 11);
  until(s, () => expeditionStatus(s, 3).ok); assert.ok(explore(s, 3).ok);
  until(s, () => civilisationProgress(s).ready, 1800);
  assert.ok(advanceCivilisation(s).ok); assert.equal(s.level, 4); assert.equal(populationCap(s), 64);
  assert.equal(advanceCivilisation(s).ok, false);
  assert.ok([warehouse, warehouse2, farm1, farm2, forester, forestLogger, mountainQuarry, townhall, ...houses].every(b => b.complete));
  until(s, () => expeditionStatus(s, 4).ok && expeditionStatus(s, 5).ok, 1500);
  checkpoints.frontier = serialize(s);
  assert.ok(explore(s, 4).ok); until(s, () => expeditionStatus(s, 5).ok); assert.ok(explore(s, 5).ok);
  assert.equal(s.regions.length, 6); assert.equal(s.villagers.length, 30);
  assert.deepEqual(deserialize(serialize(s)), s);
  checkpoints.world = serialize(s);
  return { state: s, checkpoints };
}
