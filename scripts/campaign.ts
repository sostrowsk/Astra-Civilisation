import assert from 'node:assert/strict';
import { createGame, place, step, stock, serialize, civilisationProgress, advanceCivilisation, type GameState, type Tool } from '../src/sim.ts';
export function until(s: GameState, predicate: () => boolean, seconds = 1200) {
  for (let i = 0; i < seconds * 10; i++) { if (predicate()) return; step(s, .1); }
  assert.ok(predicate(), `Timeout at ${s.time.toFixed(1)}: ${JSON.stringify(stock(s))}; ${JSON.stringify(civilisationProgress(s))}`);
}
export function playCampaign() {
  const s = createGame(42), checkpoints: Record<string, string> = {};
  for (let z = 8; z <= 16; z++) for (let x = 5; x <= 12; x++) place(s, 'road', x, z);
  const build = (kind: Tool, x: number, z: number) => { const r = place(s, kind, x, z); assert.ok(r.ok, r.reason); return s.buildings.find(b => b.id === r.id)!; };
  const initial = [build('woodcutter', 7, 10), build('sawmill', 9, 10), build('quarry', 9, 8)];
  until(s, () => initial.every(b => b.complete));
  build('outpost', 11, 9); build('warehouse', 7, 11); build('house', 7, 14); build('house', 8, 14);
  until(s, () => civilisationProgress(s).ready); checkpoints.village = serialize(s); assert.ok(advanceCivilisation(s).ok);
  build('farm', 11, 10);
  build('workshop', 10, 10);
  const mine = build('mine', 10, 11), smelter = build('smelter', 11, 11), forge = build('forge', 12, 11);
  build('house', 9, 14); build('house', 10, 14);
  until(s, () => mine.complete && smelter.complete && forge.complete);
  checkpoints.mining = serialize(s);
  until(s, () => stock(s).shears >= 1, 2400);
  assert.ok(s.underground.some(t => !t.solid));
  assert.ok(s.buildings[0].inventory.shears + forge.inventory.shears > 0 || s.villagers.some(v => v.cargo?.resource === 'shears'));
  return { state: s, checkpoints };
}
