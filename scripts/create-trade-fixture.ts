// Explicitly funded visual QA world with genuine dispatch and vehicle reservations.
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, goods, place, step, serialize, deserialize } from '../src/sim.ts';
const s=createGame(42);s.level=4;
for(const t of s.tiles) Object.assign(t,{kind:'grass',node:null,amount:0,sapling:0,waterway:null,height:1.2,biome:'meadow',road:t.z===12});
s.buildings[0].inventory=goods(100,100,100);
for(const [kind,x,z] of [['warehouse',10,12],['outpost',23,12]] as const) {
  const result=place(s,kind,x,z);if(!result.ok) throw new Error(result.reason);
  const b=s.buildings.find(b=>b.id===result.id)!;b.complete=true;b.progress=1;
}
for(let i=0;i<6;i++) step(s,.1);
const raw=serialize(s);deserialize(raw);
await mkdir('dev-fixtures',{recursive:true});await writeFile('dev-fixtures/trade.json',raw);
console.log('Created trade QA world: four traders, one cart, one coach, two pedestrians.');
