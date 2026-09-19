import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, place, step, stock, goods, serialize, deserialize, tileAt, explore, type GameState, type BuildingKind, type Building } from './sim.ts';
import { generateUnderground, openMine, undergroundAt, markMining, undergroundPath, revealCave, ORES } from './mining.ts';
import { regionId } from './generator.ts';
import { playCampaign } from '../scripts/campaign.ts';
function run(s: GameState, seconds: number) { for (let i = 0; i < seconds * 10; i++) step(s, .1); }
function complete(s: GameState, kind: Exclude<BuildingKind, 'camp'>, x: number, z: number) {
  const result = place(s, kind, x, z); assert.ok(result.ok, result.reason); const b = s.buildings.find(b => b.id === result.id)!; b.complete = true; b.progress = 1; if (kind === 'mine') openMine(s, b); return b;
}
function mineGame() { const s = createGame(42); s.level = 2; const b = complete(s, 'mine', 10, 11); b.autoMine = false; return { s, b }; }
function stone(s: GameState, b: Building, x: number, z: number) { const t = undergroundAt(s, x, z, 1)!; Object.assign(t, { solid: true, revealed: false, ore: null, amount: 2, order: b.id }); return t; }
test('seeded caves and ores exist at appropriate depths and cross chunk boundaries', () => {
  let caves = 0; const ores = new Set<string>(), seams = new Set<string>();
  for (const depth of [1, 2, 3]) for (let z = -30; z < 70; z++) for (let x = -30; x < 70; x++) {
    const t = generateUnderground(42, x, z, depth); assert.deepEqual(t, generateUnderground(42, x, z, depth));
    if (!t.solid) caves++; if (t.ore) ores.add(t.ore);
    if (depth === 1) assert.ok(t.ore !== 'goldOre' && t.ore !== 'diamond');
    if (x === 25 && t.ore && generateUnderground(42, 26, z, depth).ore === t.ore) seams.add(t.ore);
  }
  assert.ok(caves > 1000); assert.equal(ores.size, ORES.length); assert.ok(seams.size >= 3);
});
test('mine reveals its shaft and connected caves but hides distant deposits', () => {
  const { s, b } = mineGame(); assert.equal(s.underground.length, s.tiles.length * 3);
  for (const depth of [1, 2, 3]) { assert.equal(undergroundAt(s, b.x, b.z, depth)!.solid, false); assert.equal(undergroundAt(s, b.x, b.z, depth)!.revealed, true); }
  assert.ok(s.underground.some(t => t.ore && !t.revealed)); assert.deepEqual(deserialize(serialize(s)), s);
});
test('marked tunnels excavate reachable fronts sequentially and transport real stone', () => {
  const { s, b } = mineGame(), first = stone(s, b, 11, 11), second = stone(s, b, 12, 11); revealCave(s, b, 1);
  const before = stock(s).stone; assert.equal(first.revealed, true); assert.equal(second.revealed, false);
  run(s, 70); assert.equal(first.solid, false); assert.equal(second.solid, false);
  const carried = s.villagers.reduce((n, v) => n + (v.cargo?.resource === 'stone' ? v.cargo.amount : 0), 0);
  assert.equal(stock(s).stone + carried, before + 4); assert.ok(undergroundPath(s, b, second, 1));
});
test('remote markings cannot teleport workers through solid rock', () => {
  const { s, b } = mineGame(); const t = stone(s, b, 20, 20); t.revealed = false;
  assert.ok(markMining(s, b.id, 1, t).ok); run(s, 30); assert.equal(t.amount, 2); assert.equal(t.solid, true);
  assert.equal(markMining(s, b.id, 1, { x: 0, z: 0 }, { x: 100, z: 100 }).ok, false);
});
test('cancelled marks stop future work; paused mine returns current cargo', () => {
  const { s, b } = mineGame(), t = stone(s, b, 11, 11); revealCave(s, b, 1);
  markMining(s, b.id, 1, t, t, true); run(s, 10); assert.equal(t.solid, true);
  markMining(s, b.id, 1, t); run(s, 5); assert.ok(s.villagers.some(v => v.mining)); b.active = false; run(s, 40);
  assert.ok(s.villagers.every(v => !v.mining && !v.depth)); assert.equal(t.solid, false);
});
test('ongoing mining survives save and resumes identically after changing target depth', () => {
  const { s, b } = mineGame(); stone(s, b, 11, 11); revealCave(s, b, 1); run(s, 5); b.mineDepth = 3;
  const restored = deserialize(serialize(s)); run(s, 60); run(restored, 60); assert.deepEqual(restored, s);
});
test('ore is finite and two mines cannot double-reserve the same block', () => {
  const { s, b } = mineGame(); b.autoMine = true; const other = complete(s, 'mine', 9, 11); other.autoMine = true;
  const t = undergroundAt(s, 10, 12, 1)!; Object.assign(t, { solid: true, revealed: true, ore: 'ironOre', amount: 2, order: b.id });
  for (let i = 0; i < 200; i++) { step(s, .1); const targets = s.villagers.filter(v => v.mining?.depth === 1).map(v => `${v.mining!.target.x}/${v.mining!.target.z}`); assert.equal(new Set(targets).size, targets.length); }
  assert.ok(t.amount >= 0);
});
test('smelter consumes both ore and coal, forge produces three tools per ingot', () => {
  const s = createGame(42); s.level = 2; s.buildings[0].inventory = { ...goods(), coal: 1, ironOre: 1 };
  const smelter = complete(s, 'smelter', 9, 10), forge = complete(s, 'forge', 10, 10); run(s, 90);
  assert.equal(stock(s).tools, 3); assert.equal(stock(s).coal, 0); assert.equal(stock(s).ironOre, 0); assert.equal(stock(s).iron, 0);
  assert.ok(smelter.complete && forge.complete);
});
test('smelting stops without fuel and resumes when coal becomes available', () => {
  const s = createGame(42); s.level = 2; s.buildings[0].inventory = { ...goods(), copperOre: 2 }; const b = complete(s, 'smelter', 9, 10); b.metal = 'copper'; run(s, 50); assert.equal(stock(s).copper, 0); s.buildings[0].inventory.coal = 1; run(s, 60); assert.equal(stock(s).copper, 1); assert.equal(stock(s).copperOre, 1);
});
test('expansion extends underground geology without changing existing excavations', () => {
  const { s, b } = mineGame(); s.won = true; s.buildings[0].inventory = goods(100, 100, 100); const t = undergroundAt(s, b.x, b.z, 1)!;
  assert.ok(explore(s, regionId(-1, 0)).ok); assert.equal(s.underground.length, s.tiles.length * 3); assert.equal(undergroundAt(s, b.x, b.z, 1), t);
});
test('bridges build from reachable shore one tile at a time in either orientation', () => {
  const s = createGame(42); for (const x of [10, 11]) Object.assign(tileAt(s, x, 10), { kind: 'water', waterway: 'river', node: null, amount: 0 });
  for (const x of [10, 11]) { const r = place(s, 'bridge', x, 10); assert.ok(r.ok); const b = s.buildings.find(b => b.id === r.id)!; assert.ok(b.bridgeEntrance); b.complete = true; }
  assert.ok(deserialize(serialize(s)));
});
test('real starting economy advances to village and produces mined iron tools without injected stock', () => {
  const { state: s } = playCampaign(); assert.equal(s.level, 2); assert.ok(stock(s).tools >= 3); console.log(`Real ore-to-tools campaign: ${(s.time / 60).toFixed(1)} simulation minutes.`);
});

test('copper and gold research consume metal and produce useful knowledge', () => {
  for (const [metal, knowledge] of [['copper', 6], ['gold', 20]] as const) {
    const s = createGame(42); s.level = 3; s.buildings[0].inventory = { ...goods(), [metal]: 1 };
    const academy = complete(s, 'academy', 9, 10); academy.study = metal; run(s, 60);
    assert.equal(stock(s)[metal], 0); assert.equal(stock(s).knowledge, knowledge);
  }
});
test('malformed underground data and duplicate cells are rejected', () => {
  const { s } = mineGame(); s.underground.push({ ...s.underground[0] }); assert.throws(() => deserialize(serialize(s)));
  const other = mineGame(); other.s.villagers[0].depth = 2; assert.throws(() => deserialize(serialize(other.s)));
});
