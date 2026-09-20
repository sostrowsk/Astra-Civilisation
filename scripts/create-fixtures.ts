import { mkdir, writeFile } from 'node:fs/promises';
import { playCampaign } from './campaign.ts';
import { createGame, goods, explore, serialize } from '../src/sim.ts';
import { regionId } from '../src/generator.ts';
const { checkpoints, state } = playCampaign();
await mkdir('dev-fixtures', { recursive: true });
for (const [name, raw] of Object.entries(checkpoints)) await writeFile(`dev-fixtures/${name}.json`, raw);
// A separate, explicitly funded visual terrain fixture, never a progression proof.
const world = createGame(42); world.level = 4; world.won = true; world.buildings[0].inventory = goods(10000, 10000, 10000, 10000, 10000, 10000);
for (let radius = 1; radius <= 3; radius++) for (let z = -radius; z <= radius; z++) for (let x = -radius; x <= radius; x++) if (Math.abs(x) + Math.abs(z) === radius) explore(world, regionId(x, z));
await writeFile('dev-fixtures/world.json', serialize(world));
console.log(`Created real village and mining checkpoints; ore-to-shears campaign: ${(state.time / 60).toFixed(1)} simulated minutes. World fixture is explicitly funded.`);

// Explicitly funded economy showcase. Every new business still receives real
// construction deliveries and runs the same simulation as the player game.
const economy = createGame(42); economy.level = 5; economy.won = true;
for (const t of economy.tiles) if (t.x >= 5 && t.x <= 14 && t.z >= 8 && t.z <= 16) Object.assign(t, { kind: 'grass', node: null, amount: 0, waterway: null, sapling: 0 });
economy.buildings[0].inventory = { ...goods(100, 100, 100, 100, 30, 40), iron: 30, copper: 30, coal: 30, ironOre: 30, shears: 2 };
const { place, step, DEFINITIONS } = await import('../src/sim.ts');
const depotResult = place(economy, 'warehouse', 6, 12), depot = economy.buildings.find(b => b.id === depotResult.id)!;
depot.complete = true; depot.progress = 1; depot.delivered = { ...DEFINITIONS.warehouse.cost }; depot.inventory = goods(100, 100, 100, 50);
for (const [kind, x, z] of [['sawmill', 6, 10], ['house', 6, 14], ['house', 7, 14], ['house', 6, 15], ['house', 7, 15], ['sheepfold', 9, 10], ['weaver', 10, 10], ['tailor', 11, 10], ['forge', 12, 10], ['smelter', 9, 11], ['manufactory', 10, 11], ['manufactory', 11, 11], ['manufactory', 12, 11], ['workshop', 7, 10], ['farm', 7, 11]] as const) {
  const result = place(economy, kind, x, z); if (!result.ok) throw new Error(result.reason);
  const b = economy.buildings.find(b => b.id === result.id)!;
  if (kind === 'manufactory') b.manufacture = x === 10 ? 'wire' : x === 11 ? 'gears' : 'machineParts';
}
for (let i = 0; i < 6000; i++) step(economy, .1);
if (economy.buildings.some(b => !b.complete)) throw new Error('Economy showcase construction did not finish: ' + JSON.stringify(economy.buildings.filter(b => !b.complete).map(b => ({ kind: b.kind, delivered: b.delivered }))));
await writeFile('dev-fixtures/economy.json', serialize(economy));
