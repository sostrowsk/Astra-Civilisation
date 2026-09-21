// Explicit visual QA scene, not a gameplay progression proof.
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, tileAt, place, goods, serialize, BIOMES } from '../src/sim.ts';
const s = createGame(42);
for (const t of s.tiles) Object.assign(t, { kind: 'grass', waterway: null, node: null, amount: 0, sapling: 0, height: 1.2, biome: 'meadow' });
s.buildings[0].inventory = goods(100, 100, 100);
const result = place(s, 'quarry', 12, 12); const quarry = s.buildings.find(b => b.id === result.id)!;
quarry.complete = true; quarry.progress = 1; quarry.active = false;
for (let stage = 1; stage <= 5; stage++) tileAt(s, 4 + stage, 8).sapling = 1 + (stage - 1) * BIOMES.meadow.growth / 5;
Object.assign(tileAt(s, 10, 8), { node: 'tree', amount: 20 });
Object.assign(tileAt(s, 12, 9), { node: 'rock', amount: 6 });
for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) tileAt(s, 18 + dx, 12 + dz).excavation = { depth: Math.abs(dx) <= 1 && Math.abs(dz) <= 1 ? 2 : 1, remaining: 0, ordered: false };
await mkdir('dev-fixtures', { recursive: true });
await writeFile('dev-fixtures/surface.json', serialize(s));
console.log('Created surface QA scene: five young tree stages, mature tree, finite rocks, terraced pit.');
