import { CHUNK_W, CHUNK_H, key, hash, generateChunk, regionCoords, regionId, regionFor, randomSeed, terrainSample } from './generator.ts';
import { mineStatus, openMine, ensureDepth, revealCave, assignMiner, stepMiner, validateUnderground, type UndergroundTile, type MiningTrip } from './mining.ts';
export const ORIGINAL_WIDTH = CHUNK_W;
export const ORIGINAL_HEIGHT = CHUNK_H;
export const RESOURCES = ['wood', 'planks', 'stone', 'food', 'tools', 'knowledge', 'coal', 'copperOre', 'ironOre', 'goldOre', 'diamond', 'copper', 'iron', 'gold'] as const;
export type Resource = typeof RESOURCES[number];
export type Stock = Record<Resource, number>;
export type Point = { x: number; z: number };
export type BuildingKind = 'camp' | 'woodcutter' | 'sawmill' | 'quarry' | 'house' | 'miningHouse' | 'warehouse' | 'bridge' | 'outpost' | 'farm' | 'forester' | 'workshop' | 'academy' | 'townhall' | 'mine' | 'smelter' | 'forge';
export type Tool = Exclude<BuildingKind, 'camp'> | 'road';
export const NAMES: Record<Resource, string> = { wood: 'Holz', planks: 'Bretter', stone: 'Stein', food: 'Nahrung', tools: 'Werkzeuge', knowledge: 'Wissen', coal: 'Kohle', copperOre: 'Kupfererz', ironOre: 'Eisenerz', goldOre: 'Golderz', diamond: 'Diamanten', copper: 'Kupfer', iron: 'Eisen', gold: 'Gold' };
export const goods = (wood = 0, planks = 0, stone = 0, food = 0, tools = 0, knowledge = 0): Stock => ({ wood, planks, stone, food, tools, knowledge, coal: 0, copperOre: 0, ironOre: 0, goldOre: 0, diamond: 0, copper: 0, iron: 0, gold: 0 });
export const emptyStock = (): Stock => goods();
export const DEFINITIONS: Record<BuildingKind, { name: string; cost: Stock; description: string; producer?: boolean; tier?: number }> = {
  camp: { name: 'Gründungslager', cost: emptyStock(), description: 'Hier begann eure Reise. Zentrales Lager und Heimat eurer ersten zehn Bewohner.' },
  woodcutter: { name: 'Holzfäller', cost: goods(4, 0, 2), description: 'Ein Arbeiter fällt Bäume im Umkreis von 9 Feldern und trägt das Holz zur Hütte.', producer: true },
  sawmill: { name: 'Sägewerk', cost: goods(5, 0, 3), description: 'Ein Arbeiter holt Holz und verarbeitet 1 Holz zu 2 Brettern.', producer: true },
  quarry: { name: 'Steinbruch', cost: goods(4, 2, 0), description: 'Ein Arbeiter gewinnt Stein aus Vorkommen im Umkreis von 9 Feldern.', producer: true },
  house: { name: 'Wohnhaus', cost: goods(3, 4, 2), description: 'Ein Zuhause für zwei neue Bewohner. Die Bevölkerungsgrenze steigt mit deiner Zivilisation auf bis zu 96.' },
  miningHouse: { name: 'Bergmannshaus', cost: goods(6, 10, 8), description: 'Vier Wohnplätze. Bewohner bevorzugen Minen in 12 Feldern Entfernung. Stelle dort bis zu vier Bergleute ein; freie Bewohner helfen beim Transport.', tier: 2 },
  warehouse: { name: 'Lagerhaus', cost: goods(4, 4, 3), description: 'Sammelt Waren aus nahen Betrieben und verkürzt Transportwege.' },
  bridge: { name: 'Brücke', cost: goods(0, 4, 2), description: 'Ein Brückenfeld über Wasser. Vom erreichbaren Ufer aus Feld für Feld weiterbauen.' },
  farm: { name: 'Bauernhof', cost: goods(6, 8, 4), description: 'Erzeugt Nahrung. Auf Wiesen besonders ertragreich, in trockener Steppe langsamer.', producer: true, tier: 2 },
  forester: { name: 'Försterei', cost: goods(6, 10, 4), description: 'Fördert Wiederbewaldung im Umkreis von 7 Feldern. Wege und Bauplätze bleiben frei.', tier: 2 },
  workshop: { name: 'Werkstatt', cost: goods(8, 16, 20, 10), description: 'Verarbeitet 1 Stein zu 1 Werkzeug. Werkzeuge ermöglichen anspruchsvolle Expeditionen.', producer: true, tier: 3 },
  academy: { name: 'Akademie', cost: goods(8, 24, 24, 12), description: 'Erzeugt Wissen aus Brettern, Kupfer oder Gold. Forschungsrohstoff im Gebäude auswählen.', producer: true, tier: 3 },
  townhall: { name: 'Rathaus', cost: goods(12, 30, 40, 20, 8), description: 'Das Zentrum einer wachsenden Stadt. Zusätzlicher Lagerstandort und Meilenstein des Aufstiegs.', tier: 3 },
  mine: { name: 'Mineneingang', cost: goods(6, 8, 6), description: 'Bis zu vier Bergleute erkunden Höhlen und graben gemeinsam markierte Stollen. Besetzung am Gebäude einstellen. Drei Tiefen mit Kohle und Erzadern.', producer: true, tier: 2 },
  smelter: { name: 'Schmelzhütte', cost: goods(6, 12, 14), description: 'Verarbeitet 1 Erz und 1 Kohle zu einem Metallbarren. Metall im Gebäude auswählen.', producer: true, tier: 2 },
  forge: { name: 'Schmiede', cost: goods(6, 14, 12), description: 'Verarbeitet 1 Eisenbarren zu 3 Werkzeugen.', producer: true, tier: 2 },
  outpost: { name: 'Außenposten', cost: goods(6, 12, 10), description: 'Gründe einen neuen Ort mindestens 5 Felder vom Lager entfernt. Erschließt in neuen Regionen einen Baubereich von 9 Feldern.' },
};
export type Biome = 'meadow' | 'forest' | 'highland' | 'desert';
export interface Tile extends Point { biome: Biome; region: number; discovered: boolean; sapling: number;  height: number; kind: 'grass' | 'water'; waterway: 'river' | 'lake' | null; node: 'tree' | 'rock' | null; amount: number; road: boolean; variant: number }
export interface Building extends Point { id: number; kind: BuildingKind; complete: boolean; delivered: Stock; inventory: Stock; progress: number; active: boolean; bridgeEntrance?: Point; metal?: 'iron' | 'copper' | 'gold'; study?: 'planks' | 'copper' | 'gold'; mineWorkers?: number; mineDepth?: number; autoMine?: boolean; lastExportAt?: number; exportCursor?: number }
export interface Task { kind: 'haul' | 'gather' | 'saw' | 'craft'; phase: 'pickup' | 'work' | 'drop'; sourceId?: number; destId: number; resource: Resource; amount: number; node?: Point; path: Point[]; timer: number }
export interface Villager extends Point { id: number; name: string; home?: number; job: number | null; task: Task | null; cargo: { resource: Resource; amount: number } | null; facing: number; depth: number; mining: MiningTrip | null }
export interface GameState { version: 3; underground: UndergroundTile[]; level: number; regions: number[]; ecologyTick: number; woodGrown: number; seed: number; time: number; nextId: number; tiles: Tile[]; buildings: Building[]; villagers: Villager[]; milestones: BuildingKind[]; events: { time: number; message: string }[]; won: boolean; revision: number }

const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
const tileIndexes = new WeakMap<GameState, { length: number; index: Map<string, Tile> }>();
export function tileAt(s: GameState, x: number, z: number): Tile {
  let cached = tileIndexes.get(s);
  if (!cached || cached.length !== s.tiles.length) { cached = { length: s.tiles.length, index: new Map(s.tiles.map(t => [key(t.x, t.z), t])) }; tileIndexes.set(s, cached); }
  return cached.index.get(key(x, z))!;
}
export const inside = (x: number, z: number) => Number.isSafeInteger(x) && Number.isSafeInteger(z);
export const buildingAt = (s: GameState, x: number, z: number) => s.buildings.find(b => b.z === z && b.x === x);
export const entrance = (b: Building): Point => b.bridgeEntrance ?? { x: b.x, z: b.z };
export const isStorage = (b: Building) => b.complete && ['camp', 'warehouse', 'outpost', 'townhall'].includes(b.kind);
export function walkable(s: GameState, x: number, z: number): boolean {
  if (!inside(x, z)) return false;
  const tile = tileAt(s, x, z);
  return !!tile && tile.discovered && !tile.node && (tile.kind !== 'water' || !!s.buildings.find(b => b.kind === 'bridge' && b.complete && b.z === z && x === b.x));
}
export function findPath(s: GameState, start: Point, target: Point): Point[] | null {
  const origin = { x: Math.round(start.x), z: Math.round(start.z) };
  if (!walkable(s, origin.x, origin.z) || !walkable(s, target.x, target.z)) return null;
  const from = key(origin.x, origin.z), to = key(target.x, target.z);
  if (from === to) return [];
  const previous = new Map<string, Point>(), queue = [origin]; previous.set(from, origin);
  for (let n = 0; n < queue.length; n++) {
    const current = queue[n];
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const next = { x: current.x + dx, z: current.z + dz }, k = key(next.x, next.z);
      if (previous.has(k) || !walkable(s, next.x, next.z)) continue;
      previous.set(k, current);
      if (k === to) { const result: Point[] = []; for (let p = next; key(p.x, p.z) !== from; p = previous.get(key(p.x, p.z))!) result.push(p); return result.reverse(); }
      queue.push(next);
    }
  }
  return null;
}
export function createGame(seed = randomSeed()): GameState {
  const s: GameState = { version: 3, underground: [], level: 1, regions: [0], ecologyTick: 0, woodGrown: 0, seed: seed >>> 0, time: 0, nextId: 2, tiles: generateChunk(seed >>> 0, 0), buildings: [{ id: 1, x: 8, z: 12, kind: 'camp', complete: true, progress: 1, delivered: emptyStock(), inventory: goods(18, 4, 12), active: true }], villagers: [], milestones: [], events: [{ time: 0, message: 'Zehn Menschen. Eine neue Welt. Seed ' + (seed >>> 0) }], won: false, revision: 0 };
  for (let i = 0; i < 10; i++) addVillager(s);
  for (let x = 7; x <= 11; x++) tileAt(s, x, 13).road = true;
  return s;
}
const PEOPLE = ['Alva', 'Bruno', 'Clara', 'Emil', 'Frida', 'Jonas', 'Lina', 'Milo', 'Nora', 'Oskar', 'Ada', 'Ben', 'Ella', 'Finn', 'Greta', 'Hugo', 'Ida', 'Jona', 'Kira', 'Leo'];
function addVillager(s: GameState, home?: Building) {
  const i = s.villagers.length;
  s.villagers.push({ id: i + 1, name: PEOPLE[i % PEOPLE.length] + (i >= 20 ? ` ${Math.floor(i / 20) + 1}` : ''), x: i < 10 ? 7 + (i % 4) : 8, z: i < 10 ? 13 + Math.floor(i / 4) : 12, job: null, task: null, cargo: null, facing: 0, depth: 0, mining: null, ...(home ? { home: home.id, x: home.x, z: home.z } : {}) });
}
export function event(s: GameState, message: string) {
  s.events.unshift({ time: s.time, message }); s.events.length = Math.min(s.events.length, 30);
}
export function stock(s: GameState): Stock {
  return s.buildings.reduce((a, b) => { for (const r of RESOURCES) a[r] += b.inventory[r]; return a; }, emptyStock());
}
export function placement(s: GameState, tool: Tool, x: number, z: number): { ok: boolean; reason: string; x: number; z: number } {
  const deny = (reason: string) => ({ ok: false, reason, x, z });
  if (!inside(x, z)) return deny('Wähle ein Feld innerhalb der Insel.');
  if (!tileAt(s, x, z)?.discovered) return deny('Noch unerforscht. Öffne die Expeditionskarte.');
  if (tool !== 'road' && (DEFINITIONS[tool].tier ?? 1) > s.level) return deny(`Wird ab Stufe ${DEFINITIONS[tool].tier} freigeschaltet.`);
  if (tool === 'bridge') {
    if (tileAt(s, x, z).kind !== 'water') return deny('Platziere Brückenfelder auf Wasser.');
    if (buildingAt(s, x, z)) return deny('Hier ist bereits eine Brücke geplant.');
    const shore = [{ x: x - 1, z }, { x: x + 1, z }, { x, z: z - 1 }, { x, z: z + 1 }].find(p => findPath(s, s.buildings[0], p) !== null);
    if (!shore) return deny('Baue vom erreichbaren Ufer oder einer fertigen Brücke aus weiter.');
    return { ok: true, reason: 'Brückenfeld mit Zugang vom Ufer.', x, z };
  }
  const tile = tileAt(s, x, z);
  if (tile.kind === 'water') return deny('Auf Wasser kannst du nur Brücken bauen.');
  if (tile.node) return deny(tile.node === 'tree' ? 'Hier steht ein Baum. Dein Holzfäller kann ihn abbauen.' : 'Hier liegt ein Steinvorkommen.');
  if (buildingAt(s, x, z)) return deny('Dieses Feld ist bereits bebaut.');
  if (tool === 'outpost' && distance(s.buildings[0], tile) < 5) return deny('Halte mindestens 5 Felder Abstand vom Gründungslager.');
  if (!findPath(s, s.buildings[0], { x, z })) return deny('Noch nicht erreichbar. Baue zuerst eine Brücke.');
  if (tile.region !== 0 && tool !== 'outpost' && tool !== 'road' && !s.buildings.some(b => b.complete && (b.kind === 'outpost' || b.kind === 'camp') && distance(b, tile) <= 9)) return deny('Baue zuerst einen Außenposten in höchstens 9 Feldern Entfernung.');
  if (tool === 'road' && tile.road) return deny('Hier liegt bereits ein Weg.');
  return { ok: true, reason: tool === 'road' ? 'Wege machen deine Bewohner 60 % schneller.' : 'Klicken, um die Baustelle zu planen.', x, z };
}
export function place(s: GameState, tool: Tool, x: number, z: number): { ok: boolean; reason: string; id?: number } {
  const check = placement(s, tool, x, z);
  if (!check.ok) return check;
  if (tool === 'road') { tileAt(s, x, z).road = true; tileAt(s, x, z).sapling = 0; s.revision++; return { ok: true, reason: 'Weg angelegt.' }; }
  const b: Building = { id: s.nextId++, x: check.x, z: check.z, kind: tool, complete: false, progress: 0, delivered: emptyStock(), inventory: emptyStock(), active: true };
  if (tool === 'bridge') b.bridgeEntrance = [{ x: x - 1, z }, { x: x + 1, z }, { x, z: z - 1 }, { x, z: z + 1 }].find(p => findPath(s, s.buildings[0], p) !== null);
  if (tool === 'mine') { b.mineDepth = 1; b.autoMine = true; }
  tileAt(s, b.x, b.z).sapling = 0; s.buildings.push(b); s.revision++;
  event(s, `${DEFINITIONS[tool].name}: Die ersten Lieferungen werden vorbereitet.`);
  return { ok: true, reason: 'Baustelle geplant.', id: b.id };
}
export function cancelConstruction(s: GameState, id: number): boolean {
  const b = s.buildings.find(b => b.id === id);
  if (!b || b.complete) return false;
  const camp = s.buildings[0];
  for (const r of RESOURCES) camp.inventory[r] += b.delivered[r];
  for (const v of s.villagers) if (v.task?.destId === id) {
    if (v.cargo) { v.task.destId = camp.id; v.task.phase = 'drop'; v.task.path = findPath(s, v, camp) ?? []; }
    else v.task = null;
  }
  s.buildings = s.buildings.filter(b => b.id !== id); s.revision++;
  event(s, 'Baustelle aufgehoben. Material geht zurück ins Gründungslager.');
  return true;
}
function available(s: GameState, b: Building, r: Resource) {
  return b.inventory[r] - s.villagers.reduce((n, v) => n + (v.task?.sourceId === b.id && v.task.phase === 'pickup' && v.task.resource === r ? v.task.amount : 0), 0);
}
function incoming(s: GameState, b: Building, r: Resource) {
  return s.villagers.reduce((n, v) => n + (v.task?.destId === b.id && v.task.resource === r ? v.task.amount : 0), 0);
}
function unreservedStock(s: GameState, r: Resource) {
  return s.buildings.filter(b => b.complete).reduce((n, b) => n + available(s, b, r), 0);
}
function foundingReserve(s: GameState, r: Resource) {
  // Keep the first woodcutter affordable even if a player builds a sawmill first.
  return s.buildings.some(b => b.kind === 'woodcutter' && b.complete) ? 0 : DEFINITIONS.woodcutter.cost[r];
}
function sourceFor(s: GameState, v: Villager, r: Resource, exclude?: number) {
  return s.buildings.filter(b => b.complete && b.id !== exclude && available(s, b, r) > 0)
    .sort((a, b) => distance(v, a) - distance(v, b))
    .find(b => findPath(s, v, entrance(b)) !== null);
}
function assignHaul(s: GameState, v: Villager, from: Building, to: Building, r: Resource, amount: number) {
  if (!findPath(s, entrance(from), entrance(to))) return false;
  const path = findPath(s, v, entrance(from)); if (!path) return false;
  v.task = { kind: 'haul', phase: 'pickup', sourceId: from.id, destId: to.id, resource: r, amount, path, timer: 0 };
  return true;
}
function assignCarrier(s: GameState, v: Villager) {
  for (const b of s.buildings.filter(b => !b.complete)) for (const r of RESOURCES) {
    const need = DEFINITIONS[b.kind].cost[r] - b.delivered[r] - incoming(s, b, r);
    if (need <= 0) continue;
    const source = sourceFor(s, v, r, b.id);
    const budget = Math.max(0, unreservedStock(s, r) - (b.kind === 'woodcutter' ? 0 : foundingReserve(s, r)));
    if (source && budget > 0 && assignHaul(s, v, source, b, r, Math.min(2, need, available(s, source, r), budget))) return;
  }
  // Rotate between producers and goods. Fixed building order starves later mines
  // whenever early woodcutters keep producing faster than carriers collect.
  const producers = s.buildings.filter(b => b.complete && !isStorage(b))
    .sort((a, b) => (a.lastExportAt ?? -1) - (b.lastExportAt ?? -1) || distance(v, a) - distance(v, b) || a.id - b.id);
  for (const b of producers) for (let offset = 0; offset < RESOURCES.length; offset++) {
    const index = ((b.exportCursor ?? 0) + offset) % RESOURCES.length, r = RESOURCES[index];
    if (available(s, b, r) <= 0 || recipeFor(s, b)?.fuel === r) continue;
    const dest = s.buildings.filter(isStorage).sort((a, c) => distance(b, a) - distance(b, c)).find(c => findPath(s, b, c) !== null);
    if (dest && assignHaul(s, v, b, dest, r, Math.min(2, available(s, b, r)))) {
      b.lastExportAt = s.time; b.exportCursor = (index + 1) % RESOURCES.length; return;
    }
  }
}
function assignProducer(s: GameState, v: Villager, b: Building) {
  if (b.kind === 'mine') { assignMiner(s, v, b); return; }
  const recipe = recipeFor(s, b);
  if (recipe) {
    if (b.inventory[recipe.output] >= 24) return;
    if (recipe.fuel && b.inventory[recipe.fuel] < 1) { const fuel = sourceFor(s, v, recipe.fuel, b.id); if (fuel) assignHaul(s, v, fuel, b, recipe.fuel, 1); return; }
    if (!recipe.input) {
      v.task = { kind: 'craft', phase: 'work', destId: b.id, resource: recipe.output, amount: 1, path: findPath(s, v, b) ?? [], timer: recipe.seconds };
      return;
    }
    if (recipe.input === 'wood' && unreservedStock(s, 'wood') <= foundingReserve(s, 'wood')) return;
    const source = sourceFor(s, v, recipe.input, b.id);
    if (source) v.task = { kind: b.kind === 'sawmill' ? 'saw' : 'craft', phase: 'pickup', sourceId: source.id, destId: b.id, resource: recipe.input, amount: 1, path: findPath(s, v, source)!, timer: 0 };
    return;
  }
  const resource = b.kind === 'quarry' ? 'stone' : 'wood';
  if (b.inventory[resource] >= 16) return;
  const nodes = s.tiles.filter(t => t.node === (resource === 'stone' ? 'rock' : 'tree') && t.amount > 0 && distance(b, t) <= 9)
    .sort((a, c) => distance(v, a) - distance(v, c));
  for (const node of nodes) {
    const spots = [{ x: node.x - 1, z: node.z }, { x: node.x + 1, z: node.z }, { x: node.x, z: node.z - 1 }, { x: node.x, z: node.z + 1 }];
    const paths = spots.map(p => findPath(s, v, p)).filter((p): p is Point[] => p !== null).sort((a, c) => a.length - c.length);
    if (!paths.length) continue;
    v.task = { kind: 'gather', phase: 'work', destId: b.id, resource, amount: 2, node: { x: node.x, z: node.z }, path: paths[0], timer: resource === 'stone' ? 5 : 4 };
    return;
  }
}
function finishTask(s: GameState, v: Villager) {
  const t = v.task!;
  if (t.phase === 'pickup') {
    const source = s.buildings.find(b => b.id === t.sourceId);
    if (!source || source.inventory[t.resource] < t.amount) { v.task = null; return; }
    source.inventory[t.resource] -= t.amount;
    v.cargo = { resource: t.resource, amount: t.amount };
    const destination = s.buildings.find(b => b.id === t.destId) ?? s.buildings[0];
    t.destId = destination.id; t.phase = 'drop'; t.path = findPath(s, v, entrance(destination)) ?? [];
    return;
  }
  if (t.phase === 'work' && t.kind === 'gather') {
    const node = tileAt(s, t.node!.x, t.node!.z), amount = Math.min(t.amount, node.amount);
    if (!amount) { v.task = null; return; }
    node.amount -= amount;
    if (!node.amount) { node.node = null; s.revision++; }
    t.amount = amount; v.cargo = { resource: t.resource, amount };
    const dest = s.buildings.find(b => b.id === t.destId)!;
    t.phase = 'drop'; t.path = findPath(s, v, dest) ?? [];
    return;
  }
  if (t.phase === 'work' && (t.kind === 'saw' || t.kind === 'craft')) {
    const b = s.buildings.find(b => b.id === t.destId)!;
    const recipe = recipeFor(s, b)!;
    if (recipe.fuel) { if (b.inventory[recipe.fuel] < 1) return; b.inventory[recipe.fuel]--; }
    b.inventory[recipe.output] += recipe.count;
    v.cargo = null; v.task = null;
    return;
  }
  if (t.phase === 'drop') {
    const b = s.buildings.find(b => b.id === t.destId) ?? s.buildings[0];
    if (t.kind === 'saw' || t.kind === 'craft') { t.phase = 'work'; t.timer = recipeFor(s, b)!.seconds; return; }
    if (v.cargo) (b.complete ? b.inventory : b.delivered)[v.cargo.resource] += v.cargo.amount;
    v.cargo = null; v.task = null;
  }
}
export function step(s: GameState, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  // The application calls this in fixed 0.1-second increments.
  s.time += dt;
  for (const b of s.buildings) if (!b.complete && RESOURCES.every(r => b.delivered[r] >= DEFINITIONS[b.kind].cost[r])) {
    b.progress = Math.min(1, b.progress + dt / (b.kind === 'bridge' ? 12 : 8));
    if (b.progress >= 1) {
      b.complete = true; s.revision++;
      if (!s.milestones.includes(b.kind)) s.milestones.push(b.kind);
      event(s, `${DEFINITIONS[b.kind].name} fertiggestellt!`);
      if (b.kind === 'mine') openMine(s, b);
      if (b.kind === 'house' || b.kind === 'miningHouse') welcomeResidents(s);
      if (b.kind === 'outpost' && !s.won) { s.won = true; event(s, 'Ein neues Kapitel beginnt. Euer erster Außenposten steht!'); }
    }
  }
  if (Math.floor(s.time / 20) > s.ecologyTick) { s.ecologyTick = Math.floor(s.time / 20); regrowForest(s); }
  // Finish cargo trips before releasing staff; keep at least two general carriers.
  const producers = s.buildings.filter(b => b.complete && b.active && DEFINITIONS[b.kind].producer);
  for (const b of s.buildings.filter(b => DEFINITIONS[b.kind].producer)) {
    const staff = s.villagers.filter(v => v.job === b.id);
    let surplus = staff.length - (b.active && b.complete ? workerTarget(b) : 0);
    for (const v of [...staff].reverse()) if (surplus > 0 && !v.task && !v.mining) { v.job = null; surplus--; }
  }
  const room = (b: Building) => s.villagers.filter(v => v.job === b.id).length < workerTarget(b);
  // Mining-house residents get first choice of reachable mines near their home.
  for (const v of s.villagers.filter(v => v.home && !v.task && !v.mining && !producers.some(b => b.id === v.job && b.kind === 'mine'))) {
    if (v.job === null && s.villagers.filter(n => n.job === null).length <= 2) continue;
    const home = s.buildings.find(b => b.id === v.home)!;
    const mine = producers.filter(b => b.kind === 'mine' && room(b) && distance(b, home) <= 12)
      .sort((a, b) => distance(a, home) - distance(b, home) || a.id - b.id).find(b => findPath(s, v, b) !== null);
    if (mine) v.job = mine.id;
  }
  // Fill one place per business before assigning additional mine staff.
  for (let slot = 0; slot < 4; slot++) for (const b of producers) {
    if (workerTarget(b) <= slot || s.villagers.filter(v => v.job === b.id).length > slot) continue;
    const unemployed = s.villagers.filter(v => v.job === null);
    if (unemployed.length <= 2) continue;
    const worker = unemployed.filter(v => !v.task && !v.mining).sort((a, c) => distance(a, b) - distance(c, b) || a.id - c.id).find(v => findPath(s, v, b) !== null);
    if (worker) worker.job = b.id;
  }
  for (const v of s.villagers) {
    if (v.mining) { stepMiner(s, v, dt); continue; }
    if (!v.task) {
      const b = s.buildings.find(b => b.id === v.job);
      if (b?.active) assignProducer(s, v, b); else assignCarrier(s, v);
      continue;
    }
    const t = v.task;
    if (t.path.length) {
      const target = t.path[0], dx = target.x - v.x, dz = target.z - v.z, d = Math.hypot(dx, dz);
      const current = tileAt(s, Math.round(v.x), Math.round(v.z));
      const movement = dt * (current.road ? 2.4 : 1.5);
      v.facing = Math.atan2(dx, dz);
      if (d <= movement) { v.x = target.x; v.z = target.z; t.path.shift(); }
      else { v.x += dx / d * movement; v.z += dz / d * movement; }
    } else if (t.timer > 0) t.timer = Math.max(0, t.timer - dt * (1 + (s.level - 1) * .10));
    else finishTask(s, v);
  }
}
export function buildingStatus(s: GameState, b: Building): string {
  if (!b.complete) {
    const missing = RESOURCES.filter(r => b.delivered[r] < DEFINITIONS[b.kind].cost[r]);
    return missing.length ? `Wartet auf ${missing.map(r => NAMES[r]).join(', ')}` : 'Wird aufgebaut';
  }
  if (!b.active) return 'Betrieb pausiert';
  if (!DEFINITIONS[b.kind].producer) return b.kind === 'bridge' ? 'Brückenfeld begehbar' : 'Bereit';
  if (b.kind === 'mine') return mineStatus(s, b);
  const worker = s.villagers.find(v => v.job === b.id);
  if (!worker) return 'Wartet auf freien Arbeiter';
  const recipe = recipeFor(s, b);
  if (worker.task) return recipe ? `${recipe.input ? NAMES[recipe.input] + ' → ' : ''}${NAMES[recipe.output]} wird produziert` : 'Rohstoffe werden gewonnen';
  if (RESOURCES.some(r => b.inventory[r] >= (recipe ? 24 : 16))) return 'Ausgang voll · wartet auf Transport';
  return recipe ? `Wartet auf ${recipe.fuel && b.inventory[recipe.fuel] < 1 ? NAMES[recipe.fuel] : recipe.input ? NAMES[recipe.input] : 'Arbeiter'}` : 'Kein erreichbares Vorkommen im Umkreis';
}
export function serialize(s: GameState): string { return JSON.stringify(s); }
export function deserialize(raw: string): GameState {
  if (raw.length > 30_000_000) throw new Error('Der Spielstand ist zu groß.');
  const parsed = JSON.parse(raw);
  const s = parsed as GameState;
  const fail = () => { throw new Error('Dieser Spielstand ist beschädigt oder hat eine andere Version.'); };
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const integer = (n: unknown): n is number => finite(n) && Number.isInteger(n) && n >= 0;
  const validStock = (a: Stock) => a && RESOURCES.every(r => integer(a[r]));
  const validPoint = (p: Point, whole = true) => p && finite(p.x) && finite(p.z) && !!tileAt(s, Math.round(p.x), Math.round(p.z)) && (!whole || (Number.isInteger(p.x) && Number.isInteger(p.z)));
  if (!s || s.version !== 3 || !integer(s.seed) || !finite(s.time) || s.time < 0 || !integer(s.nextId) || !integer(s.revision) || typeof s.won !== 'boolean' || !Array.isArray(s.tiles) || s.tiles.length !== s.regions?.length * CHUNK_W * CHUNK_H || !Array.isArray(s.buildings) || !s.buildings.length || s.buildings.length > s.tiles.length || !Array.isArray(s.villagers) || s.villagers.length < 10 || s.villagers.length > 96 || !Array.isArray(s.milestones) || !Array.isArray(s.events)) fail();
  for (const [i, t] of s.tiles.entries()) if (!validPoint(t) || !inside(t.x, t.z) || !['grass', 'water'].includes(t.kind) || ![null, 'tree', 'rock'].includes(t.node) || !integer(t.amount) || !finite(t.height) || t.height < 0 || t.height > 20 || !finite(t.variant) || typeof t.road !== 'boolean') fail();
  if (!integer(s.level) || s.level < 1 || s.level > 4 || !Array.isArray(s.regions) || !s.regions.includes(0) || new Set(s.regions).size !== s.regions.length || !s.regions.every(id => integer(id) && Number.isSafeInteger(id)) || !integer(s.ecologyTick) || !integer(s.woodGrown)) fail();
  for (const t of s.tiles) if (!Object.hasOwn(BIOMES, t.biome) || t.region !== regionFor(t.x, t.z) || typeof t.discovered !== 'boolean' || t.discovered !== s.regions.includes(t.region) || !integer(t.sapling)) fail();
  const ids = new Set<number>();
  for (const b of s.buildings) {
    if (!validPoint(b) || !integer(b.id) || ids.has(b.id) || !Object.hasOwn(DEFINITIONS, b.kind) || !validStock(b.inventory) || !validStock(b.delivered) || !finite(b.progress) || b.progress < 0 || b.progress > 1 || typeof b.active !== 'boolean' || typeof b.complete !== 'boolean') fail();
    if (b.lastExportAt !== undefined && (!finite(b.lastExportAt) || b.lastExportAt < 0)) fail();
    if (b.exportCursor !== undefined && (!integer(b.exportCursor) || b.exportCursor >= RESOURCES.length)) fail();
    if (b.mineWorkers !== undefined && (b.kind !== 'mine' || !integer(b.mineWorkers) || b.mineWorkers < 1 || b.mineWorkers > 4)) fail();
    ids.add(b.id);
  }
  if (s.buildings[0].kind !== 'camp' || !s.buildings[0].complete || s.nextId <= Math.max(...ids)) fail();
  const peopleIds = new Set<number>();
  for (const v of s.villagers) {
    if (!validPoint(v, false) || !integer(v.id) || peopleIds.has(v.id) || typeof v.name !== 'string' || v.name.length > 40 || !finite(v.facing) || (v.job !== null && !ids.has(v.job))) fail();
    if (v.home !== undefined && !s.buildings.some(b => b.id === v.home && b.kind === 'miningHouse' && b.complete)) fail();
    peopleIds.add(v.id);
    if (v.cargo && (!RESOURCES.includes(v.cargo.resource) || !integer(v.cargo.amount) || v.cargo.amount < 1 || v.cargo.amount > 2)) fail();
    if (v.task) {
      const t = v.task;
      if (!['haul', 'gather', 'saw', 'craft'].includes(t.kind) || !['pickup', 'work', 'drop'].includes(t.phase) || !ids.has(t.destId) || (t.sourceId !== undefined && !ids.has(t.sourceId)) || !RESOURCES.includes(t.resource) || !integer(t.amount) || t.amount < 1 || t.amount > 2 || !finite(t.timer) || t.timer < 0 || !Array.isArray(t.path) || t.path.length > s.tiles.length || !t.path.every(p => validPoint(p)) || (t.kind === 'gather' && !validPoint(t.node!)) || (t.phase === 'pickup' && t.sourceId === undefined)) fail();
    } else if (v.cargo && !v.mining) fail();
  }
  if (!s.milestones.every(k => Object.hasOwn(DEFINITIONS, k)) || s.events.length > 30 || !s.events.every(e => finite(e.time) && typeof e.message === 'string' && e.message.length < 500)) fail();
  if (new Set(s.tiles.map(t => key(t.x, t.z))).size !== s.tiles.length) fail();
  if (s.buildings.some(b => b.kind === 'miningHouse' && s.villagers.filter(v => v.home === b.id).length > 4)) fail();
  validateUnderground(s);
  return s;
}

export const BIOMES: Record<Biome, { name: string; ground: string; leaves: string; density: number; wood: number; growth: number; description: string }> = {
  meadow: { name: 'Wiesenland', ground: '#93ad70', leaves: '#739452', density: 5, wood: 14, growth: 120, description: 'Fruchtbare Böden: Bauernhöfe produzieren hier besonders schnell.' },
  forest: { name: 'Nadelwald', ground: '#638b70', leaves: '#335e50', density: 10, wood: 24, growth: 60, description: 'Dichte Tannen, ertragreiche Bäume und rasche natürliche Erholung.' },
  highland: { name: 'Hochland', ground: '#9ea6a2', leaves: '#648277', density: 3, wood: 12, growth: 140, description: 'Große Steinvorkommen zwischen Felsen und schneebedeckten Höhen.' },
  desert: { name: 'Sonnensteppe', ground: '#cdb57b', leaves: '#9b9c59', density: 1, wood: 8, growth: 200, description: 'Trockene Böden, seltene Akazien, viel Gestein. Landwirtschaft braucht länger.' },
};
export function regionInfo(s: GameState, id: number) {
  const { cx, cz } = regionCoords(id), x = cx * CHUNK_W, z = cz * CHUNK_H;
  const biome = terrainSample(s.seed, x + 13, z + 12).biome;
  const radius = Math.abs(cx) + Math.abs(cz), tier = Math.min(4, Math.max(1, Math.ceil(radius / 2)));
  const cost = goods(0, 16 + radius * 4, 8 + radius * 3, tier > 1 ? radius * 4 : 0, tier > 2 ? radius : 0);
  return { id, x, z, biome, tier, cost, name: id === 0 ? 'Heimattal' : `${BIOMES[biome].name} · ${cx} / ${cz}`, description: `Region ${cx} / ${cz} · zusammenhängende Landschaft mit 26 × 24 Feldern.` };
}
export function knownRegions(s: GameState) {
  const ids = new Set(s.regions);
  for (const id of s.regions) { const { cx, cz } = regionCoords(id); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ids.add(regionId(cx + dx, cz + dz)); }
  return [...ids].map(id => regionInfo(s, id));
}
export const ERAS = [
  { name: 'Pionierlager', cap: 20, unlocks: 'Holz, Stein und die erste Brücke' },
  { name: 'Dorf', cap: 32, unlocks: 'Bauernhof, Försterei und Bergbau · 10 % schnelleres Arbeiten' },
  { name: 'Kleinstadt', cap: 48, unlocks: 'Werkstatt, Akademie und Rathaus · 20 % schnelleres Arbeiten' },
  { name: 'Handelsstadt', cap: 96, unlocks: 'Ferne Expeditionen und 96 Bewohner · 30 % schnelleres Arbeiten' },
];
export function worldBounds(s: GameState) {
  const regions = s.regions.map(id => regionInfo(s, id)), minX = Math.min(...regions.map(r => r.x)), minZ = Math.min(...regions.map(r => r.z));
  return { minX, minZ, width: Math.max(...regions.map(r => r.x + CHUNK_W)) - minX, height: Math.max(...regions.map(r => r.z + CHUNK_H)) - minZ };
}
export function populationCap(s: GameState) { return ERAS[s.level - 1].cap; }
export function workerTarget(b: Building) { return b.kind === 'mine' ? b.mineWorkers ?? 1 : 1; }
export function housingCapacity(s: GameState) { return Math.min(populationCap(s), 10 + s.buildings.filter(b => b.complete).reduce((n, b) => n + (b.kind === 'house' ? 2 : b.kind === 'miningHouse' ? 4 : 0), 0)); }
function welcomeResidents(s: GameState) {
  while (s.villagers.length < housingCapacity(s)) {
    const home = s.buildings.find(b => b.complete && b.kind === 'miningHouse' && s.villagers.filter(v => v.home === b.id).length < 4);
    addVillager(s, home);
  }
}
export function spendableStock(s: GameState): Stock {
  return Object.fromEntries(RESOURCES.map(r => [r, unreservedStock(s, r)])) as Stock;
}
function canSpend(s: GameState, cost: Stock) { const free = spendableStock(s); return RESOURCES.every(r => free[r] >= cost[r]); }
function spend(s: GameState, cost: Stock) {
  if (!canSpend(s, cost)) return false;
  for (const r of RESOURCES) {
    let remaining = cost[r];
    for (const b of s.buildings.filter(b => b.complete)) {
      const amount = Math.min(remaining, available(s, b, r)); b.inventory[r] -= amount; remaining -= amount;
      if (!remaining) break;
    }
  }
  return true;
}
export function expeditionStatus(s: GameState, id: number, diamonds = false): { ok: boolean; reason: string } {
  const r = knownRegions(s).find(r => r.id === id);
  if (!r) return { ok: false, reason: 'Unbekannte Region.' };
  if (s.regions.includes(id)) return { ok: false, reason: 'Bereits erkundet.' };
  if (!s.won) return { ok: false, reason: 'Gründe zuerst einen Außenposten.' };
  if (s.level < r.tier) return { ok: false, reason: `Benötigt die Stufe ${ERAS[r.tier - 1].name}.` };
  if (!knownRegions(s).some(n => s.regions.includes(n.id) && (Math.abs(r.x - n.x) === ORIGINAL_WIDTH && r.z === n.z || Math.abs(r.z - n.z) === ORIGINAL_HEIGHT && r.x === n.x))) return { ok: false, reason: 'Erkunde zuerst eine benachbarte Region.' };
  if (!canSpend(s, diamonds ? { ...goods(), diamond: 2 } : r.cost)) return { ok: false, reason: 'Noch nicht genug unreservierte Expeditionsvorräte.' };
  return { ok: true, reason: 'Bereit zum Aufbruch.' };
}
export function explore(s: GameState, id: number, diamonds = false) {
  const check = expeditionStatus(s, id, diamonds); if (!check.ok) return check;
  const r = regionInfo(s, id); spend(s, diamonds ? { ...goods(), diamond: 2 } : r.cost); s.regions.push(id); s.tiles.push(...generateChunk(s.seed, id));
  for (const depth of [1, 2, 3]) if (s.underground.some(t => t.depth === depth)) { ensureDepth(s, depth); for (const mine of s.buildings.filter(b => b.kind === 'mine' && b.complete)) revealCave(s, mine, depth); }
  s.revision++; event(s, `Neue Region entdeckt: ${r.name}. Ein Außenposten erschließt neue Bauplätze.`);
  return { ok: true, reason: `${r.name} ist jetzt erreichbar.` };
}
export interface Requirement { label: string; current: number; target: number; met: boolean }
export function civilisationProgress(s: GameState): { requirements: Requirement[]; cost: Stock; ready: boolean } {
  const counts = (kind: BuildingKind) => s.buildings.filter(b => b.complete && b.kind === kind).length;
  const requirement = (label: string, current: number, target: number): Requirement => ({ label, current, target, met: current >= target });
  let requirements: Requirement[] = [], cost = goods();
  if (s.level === 1) {
    const basics: BuildingKind[] = ['woodcutter', 'sawmill', 'quarry', 'house', 'warehouse', 'outpost'];
    requirements = [requirement('Alle 6 Pionier-Bauwerke', basics.filter(k => counts(k)).length, 6), requirement('Bewohner', s.villagers.length, 14)];
    cost = goods(0, 20, 10);
  } else if (s.level === 2) {
    requirements = [requirement('Bauernhöfe', counts('farm'), 2), requirement('Försterei', counts('forester'), 1), requirement('Lagerhäuser', counts('warehouse'), 2), requirement('Außenposten außerhalb des Tals', s.buildings.filter(b => b.kind === 'outpost' && b.complete && tileAt(s, b.x, b.z).region !== 0).length, 1), requirement('Regionen erkundet', s.regions.length, 3), requirement('Mineneingang', counts('mine'), 1), requirement('Schmelzhütte', counts('smelter'), 1), requirement('Bewohner', s.villagers.length, 22)];
    cost = goods(0, 50, 40, 30);
  } else if (s.level === 3) {
    const settled = new Set(s.buildings.filter(b => b.complete && b.kind === 'outpost').map(b => tileAt(s, b.x, b.z).region));
    requirements = [requirement('Rathaus', counts('townhall'), 1), requirement('Werkstatt', counts('workshop'), 1), requirement('Akademie', counts('academy'), 1), requirement('Regionen mit Außenposten', settled.size, 3), requirement('Regionen erkundet', s.regions.length, 5), requirement('Schmiede', counts('forge'), 1), requirement('Bewohner', s.villagers.length, 30)];
    cost = goods(0, 0, 0, 60, 24, 40);
  }
  return { requirements, cost, ready: s.level < 4 && requirements.every(r => r.met) && canSpend(s, cost) };
}
export function advanceCivilisation(s: GameState) {
  const progress = civilisationProgress(s);
  if (!progress.ready) return { ok: false, reason: s.level === 4 ? 'Die höchste Stufe ist erreicht.' : 'Erfülle zuerst alle Ziele und sammle die Aufstiegskosten.' };
  spend(s, progress.cost); s.level++; welcomeResidents(s); s.revision++;
  event(s, `Neue Zivilisationsstufe: ${ERAS[s.level - 1].name}! ${ERAS[s.level - 1].unlocks}.`);
  return { ok: true, reason: `Willkommen in der Stufe ${ERAS[s.level - 1].name}!` };
}
export function recipeFor(s: GameState, b: Building): { input: Resource | null; output: Resource; count: number; seconds: number; fuel?: Resource } | null {
  if (b.kind === 'smelter') { const metal = b.metal ?? 'iron'; return { input: (metal + 'Ore') as Resource, output: metal, count: 1, seconds: 10, fuel: 'coal' }; }
  if (b.kind === 'forge') return { input: 'iron', output: 'tools', count: 3, seconds: 8 };
  if (b.kind === 'sawmill') return { input: 'wood', output: 'planks', count: 2, seconds: 5 };
  if (b.kind === 'workshop') return { input: 'stone', output: 'tools', count: 1, seconds: 9 };
  if (b.kind === 'academy') return { input: b.study ?? 'planks', output: 'knowledge', count: b.study === 'gold' ? 20 : b.study === 'copper' ? 6 : 2, seconds: 12 };
  if (b.kind === 'farm') return { input: null, output: 'food', count: 2, seconds: tileAt(s, b.x, b.z).biome === 'meadow' ? 9 : tileAt(s, b.x, b.z).biome === 'desert' ? 22 : 14 };
  return null;
}
function reachable(s: GameState) {
  const start = entrance(s.buildings[0]), visited = new Set<string>([key(start.x, start.z)]), queue = [start];
  for (let i = 0; i < queue.length; i++) for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const p = { x: queue[i].x + dx, z: queue[i].z + dz }, k = key(p.x, p.z);
    if (visited.has(k) || !walkable(s, p.x, p.z)) continue;
    visited.add(k); queue.push(p);
  }
  return visited;
}
export function regrowForest(s: GameState) {
  const protectedFields = new Set<string>();
  for (const v of s.villagers) {
    protectedFields.add(key(Math.round(v.x), Math.round(v.z)));
    for (const p of [...(v.task?.path ?? []), ...(v.mining?.stage === 'approach' ? v.mining.path : [])]) protectedFields.add(key(p.x, p.z));
    if (v.task?.node) protectedFields.add(key(v.task.node.x, v.task.node.z));
  }
  const foresters = s.buildings.filter(b => b.kind === 'forester' && b.complete && b.active);
  const safe = (t: Tile) => t.kind === 'grass' && t.discovered && !t.node && !t.road && !protectedFields.has(key(t.x, t.z)) && !s.buildings.some(b => distance(entrance(b), t) <= 1 || distance(b, t) <= 1);
  for (const t of s.tiles) if (t.discovered && t.sapling) {
    if (!safe(t)) continue;
    t.sapling += 20;
    const fostered = foresters.some(b => distance(b, t) <= 7);
    if (t.sapling < (fostered ? BIOMES[t.biome].growth / 2 : BIOMES[t.biome].growth)) continue;
    t.node = 'tree';
    const access = reachable(s);
    if (s.buildings.some(b => !access.has(key(entrance(b).x, entrance(b).z))) || s.villagers.some(v => !v.depth && !access.has(key(Math.round(v.x), Math.round(v.z))))) { t.node = null; continue; }
    t.amount = BIOMES[t.biome].wood; t.sapling = 0; s.woodGrown += t.amount; s.revision++;
  }
  for (const region of s.regions.map(id => regionInfo(s, id))) {
    let planted = 0;
    const start = Math.floor(hash(s.seed + s.ecologyTick, region.id, 71) * ORIGINAL_WIDTH * ORIGINAL_HEIGHT);
    for (let i = 0; i < ORIGINAL_WIDTH * ORIGINAL_HEIGHT && planted < 2; i++) {
      const n = (start + i * 37) % (ORIGINAL_WIDTH * ORIGINAL_HEIGHT);
      const t = tileAt(s, region.x + n % ORIGINAL_WIDTH, region.z + Math.floor(n / ORIGINAL_WIDTH));
      if (!safe(t) || t.sapling) continue;
      const fostered = foresters.some(b => distance(b, t) <= 7);
      const nearby = s.tiles.filter(n => n.discovered && (n.node === 'tree' || n.sapling) && distance(n, t) <= 3).length;
      if (nearby >= BIOMES[t.biome].density + (fostered ? 3 : 0)) continue;
      t.sapling = 1; planted++; s.revision++;
    }
  }
}
