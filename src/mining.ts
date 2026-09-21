import { workerPath } from './logistics.ts';
import { capacity, roomFor, recordFlow, useEquipment } from './economy.ts';
import { key, hash, noise, regionFor } from './generator.ts';
import { NAMES, tileAt, event, type GameState, type Point, type Building, type Villager, type Resource } from './sim.ts';
export const DEPTHS = [0, 12, 32, 64] as const;
export const ORES = ['coal', 'copperOre', 'ironOre', 'goldOre', 'diamond'] as const;
export type Ore = typeof ORES[number];
export const ORE_COLORS: Record<Ore, string> = { coal: '#333943', copperOre: '#cf875e', ironOre: '#bcc8ce', goldOre: '#efc663', diamond: '#84e2e4' };
export interface UndergroundTile extends Point { depth: number; solid: boolean; revealed: boolean; ore: Ore | null; amount: number; order: number | null }
export interface MiningTrip { mineId: number; depth: number; target: Point; stage: 'approach' | 'outbound' | 'work' | 'return'; path: Point[]; timer: number }
const indexes = new WeakMap<GameState, { count: number; map: Map<string, UndergroundTile> }>();
const ukey = (x: number, z: number, depth: number) => `${depth}:${key(x, z)}`;
export function undergroundAt(s: GameState, x: number, z: number, depth: number) {
  let cache = indexes.get(s);
  if (!cache || cache.count !== s.underground.length) { cache = { count: s.underground.length, map: new Map(s.underground.map(t => [ukey(t.x, t.z, t.depth), t])) }; indexes.set(s, cache); }
  return cache.map.get(ukey(x, z, depth));
}
export function generateUnderground(seed: number, x: number, z: number, depth: number): UndergroundTile {
  const cave = noise(seed + depth * 1009, x, z, 9) > .62;
  let ore: Ore | null = null;
  if (!cave) {
    // Independent continuous ore fields create veins crossing surface biome and chunk borders.
    const allowed: Ore[] = depth === 1 ? ['coal', 'copperOre', 'ironOre'] : depth === 2 ? ['coal', 'copperOre', 'ironOre', 'goldOre'] : [...ORES];
    for (const kind of allowed) {
      const i = ORES.indexOf(kind), n = noise(seed + 800 + i * 79 + depth * 211, x, z, kind === 'diamond' ? 3 : 5);
      if (n > (kind === 'diamond' ? .86 : kind === 'goldOre' ? .78 : .67)) ore = kind;
    }
  }
  return { x, z, depth, solid: !cave, revealed: false, ore, amount: ore ? 6 + Math.floor(hash(seed + depth, x, z) * 5) * 2 : cave ? 0 : 2, order: null };
}
export function ensureDepth(s: GameState, depth: number) {
  const have = new Set(s.underground.filter(t => t.depth === depth).map(t => regionFor(t.x, t.z)));
  for (const t of s.tiles) if (!have.has(t.region)) s.underground.push(generateUnderground(s.seed, t.x, t.z, depth));
}
function neighbors(p: Point) { return [{ x: p.x - 1, z: p.z }, { x: p.x + 1, z: p.z }, { x: p.x, z: p.z - 1 }, { x: p.x, z: p.z + 1 }]; }
export function revealCave(s: GameState, point: Point, depth: number) {
  const queue = [point], seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], k = key(p.x, p.z), t = undergroundAt(s, p.x, p.z, depth);
    if (!t || seen.has(k)) continue;
    seen.add(k); t.revealed = true;
    if (!t.solid) queue.push(...neighbors(t));
  }
  s.revision++;
}
export function openMine(s: GameState, b: Building) {
  b.mineDepth ??= 1; b.autoMine ??= true;
  for (const depth of [1, 2, 3]) {
    ensureDepth(s, depth);
    // A shaft is the vertical connection to each level; nearby geology stays seed-generated.
    const t = undergroundAt(s, b.x, b.z, depth)!;
    t.solid = false; t.ore = null; t.amount = 0; t.order = null;
    revealCave(s, b, depth);
  }
}
export function undergroundPath(s: GameState, start: Point, target: Point, depth: number) {
  const origin = { x: Math.round(start.x), z: Math.round(start.z) }, from = key(origin.x, origin.z), to = key(target.x, target.z);
  const free = (p: Point) => { const t = undergroundAt(s, p.x, p.z, depth); return t?.revealed && !t.solid; };
  if (!free(origin) || !free(target)) return null;
  const previous = new Map<string, Point>([[from, origin]]), queue = [origin];
  if (from === to) return [];
  for (let i = 0; i < queue.length; i++) for (const next of neighbors(queue[i])) {
    const k = key(next.x, next.z); if (previous.has(k) || !free(next)) continue;
    previous.set(k, queue[i]);
    if (k === to) { const result: Point[] = []; for (let p = next; key(p.x, p.z) !== from; p = previous.get(key(p.x, p.z))!) result.push(p); return result.reverse(); }
    queue.push(next);
  }
  return null;
}
export function markMining(s: GameState, mineId: number, depth: number, from: Point, to = from, cancel = false) {
  const b = s.buildings.find(b => b.id === mineId && b.kind === 'mine' && b.complete);
  if (!b || ![1, 2, 3].includes(depth)) return { ok: false, reason: 'Wähle eine fertige Mine und eine Tiefenebene.' };
  if (![from.x, from.z, to.x, to.z].every(Number.isSafeInteger)) return { ok: false, reason: 'Ungültige Koordinaten.' };
  if ((Math.abs(from.x - to.x) + 1) * (Math.abs(from.z - to.z) + 1) > 256) return { ok: false, reason: 'Markiere höchstens 256 Felder auf einmal.' };
  ensureDepth(s, depth);
  let count = 0;
  for (let z = Math.min(from.z, to.z); z <= Math.max(from.z, to.z); z++) for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
    const t = undergroundAt(s, x, z, depth);
    if (!t?.solid || !tileAt(s, x, z)?.discovered) continue;
    if (cancel) { if (t.order === mineId) { t.order = null; count++; } }
    else if (t.order === null || t.order === mineId) { t.order = mineId; count++; }
  }
  s.revision++;
  return { ok: count > 0, reason: count ? `${count} Felder ${cancel ? 'freigegeben' : 'zum Abbau markiert'}.` : 'Keine passenden Gesteinsfelder. Markierungen beginnen an einer erreichbaren Stollenfront.' };
}
function dist(a: Point, b: Point) { return Math.abs(a.x - b.x) + Math.abs(a.z - b.z); }
export function mineStatus(s: GameState, b: Building) {
  const staff = s.villagers.filter(v => v.job === b.id);
  const worker = staff.find(v => v.mining) ?? staff[0], trip = worker?.mining;
  if (b.complete && staff.filter(v => v.mining).length > 1) return `${staff.filter(v => v.mining).length} Bergleute im Einsatz · Beim Abbau: ${staff.filter(v => v.mining?.stage === 'work').length} · Rücktransport: ${staff.filter(v => v.mining?.stage === 'return').length}.`;
  if (!b.complete) return 'Der Mineneingang wird noch gebaut.';
  if (trip) {
    const depth = `−${DEPTHS[trip.depth]} m`;
    if (trip.stage === 'approach') return `${worker.name} läuft an der Oberfläche zum Schacht.`;
    if (trip.stage === 'outbound') return `${worker.name} läuft zum Abbauort (${depth}).`;
    if (trip.stage === 'work') return `${worker.name} gräbt (${depth}).`;
    return `${worker.name} bringt ${worker.cargo ? NAMES[worker.cargo.resource] : 'Material'} zum Schacht (${depth}).`;
  }
  if (!b.active) return 'Mine pausiert. Betrieb fortsetzen, um weiterzugraben.';
  if (!worker) return 'Kein Bergmann zugeteilt. Wohnraum schaffen oder einen anderen Betrieb pausieren.';
  if (worker.task) return `${worker.name} beendet noch einen Transport an der Oberfläche.`;
  if (['stone', ...ORES].some(r => b.inventory[r as Resource] >= capacity(b, r as Resource))) return 'Minenlager voll für mindestens ein Fördergut (40 je Rohstoff). Träger müssen Platz schaffen.';
  if (!b.autoMine && !s.underground.some(t => t.depth === (b.mineDepth ?? 1) && t.order === b.id)) return 'Kein Abbauauftrag. Stollen markieren oder automatische Erkundung einschalten.';
  return `Keine erreichbare Abbaufront auf −${DEPTHS[b.mineDepth ?? 1]} m. Markiere einen verbundenen Stollen ab dem Schacht.`;
}
export function assignMiner(s: GameState, v: Villager, b: Building) {
  if (v.depth || v.mining || v.cargo) return;
  const depth = b.mineDepth ?? 1;
  ensureDepth(s, depth);
  const assigned = new Set(s.villagers.filter(n => n.mining?.depth === depth).map(n => key(n.mining!.target.x, n.mining!.target.z)));
  const candidates = s.underground.filter(t => t.depth === depth && t.solid && t.revealed && !assigned.has(key(t.x, t.z)) && (t.order === b.id || (t.order === null && b.autoMine && dist(t, b) <= 18)))
    .sort((a, c) => Number(c.order === b.id) - Number(a.order === b.id) || Number(!!c.ore) - Number(!!a.ore) || dist(a, b) - dist(c, b));
  const approach = workerPath(s, v, b); if (!approach) return;
  for (const target of candidates) {
    if (roomFor(s, b, target.ore ?? 'stone') < Math.min(2, target.amount)) continue;
    const routes = neighbors(target).map(p => undergroundPath(s, b, p, depth)).filter((p): p is Point[] => p !== null).sort((a, c) => a.length - c.length);
    if (!routes.length) continue;
    v.mining = { mineId: b.id, depth, target: { x: target.x, z: target.z }, stage: 'approach', path: approach, timer: 0 };
    return;
  }
}
export function stepMiner(s: GameState, v: Villager, dt: number) {
  const trip = v.mining!, b = s.buildings.find(b => b.id === trip.mineId)!;
  if (trip.path.length) {
    const p = trip.path[0], dx = p.x - v.x, dz = p.z - v.z, length = Math.hypot(dx, dz), amount = dt * (v.depth ? 1.6 : 1.5);
    v.facing = Math.atan2(dx, dz);
    if (length <= amount) { v.x = p.x; v.z = p.z; trip.path.shift(); } else { v.x += dx / length * amount; v.z += dz / length * amount; }
    return;
  }
  if (trip.stage === 'approach') {
    v.depth = trip.depth; v.x = b.x; v.z = b.z;
    const routes = neighbors(trip.target).map(p => undergroundPath(s, b, p, trip.depth)).filter((p): p is Point[] => p !== null).sort((a, c) => a.length - c.length);
    if (!routes.length) { v.depth = 0; v.mining = null; return; }
    trip.path = routes[0]; trip.stage = 'outbound'; return;
  }
  if (trip.stage === 'outbound') { v.facing = Math.atan2(trip.target.x - v.x, trip.target.z - v.z); trip.stage = 'work'; trip.timer = (4 + trip.depth * 2) / (useEquipment(s, b) ? 1.5 : 1); return; }
  if (trip.stage === 'work') {
    trip.timer -= dt * (1 + (s.level - 1) * .1); if (trip.timer > 0) return;
    const t = undergroundAt(s, trip.target.x, trip.target.z, trip.depth)!;
    if (t.solid && t.amount > 0) {
      const resource: Resource = t.ore ?? 'stone', amount = Math.min(2, t.amount); t.amount -= amount; v.cargo = { resource, amount }; recordFlow(s, 'produced', resource, amount);
      if (!t.amount) { t.solid = false; t.ore = null; t.order = null; revealCave(s, t, trip.depth); }
    }
    trip.path = undergroundPath(s, v, b, trip.depth)!; trip.stage = 'return'; return;
  }
  if (trip.stage === 'return') {
    if (v.cargo && roomFor(s, b, v.cargo.resource, v.id) < v.cargo.amount) return;
    if (v.cargo) { b.inventory[v.cargo.resource] += v.cargo.amount; if (v.cargo.resource === 'diamond') event(s, 'Diamanten geborgen! Sie können Expeditionen finanzieren.'); }
    v.x = b.x; v.z = b.z; v.depth = 0; v.cargo = null; v.mining = null;
  }
}
export function validateUnderground(s: GameState) {
  const fail = () => { throw new Error('Ungültiger Untertage-Spielstand.'); };
  if (!Array.isArray(s.underground) || s.underground.length > s.tiles.length * 3) fail();
  const seen = new Set<string>(), groups = new Map<string, number>();
  for (const t of s.underground) {
    const k = ukey(t.x, t.z, t.depth);
    if (!tileAt(s, t.x, t.z) || ![1, 2, 3].includes(t.depth) || seen.has(k) || typeof t.revealed !== 'boolean' || typeof t.solid !== 'boolean' || (t.ore !== null && !ORES.includes(t.ore)) || !Number.isInteger(t.amount) || t.amount < 0 || (!t.solid && (t.amount !== 0 || t.ore !== null)) || (t.order !== null && !s.buildings.some(b => b.id === t.order && b.kind === 'mine' && b.complete))) fail();
    seen.add(k); const group = `${t.depth}:${regionFor(t.x, t.z)}`; groups.set(group, (groups.get(group) ?? 0) + 1);
  }
  if ([...groups.values()].some(count => count !== 26 * 24)) fail();
  for (const b of s.buildings) {
    if (b.kind === 'mine' && (![1, 2, 3].includes(b.mineDepth!) || typeof b.autoMine !== 'boolean')) fail();
    if (b.kind === 'mine' && b.complete && [1, 2, 3].some(depth => { const t = undergroundAt(s, b.x, b.z, depth); return !t || t.solid || !t.revealed; })) fail();
    if (b.metal !== undefined && !['iron', 'copper', 'gold'].includes(b.metal)) fail();
    if (b.study !== undefined && !['planks', 'copper', 'gold'].includes(b.study)) fail();
    if (b.kind === 'bridge' && (!b.bridgeEntrance || !tileAt(s, b.bridgeEntrance.x, b.bridgeEntrance.z))) fail();
  }
  for (const v of s.villagers) {
    if (![0, 1, 2, 3].includes(v.depth) || (v.depth && !v.mining)) fail();
    const m = v.mining; if (!m) continue;
    if (v.task || !s.buildings.some(b => b.id === m.mineId && b.kind === 'mine' && b.complete) || ![1, 2, 3].includes(m.depth) || !['approach', 'outbound', 'work', 'return'].includes(m.stage) || !Number.isFinite(m.timer) || !undergroundAt(s, m.target.x, m.target.z, m.depth) || !Array.isArray(m.path) || !m.path.every(p => Number.isInteger(p.x) && Number.isInteger(p.z) && tileAt(s, p.x, p.z))) fail();
  }
}
