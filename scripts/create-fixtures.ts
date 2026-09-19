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
console.log(`Created real village and mining checkpoints; ore-to-tools campaign: ${(state.time / 60).toFixed(1)} simulated minutes. World fixture is explicitly funded.`);
