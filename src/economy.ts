import { undergroundAt } from './mining.ts';
import { RESOURCES, emptyStock, recipeFor, DEFINITIONS, workerTarget, isStorage, stock, civilisationProgress, type GameState, type Building, type Resource, type Stock } from './sim.ts';
export interface EconomyBucket { at: number; produced: Stock; consumed: Stock }
export interface EconomyHistory { startedAt: number; buckets: EconomyBucket[] }
export function capacity(b: Building, r: Resource): number {
  if (!b.complete) return 0;
  if (isStorage(b)) return 100;
  const inputs: Partial<Record<Building['kind'], Resource[]>> = { sawmill: ['wood'], workshop: ['stone', 'planks'], smelter: ['coal', 'ironOre', 'copperOre', 'goldOre'], forge: ['iron', 'tools'], academy: ['planks', 'copper', 'gold'], sheepfold: ['food'], weaver: ['wool'], tailor: ['cloth'], manufactory: ['copper', 'iron', 'wire', 'gears'] };
  const outputs: Partial<Record<Building['kind'], Resource[]>> = { woodcutter: ['wood'], quarry: ['stone'], sawmill: ['planks'], workshop: ['tools'], farm: ['food'], smelter: ['iron', 'copper', 'gold'], forge: ['shears', 'drill'], academy: ['knowledge'], sheepfold: ['wool'], weaver: ['cloth'], tailor: ['clothes'], manufactory: ['wire', 'gears', 'machineParts'] };
  if (b.kind === 'mine') return r === 'drill' ? 2 : ['stone', 'coal', 'copperOre', 'ironOre', 'goldOre', 'diamond'].includes(r) ? 40 : 0;
  if (equipmentFor(b) === r) return 2;
  return outputs[b.kind]?.includes(r) ? 20 : inputs[b.kind]?.includes(r) ? 10 : 0;
}
export function inbound(s: GameState, b: Building, r: Resource, excludeWorker?: number) {
  return s.villagers.reduce((n, v) => {
    if (v.id === excludeWorker) return n;
    if (v.mining?.mineId === b.id) {
      const target = undergroundAt(s, v.mining.target.x, v.mining.target.z, v.mining.depth);
      if ((v.cargo?.resource ?? target?.ore ?? 'stone') === r) n += v.cargo?.amount ?? 2;
    }
    if (v.task?.destId !== b.id) return n;
    if (v.task.kind === 'craft' || v.task.kind === 'saw') { const recipe = recipeFor(s, b); if (recipe?.output === r) n += recipe.count; }
    else if (v.task.resource === r) n += v.task.amount;
    return n;
  }, 0);
}
export function roomFor(s: GameState, b: Building, r: Resource, excludeWorker?: number) { return Math.max(0, capacity(b, r) - b.inventory[r] - inbound(s, b, r, excludeWorker)); }
export function recordFlow(s: GameState, kind: 'produced' | 'consumed', r: Resource, amount: number) {
  if (!amount) return;
  s.economy ??= { startedAt: s.time, buckets: [] };
  const at = Math.floor(s.time / 10) * 10;
  let bucket = s.economy.buckets.at(-1);
  if (!bucket || bucket.at !== at) { bucket = { at, produced: emptyStock(), consumed: emptyStock() }; s.economy.buckets.push(bucket); }
  bucket[kind][r] += amount; pruneHistory(s);
}
export function pruneHistory(s: GameState) { if (s.economy) s.economy.buckets = s.economy.buckets.filter(b => b.at + 10 > s.time - 300); }
export function equipmentFor(b: Building): Resource | undefined { return b.kind === 'mine' ? 'drill' : b.kind === 'tailor' ? 'shears' : ['workshop', 'farm', 'sheepfold', 'weaver'].includes(b.kind) ? 'machineParts' : undefined; }
export function useEquipment(s: GameState, b: Building) {
  const r = equipmentFor(b); if (!r) return false;
  if (!(b.equipmentUses ?? 0)) {
    if (!b.inventory[r]) return false;
    b.inventory[r]--; b.equipmentUses = r === 'drill' ? 40 : 20; recordFlow(s, 'consumed', r, 1);
  }
  b.equipmentUses!--; return true;
}
export function staffingSummary(s: GameState) {
  const jobs = s.buildings.filter(b => b.complete && b.active && DEFINITIONS[b.kind].producer).reduce((n, b) => n + workerTarget(b), 0);
  const assigned = s.villagers.filter(v => v.job !== null).length;
  return { residents: s.villagers.length, jobs, assigned, carriers: s.villagers.length - assigned, vacancies: Math.max(0, jobs - assigned) };
}
export function economyRows(s: GameState) {
  const totals = stock(s), history = s.economy, goalCost = civilisationProgress(s).cost;
  const seconds = Math.max(1, Math.min(300, s.time - (history?.startedAt ?? s.time)));
  return RESOURCES.map(resource => {
    let produced = 0, consumed = 0, demand = 0, upgrades = 0;
    for (const bucket of history?.buckets ?? []) if (bucket.at + 10 > s.time - 300) { produced += bucket.produced[resource]; consumed += bucket.consumed[resource]; }
    for (const b of s.buildings) {
      if (!b.complete) demand += Math.max(0, DEFINITIONS[b.kind].cost[resource] - b.delivered[resource] - inbound(s, b, resource));
      else if (b.active) {
        const recipe = recipeFor(s, b);
        if (recipe?.input === resource || recipe?.fuel === resource) demand += Math.max(0, 1 - b.inventory[resource] - inbound(s, b, resource));
        if (equipmentFor(b) === resource && !(b.equipmentUses ?? 0)) { const missing = Math.max(0, 1 - b.inventory[resource] - inbound(s, b, resource)); if (b.kind === 'tailor') demand += missing; else upgrades += missing; }
      }
    }
    const totalCapacity = s.buildings.reduce((n, b) => n + capacity(b, resource), 0);
    const moving = s.villagers.reduce((n, v) => n + (v.cargo?.resource === resource ? v.cargo.amount : 0), 0);
    const balance = (produced - consumed) * 60 / seconds;
    const goal = goalCost[resource];
    const status = produced === 0 && consumed === 0 ? '-' : demand + goal > totals[resource] + moving ? 'Bedarf ungedeckt' : totals[resource] >= totalCapacity && totalCapacity > 0 ? 'Lager voll' : balance < -.01 ? 'Vorrat sinkt' : balance > .01 ? 'Überschuss' : 'Ausgeglichen';
    return { resource, amount: totals[resource], moving, pending: s.returns?.[resource] ?? 0, capacity: totalCapacity, free: s.buildings.reduce((n, b) => n + roomFor(s, b, resource), 0), produced: produced * 60 / seconds, consumed: consumed * 60 / seconds, balance, demand, upgrades, goal, status };
  });
}
