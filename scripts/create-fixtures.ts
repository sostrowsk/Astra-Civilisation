import { mkdir, writeFile } from 'node:fs/promises';
import { playCampaign } from './campaign.ts';
const { checkpoints } = playCampaign();
await mkdir('dev-fixtures', { recursive: true });
for (const [name, raw] of Object.entries(checkpoints)) await writeFile(`dev-fixtures/${name}.json`, raw);
console.log('Generated village, city, frontier and world from a real simulated campaign.');
