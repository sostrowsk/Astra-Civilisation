// Isolated visual QA poses with long work timers; not a gameplay progression proof.
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, tileAt, place, serialize, deserialize, type BuildingKind } from '../src/sim.ts';
const s = createGame(42);
for (const t of s.tiles) Object.assign(t, {kind:'grass', waterway:null, node:null, amount:0, sapling:0, height:1.2, biome:'meadow'});
const jobs = [
  {kind:'woodcutter', x:10, resource:'wood', node:'tree'},
  {kind:'quarry', x:14, resource:'stone', node:'rock'},
  {kind:'quarry', x:18, resource:'stone', node:null},
] as const;
for (const [i, job] of jobs.entries()) {
  const result = place(s, job.kind as BuildingKind, job.x, 14);
  if (!result.ok) throw new Error(result.reason);
  const b = s.buildings.find(b => b.id === result.id)!; b.complete = true; b.progress = 1;
  const target = tileAt(s, job.x, 10); target.node = job.node; target.amount = job.node ? 20 : 0;
  if (!job.node) target.excavation = {depth:0, remaining:20, ordered:true};
  const v = s.villagers[i]; v.job = b.id; v.x = job.x; v.z = job.node ? 11 : 10;
  v.task = {kind:job.node ? 'gather' : 'excavate', phase:'work', destId:b.id, resource:job.resource, amount:2, node:{x:target.x,z:target.z}, path:[], timer:120, ...(job.node ? {} : {layer:1})};
}
const raw = serialize(s); deserialize(raw);
await mkdir('dev-fixtures', {recursive:true});
await writeFile('dev-fixtures/workers.json', raw);
console.log('Created worker animation QA scene: tree felling, quarrying, and open-pit digging.');
