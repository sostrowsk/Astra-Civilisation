import { isMerchant, homeCapacity, bindHome, inLocalArea, workerPath, haulCapacity, merchantHome, sameSettlement, localBuilding, nearestCenter, LOCAL_RADIUS, availableVehicle, vehicleCapacity } from './logistics.ts';
import { excavationCheck, pitResource, treeGrowthStage } from './surface.ts';
import { capacity, roomFor, inbound, recordFlow, pruneHistory, equipmentFor, useEquipment, staffingSummary, type EconomyHistory } from './economy.ts';
import { CHUNK_W, CHUNK_H, key, hash, generateChunk, regionCoords, regionId, regionFor, randomSeed, terrainSample } from './generator.ts';
import { mineStatus, openMine, ensureDepth, revealCave, assignMiner, stepMiner, validateUnderground, type UndergroundTile, type MiningTrip } from './mining.ts';
export const ORIGINAL_WIDTH = CHUNK_W;
export const ORIGINAL_HEIGHT = CHUNK_H;
export const RESOURCES = ['wood', 'planks', 'stone', 'food', 'tools', 'knowledge', 'coal', 'copperOre', 'ironOre', 'goldOre', 'diamond', 'copper', 'iron', 'gold', 'shears', 'drill', 'wool', 'cloth', 'clothes', 'wire', 'gears', 'machineParts'] as const;
export type Resource = typeof RESOURCES[number];
export type Stock = Record<Resource, number>;
export type Point = { x: number; z: number };
export type BuildingKind = 'camp' | 'woodcutter' | 'sawmill' | 'quarry' | 'house' | 'miningHouse' | 'warehouse' | 'bridge' | 'outpost' | 'farm' | 'forester' | 'workshop' | 'academy' | 'townhall' | 'mine' | 'smelter' | 'forge' | 'sheepfold' | 'weaver' | 'tailor' | 'manufactory';
export type Tool = BuildingKind | 'road';
export const NAMES: Record<Resource, string> = { wood: 'Holz', planks: 'Bretter', stone: 'Stein', food: 'Nahrung', tools: 'Werkzeuge', knowledge: 'Wissen', coal: 'Kohle', copperOre: 'Kupfererz', ironOre: 'Eisenerz', goldOre: 'Golderz', diamond: 'Diamanten', copper: 'Kupfer', iron: 'Eisen', gold: 'Gold', shears: 'Scheren', drill: 'Bohrer', wool: 'Wolle', cloth: 'Stoff', clothes: 'Kleidung', wire: 'Kupferdraht', gears: 'Zahnräder', machineParts: 'Maschinenteile' };
export const goods = (wood = 0, planks = 0, stone = 0, food = 0, tools = 0, knowledge = 0): Stock => ({ wood, planks, stone, food, tools, knowledge, coal: 0, copperOre: 0, ironOre: 0, goldOre: 0, diamond: 0, copper: 0, iron: 0, gold: 0, shears: 0, drill: 0, wool: 0, cloth: 0, clothes: 0, wire: 0, gears: 0, machineParts: 0 });
export const emptyStock = (): Stock => goods();
export const DEFINITIONS: Record<BuildingKind, { name: string; cost: Stock; description: string; producer?: boolean; tier?: number }> = {
  camp: { name: 'Gründungslager', cost: emptyStock(), description: 'Hier begann eure Reise. Zentrales Lager und Heimat eurer ersten zehn Bewohner.' },
  woodcutter: { name: 'Holzfäller', cost: goods(4, 0, 2), description: 'Ein Arbeiter fällt Bäume im Umkreis von 9 Feldern und trägt das Holz zur Hütte.', producer: true },
  sawmill: { name: 'Sägewerk', cost: goods(5, 0, 3), description: 'Ein Arbeiter holt Holz und verarbeitet 1 Holz zu 2 Brettern.', producer: true },
  quarry: { name: 'Steinbruch', cost: goods(4, 2, 0), description: 'Ein Arbeiter gewinnt Stein aus Vorkommen im Umkreis von 9 Feldern.', producer: true },
  house: { name: 'Wohnhaus', cost: goods(3, 4, 2), description: 'Ein Zuhause für zwei neue Bewohner. Die Bevölkerungsgrenze steigt mit deiner Zivilisation auf bis zu 128.' },
  miningHouse: { name: 'Bergmannshaus', cost: goods(6, 10, 8), description: 'Vier Wohnplätze. Bewohner bevorzugen Minen in 12 Feldern Entfernung. Stelle dort bis zu vier Bergleute ein; freie Bewohner helfen beim Transport.', tier: 2 },
  warehouse: { name: 'Lagerhaus', cost: goods(4, 4, 3), description: 'Lager und Zuhause für vier Händler. Verbindet Orte: 2 Waren zu Fuß, ab Viehzucht 8 mit Pferdekarren, ab Kleinstadt 16 mit Kutsche.' },
  bridge: { name: 'Brücke', cost: goods(0, 4, 2), description: 'Ein Brückenfeld über Wasser. Vom erreichbaren Ufer aus Feld für Feld weiterbauen.' },
  farm: { name: 'Bauernhof', cost: goods(6, 8, 4), description: 'Erzeugt Nahrung. Auf Wiesen besonders ertragreich, in trockener Steppe langsamer.', producer: true, tier: 2 },
  forester: { name: 'Försterei', cost: goods(6, 10, 4), description: 'Fördert Wiederbewaldung im Umkreis von 7 Feldern. Wege und Bauplätze bleiben frei.', tier: 2 },
  workshop: { name: 'Werkstatt', cost: goods(8, 16, 20, 10), description: '1 Stein + 1 Brett → 1 einfaches Werkzeug. Versorgt Expeditionen und die Schmiede.', producer: true, tier: 2 },
  academy: { name: 'Akademie', cost: goods(8, 24, 24, 12), description: 'Erzeugt Wissen aus Brettern, Kupfer oder Gold. Forschungsrohstoff im Gebäude auswählen.', producer: true, tier: 4 },
  townhall: { name: 'Rathaus', cost: goods(12, 30, 40, 20, 8), description: 'Das Zentrum einer wachsenden Stadt. Zusätzlicher Lagerstandort und Meilenstein des Aufstiegs.', tier: 4 },
  mine: { name: 'Mineneingang', cost: goods(6, 8, 6), description: 'Bis zu vier Bergleute erkunden Höhlen und graben gemeinsam markierte Stollen. Besetzung am Gebäude einstellen. Drei Tiefen mit Kohle und Erzadern.', producer: true, tier: 2 },
  smelter: { name: 'Schmelzhütte', cost: goods(6, 12, 14), description: 'Verarbeitet 1 Erz und 1 Kohle zu einem Metallbarren. Metall im Gebäude auswählen.', producer: true, tier: 2 },
  forge: { name: 'Schmiede', cost: goods(6, 14, 12), description: '1 Eisen + 1 einfaches Werkzeug → 1 Schere oder Bohrer. Scheren ermöglichen Kleidung; Bohrer beschleunigen Bergbau.', producer: true, tier: 2 },
  sheepfold: { name: 'Schafzucht', cost: goods(8, 12, 6, 6), description: 'Versorgt Schafe mit Nahrung. 1 Nahrung → 2 Wolle für die Weberei.', producer: true, tier: 3 },
  weaver: { name: 'Weberei', cost: goods(8, 18, 10, 4), description: 'Webt aus 1 Wolle einen Stoffballen für die Schneiderei.', producer: true, tier: 3 },
  tailor: { name: 'Schneiderei', cost: goods(8, 20, 12, 8, 4), description: '1 Stoff → 1 Kleidung. Eine Schere hält 20 Arbeitszyklen. Kleidung ermöglicht die Manufaktur.', producer: true, tier: 3 },
  manufactory: { name: 'Manufaktur', cost: { ...goods(12, 30, 30, 20, 8), copper: 4, iron: 4 }, description: 'Kupfer → 2 Draht, Eisen → 2 Zahnräder; 1 Draht + 1 Zahnrad → 1 Maschinenteil. Maschinenteile beschleunigen 20 Arbeitszyklen geeigneter Betriebe um 25 %.', producer: true, tier: 5 },
  outpost: { name: 'Außenposten', cost: goods(6, 12, 10), description: 'Gründe einen neuen Ort mindestens 5 Felder vom Lager entfernt. Erschließt in neuen Regionen einen Baubereich von 9 Feldern.' },
};
export type Biome = 'meadow' | 'forest' | 'highland' | 'desert';
export interface Tile extends Point { priorityFelling?: boolean; priorityQuarrying?: boolean; excavation?: { depth: number; remaining: number; ordered: boolean }; biome: Biome; region: number; discovered: boolean; sapling: number;  height: number; kind: 'grass' | 'water'; waterway: 'river' | 'lake' | null; node: 'tree' | 'rock' | null; amount: number; road: boolean; variant: number }
export interface Building extends Point { priority?: number; forgeProduct?: 'shears' | 'drill'; manufacture?: 'wire' | 'gears' | 'machineParts'; equipmentUses?: number; id: number; kind: BuildingKind; complete: boolean; delivered: Stock; inventory: Stock; progress: number; active: boolean; bridgeEntrance?: Point; metal?: 'iron' | 'copper' | 'gold'; study?: 'planks' | 'copper' | 'gold'; mineWorkers?: number; mineDepth?: number; autoMine?: boolean; lastExportAt?: number; exportCursor?: number }
export interface Task { vehicle?: 'cart' | 'coach'; kind: 'return' | 'haul' | 'gather' | 'saw' | 'craft' | 'excavate'; layer?: number; phase: 'pickup' | 'work' | 'drop'; sourceId?: number; destId: number; resource: Resource; amount: number; node?: Point; path: Point[]; timer: number }
export interface Villager extends Point { role?: 'merchant'; settlement?: number; origin?: Point; id: number; name: string; home?: number; job: number | null; task: Task | null; cargo: { resource: Resource; amount: number } | null; facing: number; depth: number; mining: MiningTrip | null }
export interface GameState { version: 3; logisticsVersion?: 1; economyVersion?: 1 | 2; economy?: EconomyHistory; returns?: Stock; underground: UndergroundTile[]; level: number; regions: number[]; ecologyTick: number; woodGrown: number; seed: number; time: number; nextId: number; tiles: Tile[]; buildings: Building[]; villagers: Villager[]; milestones: BuildingKind[]; events: { time: number; message: string }[]; won: boolean; revision: number }

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
// A settlement remains playable even after its last building has been removed.
function settlementOrigins(s: GameState): Point[] {
  return [...s.buildings.filter(b => b.complete).map(entrance), ...s.villagers.filter(v => !v.depth).map(v => ({ x: Math.round(v.x), z: Math.round(v.z) }))].filter(p => walkable(s, p.x, p.z));
}
function reachableFromSettlement(s: GameState, p: Point) {
  return settlementOrigins(s).some(origin => findPath(s, origin, p) !== null);
}
export function walkable(s: GameState, x: number, z: number): boolean {
  if (!inside(x, z)) return false;
  const tile = tileAt(s, x, z);
  return !!tile && tile.discovered && !tile.node && (tile.kind !== 'water' || !!s.buildings.find(b => b.kind === 'bridge' && b.complete && b.z === z && x === b.x));
}
export function findPath(s: GameState, start: Point, target: Point, allowed?: (p: Point) => boolean): Point[] | null {
  const origin = { x: Math.round(start.x), z: Math.round(start.z) };
  if (!walkable(s, origin.x, origin.z) || !walkable(s, target.x, target.z) || (allowed && (!allowed(origin) || !allowed(target)))) return null;
  const from = key(origin.x, origin.z), to = key(target.x, target.z);
  if (from === to) return [];
  const previous = new Map<string, Point>(), queue = [origin]; previous.set(from, origin);
  for (let n = 0; n < queue.length; n++) {
    const current = queue[n];
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const next = { x: current.x + dx, z: current.z + dz }, k = key(next.x, next.z);
      if (previous.has(k) || !walkable(s, next.x, next.z) || (allowed && !allowed(next))) continue;
      previous.set(k, current);
      if (k === to) { const result: Point[] = []; for (let p = next; key(p.x, p.z) !== from; p = previous.get(key(p.x, p.z))!) result.push(p); return result.reverse(); }
      queue.push(next);
    }
  }
  return null;
}
export function createGame(seed = randomSeed()): GameState {
  const s: GameState = { version: 3, logisticsVersion: 1, economyVersion: 2, economy: { startedAt: 0, buckets: [] }, returns: emptyStock(), underground: [], level: 1, regions: [0], ecologyTick: 0, woodGrown: 0, seed: seed >>> 0, time: 0, nextId: 2, tiles: generateChunk(seed >>> 0, 0), buildings: [{ id: 1, x: 8, z: 12, kind: 'camp', complete: true, progress: 1, delivered: emptyStock(), inventory: goods(18, 4, 12), active: true }], villagers: [], milestones: [], events: [{ time: 0, message: 'Zehn Menschen. Eine neue Welt. Seed ' + (seed >>> 0) }], won: false, revision: 0 };
  for (let i = 0; i < 10; i++) addVillager(s, s.buildings[0]);
  for (let x = 7; x <= 11; x++) tileAt(s, x, 13).road = true;
  return s;
}
const PEOPLE = ['Alva', 'Bruno', 'Clara', 'Emil', 'Frida', 'Jonas', 'Lina', 'Milo', 'Nora', 'Oskar', 'Ada', 'Ben', 'Ella', 'Finn', 'Greta', 'Hugo', 'Ida', 'Jona', 'Kira', 'Leo'];
function addVillager(s: GameState, home?: Building, merchant = false) {
  const i = s.villagers.length;
  const arrival = home ?? s.buildings.find(b => b.complete && ['camp', 'house'].includes(b.kind)) ?? settlementOrigins(s)[0];
  s.villagers.push({ id: i + 1, name: PEOPLE[i % PEOPLE.length] + (i >= 20 ? ` ${Math.floor(i / 20) + 1}` : ''), x: i < 10 ? 7 + (i % 4) : 8, z: i < 10 ? 13 + Math.floor(i / 4) : 12, job: null, task: null, cargo: null, facing: 0, depth: 0, mining: null, ...(i >= 10 && arrival ? { x: arrival.x, z: arrival.z } : {}), ...(home ? { home: home.id } : {}), ...(merchant ? {role:'merchant' as const} : {}) });
  bindHome(s, s.villagers.at(-1)!, home);
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
  if (tool === 'camp' && s.buildings.some(b => b.kind === 'camp')) return deny('Es gibt bereits ein Gründungslager. Reiße es zuerst ab, um es zu versetzen.');
  if (tool !== 'road' && (DEFINITIONS[tool].tier ?? 1) > s.level) return deny(`Wird ab Stufe ${DEFINITIONS[tool].tier} freigeschaltet.`);
  if (tool === 'bridge') {
    if (tileAt(s, x, z).kind !== 'water') return deny('Platziere Brückenfelder auf Wasser.');
    if (buildingAt(s, x, z)) return deny('Hier ist bereits eine Brücke geplant.');
    const shore = [{ x: x - 1, z }, { x: x + 1, z }, { x, z: z - 1 }, { x, z: z + 1 }].find(p => reachableFromSettlement(s, p));
    if (!shore) return deny('Baue vom erreichbaren Ufer oder einer fertigen Brücke aus weiter.');
    return { ok: true, reason: 'Brückenfeld mit Zugang vom Ufer.', x, z };
  }
  const tile = tileAt(s, x, z);
  if (tile.kind === 'water') return deny('Auf Wasser kannst du nur Brücken bauen.');
  if (tile.excavation?.ordered || tile.excavation?.remaining || s.villagers.some(v => v.task?.kind === 'excavate' && v.task.phase === 'work' && v.task.node?.x === x && v.task.node.z === z)) return deny('Zuerst die begonnene Tagebauschicht fertig abgraben.');
  if (tile.node) return deny(tile.node === 'tree' ? 'Hier steht ein Baum. Dein Holzfäller kann ihn abbauen.' : 'Hier liegt ein Steinvorkommen.');
  if (buildingAt(s, x, z)) return deny('Dieses Feld ist bereits bebaut.');
  const camp = s.buildings.find(b => b.kind === 'camp');
  if (tool === 'outpost' && camp && distance(camp, tile) < 5) return deny('Halte mindestens 5 Felder Abstand vom Gründungslager.');
  if (!reachableFromSettlement(s, { x, z })) return deny('Noch nicht erreichbar. Baue zuerst eine Brücke.');
  if (tile.region !== 0 && tool !== 'camp' && tool !== 'outpost' && tool !== 'road' && !s.buildings.some(b => b.complete && (b.kind === 'outpost' || b.kind === 'camp') && distance(b, tile) <= 9)) return deny('Baue zuerst einen Außenposten in höchstens 9 Feldern Entfernung.');
  if (tool === 'road' && tile.road) return deny('Hier liegt bereits ein Weg.');
  return { ok: true, reason: tool === 'road' ? 'Wege machen deine Bewohner 60 % schneller.' : 'Klicken, um die Baustelle zu planen.', x, z };
}
export function place(s: GameState, tool: Tool, x: number, z: number): { ok: boolean; reason: string; id?: number } {
  const check = placement(s, tool, x, z);
  if (!check.ok) return check;
  if (tool === 'road') { tileAt(s, x, z).road = true; tileAt(s, x, z).sapling = 0; s.revision++; return { ok: true, reason: 'Weg angelegt.' }; }
  const b: Building = { id: s.nextId++, x: check.x, z: check.z, kind: tool, complete: false, progress: 0, delivered: emptyStock(), inventory: emptyStock(), active: true };
  if (tool === 'bridge') b.bridgeEntrance = [{ x: x - 1, z }, { x: x + 1, z }, { x, z: z - 1 }, { x, z: z + 1 }].find(p => reachableFromSettlement(s, p));
  if (tool === 'mine') { b.mineDepth = 1; b.autoMine = true; }
  tileAt(s, b.x, b.z).sapling = 0; s.buildings.push(b); s.revision++;
  event(s, `${DEFINITIONS[tool].name}: Die ersten Lieferungen werden vorbereitet.`);
  return { ok: true, reason: 'Baustelle geplant.', id: b.id };
}
export function cancelConstruction(s: GameState, id: number): boolean {
  const b = s.buildings.find(b => b.id === id);
  if (!b || b.complete) return false;
  s.returns ??= emptyStock();
  for (const r of RESOURCES) s.returns[r] += b.delivered[r];
  for (const v of s.villagers) if (v.task?.destId === id) {
    returnCargo(s, v);
  }
  s.buildings = s.buildings.filter(b => b.id !== id); s.revision++;
  distributeReturns(s);
  event(s, 'Baustelle aufgehoben. Material geht zurück ins Lager oder wartet als Rückgabe.');
  return true;
}
export function demolitionCheck(s: GameState, id: number): { ok: boolean; reason: string } {
  const b = s.buildings.find(b => b.id === id);
  if (!b?.complete) return { ok: false, reason: 'Nur fertige Gebäude können abgerissen werden. Baustellen lassen sich abbrechen.' };
  return { ok: true, reason: 'Gebäude kann abgerissen werden.' };
}
function returnCargo(s: GameState, v: Villager) {
  const vehicle = v.task?.vehicle;
  s.returns ??= emptyStock();
  if (v.cargo) s.returns[v.cargo.resource] += v.cargo.amount;
  v.cargo = null; v.task = null;
  const home = isMerchant(v) && merchantHome(s, v);
  if (home && vehicle) v.task = {kind:'return', phase:'drop', destId:home.id, resource:'wood', amount:1, path:workerPath(s,v,home) ?? [], timer:0, vehicle};
}
function distributeReturns(s: GameState) {
  if (!s.returns) return;
  for (const r of RESOURCES) for (const store of s.buildings.filter(isStorage)) {
    const amount = Math.min(s.returns[r], roomFor(s, store, r));
    store.inventory[r] += amount; s.returns[r] -= amount;
  }
}
export function demolishBuilding(s: GameState, id: number): { ok: boolean; reason: string } {
  const check = demolitionCheck(s, id); if (!check.ok) return check;
  const b = s.buildings.find(b => b.id === id)!;
  s.returns ??= emptyStock();
  for (const r of RESOURCES) s.returns[r] += b.inventory[r];
  for (const v of s.villagers) {
    if (v.home === id) { delete v.home; if (isMerchant(v)) returnCargo(s, v); }
    if (v.mining?.mineId === id) {
      returnCargo(s, v); v.mining = null; v.depth = 0; v.x = b.x; v.z = b.z;
    }
    if (v.task && (v.task.destId === id || v.task.sourceId === id || v.job === id)) {
      // Cargo has already left its source. Uncollected reservations simply expire.
      returnCargo(s, v);
    }
    if (v.job === id) v.job = null;
    if (v.settlement === id) delete v.settlement;
  }
  for (const tile of s.underground) if (tile.order === id) tile.order = null;
  s.buildings = s.buildings.filter(n => n.id !== id);
  if (b.kind === 'bridge') {
    for (const other of s.buildings.filter(n => n.kind === 'bridge')) {
      if (other.complete) other.bridgeEntrance = { x: other.x, z: other.z };
      else if (other.bridgeEntrance?.x === b.x && other.bridgeEntrance.z === b.z) {
        other.bridgeEntrance = [{ x: other.x - 1, z: other.z }, { x: other.x + 1, z: other.z }, { x: other.x, z: other.z - 1 }, { x: other.x, z: other.z + 1 }].find(p => walkable(s, p.x, p.z)) ?? { x: other.x, z: other.z };
      }
    }
    for (const v of s.villagers.filter(v => !v.depth)) {
      // Rescue anyone standing on the removed crossing onto the nearest safe tile.
      if (!walkable(s, Math.round(v.x), Math.round(v.z))) {
        const shore = s.tiles.filter(t => walkable(s, t.x, t.z)).sort((a, c) => distance(v, a) - distance(v, c))[0];
        if (shore) { v.x = shore.x; v.z = shore.z; }
      }
      const t = v.task;
      if (t) {
        const dest = entrance(s.buildings.find(n => n.id === t.destId)!);
        const source = s.buildings.find(n => n.id === t.sourceId);
        const target = t.path.at(-1) ?? { x: Math.round(v.x), z: Math.round(v.z) };
        const path = workerPath(s, v, target);
        if (!path || !workerPath(s, v, dest, target) || (t.phase === 'pickup' && source && !workerPath(s, v, dest, entrance(source)))) returnCargo(s, v);
        else t.path = path;
      }
      if (v.mining?.stage === 'approach') {
        const mine = s.buildings.find(n => n.id === v.mining!.mineId)!;
        const path = workerPath(s, v, mine);
        if (path) v.mining.path = path;
        else { returnCargo(s, v); v.mining = null; v.job = null; }
      }
    }
  }
  distributeReturns(s);
  s.revision++;
  const reason = `${DEFINITIONS[b.kind].name} abgerissen · das Feld ist wieder frei.`;
  event(s, reason); return { ok: true, reason };
}
function available(s: GameState, b: Building, r: Resource) {
  return b.inventory[r] - s.villagers.reduce((n, v) => n + (v.task?.sourceId === b.id && v.task.phase === 'pickup' && v.task.resource === r ? v.task.amount : 0), 0);
}
function incoming(s: GameState, b: Building, r: Resource) {
  return s.villagers.reduce((n, v) => n + (v.task?.kind !== 'return' && v.task?.destId === b.id && v.task.resource === r ? v.task.amount : 0), 0);
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
    .find(b => (!exclude || isMerchant(v) || sameSettlement(s, b, s.buildings.find(n => n.id === exclude)!)) && workerPath(s, v, entrance(b)) !== null);
}
function assignHaul(s: GameState, v: Villager, from: Building, to: Building, r: Resource, amount: number) {
  if (!isMerchant(v) && !sameSettlement(s, from, to)) return false;
  amount = Math.min(amount, haulCapacity(s, v));
  if (to.complete) amount = Math.min(amount, roomFor(s, to, r));
  if (amount <= 0 || !workerPath(s, v, entrance(to), entrance(from))) return false;
  const path = workerPath(s, v, entrance(from)); if (!path) return false;
  v.task = { kind: 'haul', ...(availableVehicle(s, v) ? {vehicle:availableVehicle(s, v)} : {}), phase: 'pickup', sourceId: from.id, destId: to.id, resource: r, amount, path, timer: 0 };
  return true;
}
function assignCarrier(s: GameState, v: Villager) {
  for (const b of s.buildings.filter(b => !b.complete && localBuilding(s, v, b))) for (const r of RESOURCES) {
    const need = DEFINITIONS[b.kind].cost[r] - b.delivered[r] - incoming(s, b, r);
    if (need <= 0) continue;
    const source = sourceFor(s, v, r, b.id);
    const budget = Math.max(0, unreservedStock(s, r) - (b.kind === 'woodcutter' ? 0 : foundingReserve(s, r)));
    if (source && budget > 0 && assignHaul(s, v, source, b, r, Math.min(haulCapacity(s, v), need, available(s, source, r), budget))) return;
  }
  for (const b of s.buildings.filter(b => b.complete && b.active && localBuilding(s, v, b) && equipmentFor(b) && !(b.equipmentUses ?? 0))) {
    const r = equipmentFor(b)!;
    if (b.inventory[r] || roomFor(s, b, r) < 2) continue;
    const source = sourceFor(s, v, r, b.id);
    if (source && assignHaul(s, v, source, b, r, 1)) return;
  }
  // Rotate between producers and goods. Fixed building order starves later mines
  // whenever early woodcutters keep producing faster than carriers collect.
  const producers = s.buildings.filter(b => b.complete && !isStorage(b) && localBuilding(s, v, b))
    .sort((a, b) => (a.lastExportAt ?? -1) - (b.lastExportAt ?? -1) || distance(v, a) - distance(v, b) || a.id - b.id);
  for (const b of producers) for (let offset = 0; offset < RESOURCES.length; offset++) {
    const index = ((b.exportCursor ?? 0) + offset) % RESOURCES.length, r = RESOURCES[index];
    const recipe = recipeFor(s, b);
    if (available(s, b, r) <= 0 || recipe?.fuel === r || recipe?.input === r || equipmentFor(b) === r) continue;
    const dest = s.buildings.filter(isStorage).sort((a, c) => distance(b, a) - distance(b, c)).find(c => roomFor(s, c, r) > 0 && (isMerchant(v) || sameSettlement(s, b, c)) && workerPath(s, v, c, b) !== null);
    if (dest && assignHaul(s, v, b, dest, r, Math.min(haulCapacity(s, v), available(s, b, r)))) {
      b.lastExportAt = s.time; b.exportCursor = (index + 1) % RESOURCES.length; return;
    }
  }
}
function assignMerchant(s: GameState, v: Villager) {
  const deliver = (dest: Building, r: Resource, need: number) => {
    if (need <= 0) return false;
    const sources = s.buildings.filter(b => {
      const recipe = recipeFor(s, b);
      const exportable = isStorage(b) || (recipe?.input !== r && recipe?.fuel !== r && equipmentFor(b) !== r);
      return b.complete && b.id !== dest.id && exportable && available(s, b, r) > 0;
    })
      .sort((a, b) => distance(v, a) + distance(a, dest) - distance(v, b) - distance(b, dest));
    for (const from of sources) {
      const budget = Math.max(0, unreservedStock(s, r) - (dest.kind === 'woodcutter' ? 0 : foundingReserve(s, r)));
      if (assignHaul(s, v, from, dest, r, Math.min(need, available(s, from, r), budget))) return true;
    }
    return false;
  };
  for (const b of s.buildings.filter(b => !b.complete)) for (const r of RESOURCES) {
    if (deliver(b, r, DEFINITIONS[b.kind].cost[r] - b.delivered[r] - incoming(s, b, r))) return;
  }
  for (const b of s.buildings.filter(b => b.complete && b.active && DEFINITIONS[b.kind].producer)) {
    const recipe = recipeFor(s, b), equipment = equipmentFor(b);
    for (const r of [recipe?.input, recipe?.fuel, equipment].filter((r): r is Resource => !!r)) {
      const desired = r === equipment ? 1 : Math.min(10, capacity(b, r));
      if (deliver(b, r, desired - b.inventory[r] - incoming(s, b, r))) return;
    }
  }
  // Spread exports across depots and resources; reservations prevent opposite-direction ping-pong.
  const stores = s.buildings.filter(isStorage).sort((a, b) => (a.lastExportAt ?? -1) - (b.lastExportAt ?? -1) || a.id - b.id);
  for (const from of stores) for (let offset = 0; offset < RESOURCES.length; offset++) {
    const index = ((from.exportCursor ?? 0) + offset) % RESOURCES.length, r = RESOURCES[index];
    for (const dest of stores.filter(b => b.id !== from.id && !sameSettlement(s, from, b))) {
      const surplus = Math.floor((available(s, from, r) - dest.inventory[r] - incoming(s, dest, r)) / 2);
      if (surplus < 2) continue;
      const budget = Math.max(0, unreservedStock(s, r) - foundingReserve(s, r));
      if (assignHaul(s, v, from, dest, r, Math.min(surplus, budget))) {
        from.lastExportAt = s.time; from.exportCursor = (index + 1) % RESOURCES.length; return;
      }
    }
  }
  assignCarrier(s, v);
}
function gatherPath(s: GameState, from: Point, node: Point, worker?: Villager): Point[] | undefined {
  const spots = [{ x: node.x - 1, z: node.z }, { x: node.x + 1, z: node.z }, { x: node.x, z: node.z - 1 }, { x: node.x, z: node.z + 1 }];
  return spots.map(p => worker ? workerPath(s, worker, p, from) : findPath(s, from, p)).filter((p): p is Point[] => p !== null).sort((a, b) => a.length - b.length)[0];
}
export function markTreeForFelling(s: GameState, x: number, z: number, marked = true): boolean {
  const tile = tileAt(s, x, z);
  if (!tile?.discovered || tile.node !== 'tree' || tile.amount <= 0) return false;
  if (marked) tile.priorityFelling = true; else delete tile.priorityFelling;
  s.revision++;
  return true;
}
export function markStoneForQuarrying(s: GameState, x: number, z: number, marked = true) {
  const t = tileAt(s, x, z);
  if (!t?.discovered || t.node !== 'rock' || !t.amount) return false;
  if (marked) t.priorityQuarrying = true; else delete t.priorityQuarrying;
  s.revision++; return true;
}
export function treeFellingStatus(s: GameState, tile: Tile): string {
  if (!tile.priorityFelling) return '';
  const working = s.villagers.find(v => v.task?.kind === 'gather' && v.task.phase === 'work' && v.task.resource === 'wood' && v.task.node?.x === tile.x && v.task.node.z === tile.z);
  if (working) return `${working.name} ${working.task!.path.length ? 'ist auf dem Weg zu diesem Baum' : 'fällt diesen Baum'}.`;
  const nearby = s.buildings.filter(b => b.kind === 'woodcutter' && b.complete && distance(b, tile) <= 9);
  if (!nearby.length) return 'Vorgemerkt · baue einen Holzfäller im Umkreis von 9 Feldern.';
  const active = nearby.filter(b => b.active);
  if (!active.length) return 'Vorgemerkt · der Holzfäller in Reichweite ist pausiert.';
  const reachable = active.filter(b => gatherPath(s, b, tile) !== undefined);
  if (!reachable.length) return 'Vorgemerkt · noch kein begehbarer Weg zum Baum.';
  const staffed = reachable.filter(b => s.villagers.some(v => v.job === b.id));
  if (!staffed.length) return 'Vorgemerkt · wartet auf einen zugeteilten Holzfäller.';
  if (staffed.every(b => roomFor(s, b, 'wood') < 2)) return 'Vorgemerkt · wartet auf freien Platz im Holzfällerlager.';
  return 'Bevorzugt vorgemerkt · laufende Arbeiten und Lieferungen werden zuerst beendet.';
}
function assignProducer(s: GameState, v: Villager, b: Building) {
  if (b.kind === 'mine') { assignMiner(s, v, b); return; }
  const recipe = recipeFor(s, b);
  if (recipe) {
    if (roomFor(s, b, recipe.output) < recipe.count) return;
    const equipment = equipmentFor(b);
    const needs = [recipe.input, recipe.fuel, b.kind === 'tailor' && equipment && !(b.equipmentUses ?? 0) ? equipment : null].filter((r): r is Resource => !!r);
    for (const r of needs) if (b.inventory[r] < 1) {
      if (r === 'wood' && unreservedStock(s, 'wood') <= foundingReserve(s, 'wood')) return;
      const source = sourceFor(s, v, r, b.id);
      if (source) assignHaul(s, v, source, b, r, 1);
      return;
    }
    const path = workerPath(s, v, b); if (!path) return;
    for (const r of [recipe.input, recipe.fuel]) if (r) { b.inventory[r]--; recordFlow(s, 'consumed', r, 1); }
    const boosted = equipment ? useEquipment(s, b) && equipment === 'machineParts' : false;
    v.task = { kind: 'craft', phase: 'work', destId: b.id, resource: recipe.output, amount: 1, path, timer: recipe.seconds / (boosted ? 1.25 : 1) };
    return;
  }
  const quarry = b.kind === 'quarry';
  const nodes = s.tiles.filter(t => t.discovered && inLocalArea(s, v, t) && distance(b, t) <= 9 && ((t.node === (quarry ? 'rock' : 'tree') && t.amount > 0) || (quarry && t.excavation?.ordered && excavationCheck(s, t.x, t.z).ok)))
    .sort((a, c) => (Number(!!(c.priorityFelling || c.priorityQuarrying)) * 2 + Number(!!c.excavation?.ordered)) - (Number(!!(a.priorityFelling || a.priorityQuarrying)) * 2 + Number(!!a.excavation?.ordered)) || distance(v, a) - distance(v, c));
  for (const node of nodes) {
    const pit = quarry && !node.node ? node.excavation : undefined;
    const resource = pit ? pitResource(s.seed, node.x, node.z, pit.depth + 1) : quarry ? 'stone' : 'wood';
    const reserved = pit ? s.villagers.reduce((n, w) => n + (w.task?.kind === 'excavate' && w.task.phase === 'work' && w.task.node?.x === node.x && w.task.node.z === node.z ? w.task.amount : 0), 0) : 0;
    const amount = pit ? Math.min(2, pit.remaining - reserved) : 2;
    if (amount <= 0 || roomFor(s, b, resource) < amount) continue;
    const path = pit ? workerPath(s, v, node) : gatherPath(s, v, node, v);
    if (!path) continue;
    v.task = { kind: pit ? 'excavate' : 'gather', ...(pit ? { layer: pit.depth + 1 } : {}), phase: 'work', destId: b.id, resource, amount, node: { x: node.x, z: node.z }, path, timer: quarry ? 5 : 4 };
    return;
  }
}
function finishTask(s: GameState, v: Villager) {
  const t = v.task!;
  if (t.kind === 'return') {
    const home = merchantHome(s, v);
    if (!home || distance(v, home) < .1) { v.task = null; return; }
    t.path = workerPath(s, v, home) ?? []; return;
  }
  if (t.phase === 'pickup') {
    const source = s.buildings.find(b => b.id === t.sourceId);
    if (!source || source.inventory[t.resource] < t.amount) { v.task = null; return; }
    source.inventory[t.resource] -= t.amount;
    v.cargo = { resource: t.resource, amount: t.amount };
    const destination = s.buildings.find(b => b.id === t.destId);
    if (!destination) { returnCargo(s, v); return; }
    t.destId = destination.id; t.phase = 'drop'; t.path = workerPath(s, v, entrance(destination)) ?? [];
    return;
  }
  if (t.phase === 'work' && t.kind === 'excavate') {
    const node = tileAt(s, t.node!.x, t.node!.z), pit = node.excavation;
    if (!pit || t.layer !== pit.depth + 1 || !pit.remaining) { v.task = null; return; }
    const amount = Math.min(t.amount, pit.remaining);
    pit.remaining -= amount; recordFlow(s, 'produced', t.resource, amount);
    if (!pit.remaining) { pit.depth++; pit.ordered = false; s.revision++; event(s, `Tagebau ${node.x} / ${node.z}: Ebene ${pit.depth} fertig abgegraben.`); }
    t.amount = amount; v.cargo = { resource: t.resource, amount }; t.phase = 'drop';
    t.path = workerPath(s, v, s.buildings.find(b => b.id === t.destId)!) ?? [];
    return;
  }
  if (t.phase === 'work' && t.kind === 'gather') {
    const node = tileAt(s, t.node!.x, t.node!.z), amount = Math.min(t.amount, node.amount);
    if (!amount) { v.task = null; return; }
    node.amount -= amount; recordFlow(s, 'produced', t.resource, amount);
    if (!node.amount) {
      if (node.priorityFelling) event(s, `Baum bei ${node.x} / ${node.z} gefällt · die Fläche ist frei.`);
      if (node.priorityQuarrying) event(s, `Steinvorkommen bei ${node.x} / ${node.z} erschöpft · die Fläche ist frei.`);
      delete node.priorityQuarrying; delete node.priorityFelling; node.node = null; s.revision++;
    }
    t.amount = amount; v.cargo = { resource: t.resource, amount };
    const dest = s.buildings.find(b => b.id === t.destId)!;
    t.phase = 'drop'; t.path = workerPath(s, v, dest) ?? [];
    return;
  }
  if (t.phase === 'work' && (t.kind === 'saw' || t.kind === 'craft')) {
    const b = s.buildings.find(b => b.id === t.destId)!;
    const recipe = recipeFor(s, b)!;
    if (roomFor(s, b, recipe.output, v.id) < recipe.count) return;
    b.inventory[recipe.output] += recipe.count; recordFlow(s, 'produced', recipe.output, recipe.count);
    v.cargo = null; v.task = null;
    return;
  }
  if (t.phase === 'drop') {
    const b = s.buildings.find(b => b.id === t.destId);
    if (!b) { returnCargo(s, v); return; }
    if (t.kind === 'saw' || t.kind === 'craft') { t.phase = 'work'; t.timer = recipeFor(s, b)!.seconds; return; }
    if (v.cargo) {
      if (b.complete && roomFor(s, b, v.cargo.resource, v.id) < v.cargo.amount) return;
      (b.complete ? b.inventory : b.delivered)[v.cargo.resource] += v.cargo.amount;
    }
    v.cargo = null; v.task = null;
    const home = merchantHome(s, v);
    if (isMerchant(v) && home) v.task = {kind:'return', phase:'drop', destId:home.id, resource:'wood', amount:1, path:workerPath(s,v,home) ?? [], timer:0, ...(t.vehicle ? {vehicle:t.vehicle} : {})};
  }
}
export function step(s: GameState, dt: number) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  // The application calls this in fixed 0.1-second increments.
  s.time += dt; pruneHistory(s); syncResidents(s);
  distributeReturns(s);
  for (const b of s.buildings) if (!b.complete && RESOURCES.every(r => b.delivered[r] >= DEFINITIONS[b.kind].cost[r])) {
    b.progress = Math.min(1, b.progress + dt / (b.kind === 'bridge' ? 12 : 8));
    if (b.progress >= 1) {
      b.complete = true; s.revision++;
      for (const r of RESOURCES) recordFlow(s, 'consumed', r, DEFINITIONS[b.kind].cost[r]);
      if (!s.milestones.includes(b.kind)) s.milestones.push(b.kind);
      event(s, `${DEFINITIONS[b.kind].name} fertiggestellt!`);
      if (b.kind === 'mine') openMine(s, b);
      if (['camp', 'house', 'miningHouse', 'warehouse'].includes(b.kind)) { syncResidents(s); welcomeResidents(s); }
      if (b.kind === 'outpost' && !s.won) { s.won = true; event(s, 'Ein neues Kapitel beginnt. Euer erster Außenposten steht!'); }
    }
  }
  if (Math.floor(s.time / 20) > s.ecologyTick) { s.ecologyTick = Math.floor(s.time / 20); regrowForest(s); }
  // Finish cargo trips before releasing staff; keep at least two general carriers.
  const producers = s.buildings.filter(b => b.complete && b.active && DEFINITIONS[b.kind].producer).sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1) || a.id - b.id);
  for (const b of s.buildings.filter(b => DEFINITIONS[b.kind].producer)) {
    const staff = s.villagers.filter(v => v.job === b.id);
    let surplus = staff.length - (b.active && b.complete ? workerTarget(b) : 0);
    for (const v of [...staff].reverse()) if (surplus > 0 && !v.task && !v.mining) { v.job = null; surplus--; }
  }
  for (const v of s.villagers) if (v.job && !v.task && !v.mining) {
    const b = s.buildings.find(b => b.id === v.job);
    if (isMerchant(v) || !b || !workerPath(s, v, b)) v.job = null;
  }
  // Essential first positions precede extra mining positions at equal priority.
  for (let priority = 2; priority >= 0; priority--) for (let slot = 0; slot < 4; slot++) for (const b of producers.filter(b => (b.priority ?? 1) === priority)) {
    if (workerTarget(b) <= slot || s.villagers.filter(v => v.job === b.id).length > slot) continue;
    const unemployed = s.villagers.filter(v => v.job === null && !isMerchant(v));
    const preferred = (v: Villager) => b.kind === 'mine' && v.home && s.buildings.some(h => h.id === v.home && h.kind === 'miningHouse' && distance(h, b) <= 12) ? 0 : 1;
    let worker = unemployed.length > 2 ? unemployed.filter(v => !v.task && !v.mining).sort((a, c) => preferred(a) - preferred(c) || distance(a, b) - distance(c, b) || a.id - c.id).find(v => workerPath(s, v, b) !== null) : undefined;
    if (!worker) worker = s.villagers.find(v => {
      if (isMerchant(v) || !v.job || v.task || v.mining) return false;
      const donor = producers.find(n => n.id === v.job);
      return donor && ((donor.priority ?? 1) < priority || ((donor.priority ?? 1) === priority && slot === 0 && s.villagers.filter(n => n.job === donor.id).length > 1)) && workerPath(s, v, b) !== null;
    });
    if (worker) worker.job = b.id;
  }
  for (const v of s.villagers) {
    if (v.mining) { stepMiner(s, v, dt); continue; }
    if (!v.task) {
      const b = s.buildings.find(b => b.id === v.job);
      if (isMerchant(v)) { if (merchantHome(s, v)) assignMerchant(s, v); }
      else if (b?.active && localBuilding(s, v, b)) assignProducer(s, v, b); else assignCarrier(s, v);
      continue;
    }
    const t = v.task;
    if (t.path.length) {
      const target = t.path[0], dx = target.x - v.x, dz = target.z - v.z, d = Math.hypot(dx, dz);
      const current = tileAt(s, Math.round(v.x), Math.round(v.z));
      const movement = dt * (current.road ? 2.4 : 1.5) * (v.task?.vehicle ? 1.3 : 1);
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
  if (!worker) { const staffing = staffingSummary(s); return staffing.carriers <= 2 ? 'Personalmangel · zwei Träger bleiben frei. Wohnraum schaffen oder Betriebspriorität erhöhen.' : 'Kein freier Bewohner im örtlichen 9-Felder-Bereich · Wohnhäuser und Außenposten in der Nähe schaffen.'; }
  const recipe = recipeFor(s, b);
  if (worker.task) return recipe ? `${recipe.input ? NAMES[recipe.input] + ' → ' : ''}${NAMES[recipe.output]} wird produziert` : 'Rohstoffe werden gewonnen';
  if (b.kind === 'quarry') {
    const targets = s.tiles.filter(t => distance(b, t) <= 9 && ((t.node === 'rock' && t.amount > 0) || t.excavation?.ordered));
    if (!targets.length) return 'Steinvorkommen erschöpft · freies Feld anklicken und Tagebau eröffnen.';
    const usable = targets.filter(t => !t.excavation?.ordered || excavationCheck(s, t.x, t.z).ok);
    if (usable.length && usable.every(t => roomFor(s, b, t.node === 'rock' ? 'stone' : pitResource(s.seed, t.x, t.z, t.excavation!.depth + 1)) < 2)) return 'Ausgang voll · wartet auf Transport';
    return 'Wartet auf einen erreichbaren Steinabbau oder Tagebauauftrag.';
  }
  if (recipe ? roomFor(s, b, recipe.output) < recipe.count : roomFor(s, b, 'wood') < 2) return 'Ausgang voll · wartet auf Transport';
  if (b.kind === 'tailor' && !(b.equipmentUses ?? 0) && !b.inventory.shears) return 'Wartet auf eine Schere aus der Schmiede';
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
  const legacy = s?.version === 3 && (s.economyVersion === undefined || s.economyVersion === 1);
  if (legacy && Array.isArray(s.buildings)) for (const b of s.buildings) for (const a of [b.inventory, b.delivered]) if (a) for (const r of ['shears', 'drill', 'wool', 'cloth', 'clothes', 'wire', 'gears', 'machineParts'] as const) a[r] ??= 0;
  if (!s || s.version !== 3 || !integer(s.seed) || !finite(s.time) || s.time < 0 || !integer(s.nextId) || !integer(s.revision) || typeof s.won !== 'boolean' || !Array.isArray(s.tiles) || s.tiles.length !== s.regions?.length * CHUNK_W * CHUNK_H || !Array.isArray(s.buildings) || s.buildings.length > s.tiles.length || !Array.isArray(s.villagers) || s.villagers.length < 10 || s.villagers.length > 128 + s.tiles.length * 4 || !Array.isArray(s.milestones) || !Array.isArray(s.events)) fail();
  for (const [i, t] of s.tiles.entries()) if (!validPoint(t) || !inside(t.x, t.z) || !['grass', 'water'].includes(t.kind) || ![null, 'tree', 'rock'].includes(t.node) || !integer(t.amount) || !finite(t.height) || t.height < 0 || t.height > 20 || !finite(t.variant) || typeof t.road !== 'boolean') fail();
  for (const t of s.tiles) if (t.priorityFelling !== undefined && (typeof t.priorityFelling !== 'boolean' || (t.priorityFelling && (!t.discovered || t.node !== 'tree' || !t.amount)))) fail();
  if (!integer(s.level) || s.level < 1 || s.level > 5 || !Array.isArray(s.regions) || !s.regions.includes(0) || new Set(s.regions).size !== s.regions.length || !s.regions.every(id => integer(id) && Number.isSafeInteger(id)) || !integer(s.ecologyTick) || !integer(s.woodGrown)) fail();
  for (const t of s.tiles) if (!Object.hasOwn(BIOMES, t.biome) || t.region !== regionFor(t.x, t.z) || typeof t.discovered !== 'boolean' || t.discovered !== s.regions.includes(t.region) || !integer(t.sapling)) fail();
  for (const t of s.tiles) {
    if (t.priorityQuarrying !== undefined && (typeof t.priorityQuarrying !== 'boolean' || (t.priorityQuarrying && (t.node !== 'rock' || !t.amount || !t.discovered)))) fail();
    const p = t.excavation;
    if (p && (!integer(p.depth) || p.depth > 3 || !integer(p.remaining) || p.remaining > 20 || typeof p.ordered !== 'boolean' || t.kind !== 'grass' || !t.discovered || t.node || (p.depth === 3 && (p.remaining || p.ordered)) || (p.ordered && !p.remaining))) fail();
    if (p && p.depth > 1) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dz) && (tileAt(s, t.x + dx, t.z + dz)?.excavation?.depth ?? 0) < p.depth - 1) fail();
    }
  }
  const ids = new Set<number>();
  for (const b of s.buildings) {
    if (!validPoint(b) || !integer(b.id) || ids.has(b.id) || !Object.hasOwn(DEFINITIONS, b.kind) || !validStock(b.inventory) || !validStock(b.delivered) || !finite(b.progress) || b.progress < 0 || b.progress > 1 || typeof b.active !== 'boolean' || typeof b.complete !== 'boolean') fail();
    if (b.lastExportAt !== undefined && (!finite(b.lastExportAt) || b.lastExportAt < 0)) fail();
    if (b.exportCursor !== undefined && (!integer(b.exportCursor) || b.exportCursor >= RESOURCES.length)) fail();
    if (b.mineWorkers !== undefined && (b.kind !== 'mine' || !integer(b.mineWorkers) || b.mineWorkers < 1 || b.mineWorkers > 4)) fail();
    if (b.priority !== undefined && ![0, 1, 2].includes(b.priority)) fail();
    if (b.manufacture !== undefined && !['wire', 'gears', 'machineParts'].includes(b.manufacture)) fail();
    if (b.forgeProduct !== undefined && !['shears', 'drill'].includes(b.forgeProduct)) fail();
    if (b.equipmentUses !== undefined && (!integer(b.equipmentUses) || b.equipmentUses > 40)) fail();
    ids.add(b.id);
  }
  if (s.buildings.filter(b => b.kind === 'camp').length > 1 || s.nextId <= Math.max(0, ...ids)) fail();
  const peopleIds = new Set<number>();
  for (const v of s.villagers) {
    if (!validPoint(v, false) || !integer(v.id) || peopleIds.has(v.id) || typeof v.name !== 'string' || v.name.length > 40 || !finite(v.facing) || (v.job !== null && !ids.has(v.job))) fail();
    if (v.role !== undefined && v.role !== 'merchant') fail();
    if (v.origin !== undefined && !validPoint(v.origin)) fail();
    if (v.settlement !== undefined && !s.buildings.some(b => b.id === v.settlement && ['camp', 'outpost', 'townhall'].includes(b.kind) && b.complete)) fail();
    if (v.home !== undefined && !s.buildings.some(b => b.id === v.home && homeCapacity(b) > 0 && (isMerchant(v) ? b.kind === 'warehouse' : b.kind !== 'warehouse'))) fail();
    if (isMerchant(v) && (v.job !== null || v.mining || (v.task && !['haul', 'return'].includes(v.task.kind)))) fail();
    peopleIds.add(v.id);
    if (v.cargo && (!RESOURCES.includes(v.cargo.resource) || !integer(v.cargo.amount) || v.cargo.amount < 1 || v.cargo.amount > (isMerchant(v) ? vehicleCapacity(v.task?.vehicle) : 2))) fail();
    if (v.task) {
      const t = v.task;
      if (!['return', 'haul', 'gather', 'saw', 'craft', 'excavate'].includes(t.kind) || !['pickup', 'work', 'drop'].includes(t.phase) || !ids.has(t.destId) || (t.sourceId !== undefined && !ids.has(t.sourceId)) || !RESOURCES.includes(t.resource) || !integer(t.amount) || t.amount < 1 || t.amount > (isMerchant(v) && t.kind === 'haul' ? vehicleCapacity(t.vehicle) : 2) || !finite(t.timer) || t.timer < 0 || !Array.isArray(t.path) || t.path.length > s.tiles.length || !t.path.every(p => validPoint(p)) || (['gather', 'excavate'].includes(t.kind) && !validPoint(t.node!)) || (t.kind === 'excavate' && (!integer(t.layer) || t.layer! < 1 || t.layer! > 3 || !['stone', 'coal'].includes(t.resource))) || (t.phase === 'pickup' && t.sourceId === undefined)) fail();
      if (t.vehicle !== undefined && (!isMerchant(v) || !merchantHome(s, v) || !['cart', 'coach'].includes(t.vehicle) || s.level < (t.vehicle === 'coach' ? 4 : 3))) fail();
      if (t.kind === 'return' && (!isMerchant(v) || t.destId !== v.home || t.phase !== 'drop' || v.cargo)) fail();
      if (t.kind === 'excavate') {
        const node = tileAt(s, t.node!.x, t.node!.z), pit = node.excavation;
        if (!pit || t.phase === 'pickup' || t.resource !== pitResource(s.seed, node.x, node.z, t.layer!) || (t.phase === 'work' && (t.layer !== pit.depth + 1 || !pit.remaining))) fail();
      }
    } else if (v.cargo && !v.mining) fail();
  }
  if (!s.milestones.every(k => Object.hasOwn(DEFINITIONS, k)) || s.events.length > 30 || !s.events.every(e => finite(e.time) && typeof e.message === 'string' && e.message.length < 500)) fail();
  if (new Set(s.tiles.map(t => key(t.x, t.z))).size !== s.tiles.length) fail();
  if (s.buildings.some(b => homeCapacity(b) && s.villagers.filter(v => v.home === b.id).length > homeCapacity(b))) fail();
  for (const home of s.buildings.filter(b => b.kind === 'warehouse')) for (const vehicle of ['cart', 'coach']) if (s.villagers.filter(v => v.home === home.id && v.task?.vehicle === vehicle).length > 1) fail();
  validateUnderground(s);
  if (legacy) {
    if (s.economyVersion === 1 && s.level === 5) s.level = 4;
    if (s.level === 3) s.level = 4;
    // Former Handelsstadt becomes Kleinstadt; its 96-person capacity is preserved.
    s.economyVersion = 2; s.economy = { startedAt: s.time, buckets: [] }; s.returns = emptyStock();
    for (const v of s.villagers) if (v.task && ['craft', 'saw'].includes(v.task.kind)) {
      const t = v.task;
      if (t.phase === 'work') { if (v.cargo) { const b = s.buildings.find(b => b.id === t.destId)!; b.inventory[v.cargo.resource] += v.cargo.amount; } v.cargo = null; v.task = null; }
      else t.kind = 'haul';
    }
    let removed = 0;
    for (const b of s.buildings) for (const r of RESOURCES) { const excess = Math.max(0, b.inventory[r] - capacity(b, r)); removed += excess; b.inventory[r] -= excess; }
    // Old unlimited transport reservations may exceed the new destination cap.
    // Reschedule pickups and put already carried goods in the bounded-return queue.
    for (const v of s.villagers) if (v.task?.kind === 'haul') {
      if (v.cargo) { s.returns[v.cargo.resource] += v.cargo.amount; v.cargo = null; }
      v.task = null;
    }
    for (const b of s.buildings.filter(b => b.complete)) for (const r of RESOURCES) {
      const n = Math.max(0, b.inventory[r] - Math.max(0, capacity(b, r) - inbound(s, b, r))); b.inventory[r] -= n; removed += n;
    }
    event(s, `Wirtschaft aktualisiert: ${removed} überschüssige Waren entfernt. Neue Lagergrenzen und fünf Stufen sind aktiv.`);
  }
  if (s.economyVersion !== 2 || (s.returns && !validStock(s.returns))) fail();
  if (s.economy && (!finite(s.economy.startedAt) || s.economy.startedAt > s.time || !Array.isArray(s.economy.buckets) || s.economy.buckets.length > 32 || s.economy.buckets.some(b => !finite(b.at) || b.at > s.time || !validStock(b.produced) || !validStock(b.consumed)))) fail();
  if (s.logisticsVersion !== undefined && s.logisticsVersion !== 1) fail();
  if (!s.logisticsVersion) {
    for (const v of s.villagers) {
      bindHome(s, v, s.buildings.find(b => b.id === v.home));
      if (!v.depth) {
        returnCargo(s, v); v.mining = null; v.job = null;
        const center = s.buildings.find(b => b.id === v.settlement);
        if (!inLocalArea(s, v, v) && center) { v.x = center.x; v.z = center.z; }
      }
    }
    syncResidents(s);
    for (const v of s.villagers.filter(v => !isMerchant(v) && !v.depth)) if (!inLocalArea(s, v, v)) {
      const home = s.buildings.find(b => b.id === v.home), center = s.buildings.find(b => b.id === v.settlement);
      const target = home && inLocalArea(s, v, home) ? home : center;
      if (target) { v.x = target.x; v.z = target.z; }
    }
    s.logisticsVersion = 1;
    event(s, 'Heimatorte und Händler eingerichtet. Waren bleiben erhalten; lokale Aufträge werden neu geplant.');
  }
  return s;
}

export const BIOMES: Record<Biome, { name: string; ground: string; leaves: string; density: number; wood: number; growth: number; description: string }> = {
  meadow: { name: 'Wiesenland', ground: '#93ad70', leaves: '#739452', density: 5, wood: 14, growth: 600, description: 'Fruchtbare Böden: Bauernhöfe produzieren hier besonders schnell.' },
  forest: { name: 'Nadelwald', ground: '#638b70', leaves: '#335e50', density: 10, wood: 24, growth: 480, description: 'Dichte Tannen, ertragreiche Bäume und rasche natürliche Erholung.' },
  highland: { name: 'Hochland', ground: '#9ea6a2', leaves: '#648277', density: 3, wood: 12, growth: 720, description: 'Große Steinvorkommen zwischen Felsen und schneebedeckten Höhen.' },
  desert: { name: 'Sonnensteppe', ground: '#cdb57b', leaves: '#9b9c59', density: 1, wood: 8, growth: 900, description: 'Trockene Böden, seltene Akazien, viel Gestein. Landwirtschaft braucht länger.' },
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
  // Concentric coordinate rings: all ±1 regions (including diagonals) before ±2.
  const ring = (r: { x: number; z: number }) => Math.max(Math.abs(r.x) / CHUNK_W, Math.abs(r.z) / CHUNK_H);
  return [...ids].map(id => regionInfo(s, id)).sort((a, b) => ring(a) - ring(b) || a.z - b.z || a.x - b.x);
}
export const ERAS = [
  { name: 'Pionierlager', cap: 20, unlocks: 'Holz, Stein und die erste Brücke' },
  { name: 'Dorf', cap: 32, unlocks: 'Landwirtschaft, Bergbau und Metallwerkzeuge · 10 % schnelleres Arbeiten' },
  { name: 'Viehzucht', cap: 48, unlocks: 'Schafzucht, Weberei und Schneiderei · 20 % schnelleres Arbeiten' },
  { name: 'Kleinstadt', cap: 96, unlocks: 'Akademie und Rathaus · 30 % schnelleres Arbeiten' },
  { name: 'Manufaktur', cap: 128, unlocks: 'Draht, Zahnräder und Maschinenteile · 40 % schnelleres Arbeiten' },
];
export function worldBounds(s: GameState) {
  const regions = s.regions.map(id => regionInfo(s, id)), minX = Math.min(...regions.map(r => r.x)), minZ = Math.min(...regions.map(r => r.z));
  return { minX, minZ, width: Math.max(...regions.map(r => r.x + CHUNK_W)) - minX, height: Math.max(...regions.map(r => r.z + CHUNK_H)) - minZ };
}
export function populationCap(s: GameState) { return ERAS[s.level - 1].cap + s.buildings.filter(b => b.kind === 'warehouse' && b.complete).length * 4; }
export function workerTarget(b: Building) { return b.kind === 'mine' ? b.mineWorkers ?? 1 : 1; }
export function housingCapacity(s: GameState) {
  const local = s.buildings.filter(b => b.kind !== 'warehouse').reduce((n, b) => n + homeCapacity(b), 0);
  return Math.min(ERAS[s.level - 1].cap, local) + s.buildings.filter(b => b.kind === 'warehouse' && b.complete).length * 4;
}
export function syncResidents(s: GameState) {
  const homes = s.buildings.filter(b => homeCapacity(b) && b.kind !== 'warehouse');
  for (const v of s.villagers.filter(v => !isMerchant(v))) {
    if (!v.origin) bindHome(s, v, s.buildings.find(b => b.id === v.home));
    const homeBuilding = s.buildings.find(b => b.id === v.home), center = homeBuilding && nearestCenter(s, homeBuilding);
    if (center && v.settlement !== center.id && !v.task && !v.mining && Math.max(Math.abs(v.x - center.x), Math.abs(v.z - center.z)) <= LOCAL_RADIUS) bindHome(s, v, homeBuilding);
    if (!v.home) {
      const home = homes.filter(b => {
        const center = nearestCenter(s, b) ?? b;
        return Math.max(Math.abs(v.x - center.x), Math.abs(v.z - center.z)) <= LOCAL_RADIUS && s.villagers.filter(n => n.home === b.id).length < homeCapacity(b);
      })
        .sort((a, b) => distance(v, a) - distance(v, b))[0];
      if (home) bindHome(s, v, home);
    }
  }
  for (const home of s.buildings.filter(b => b.kind === 'warehouse' && b.complete)) {
    while (s.villagers.filter(v => isMerchant(v) && v.home === home.id).length < 4) {
      const displaced = s.villagers.find(v => isMerchant(v) && !merchantHome(s, v) && !v.task);
      if (displaced) { bindHome(s, displaced, home); displaced.x = home.x; displaced.z = home.z; }
      else addVillager(s, home, true);
    }
  }
}
function welcomeResidents(s: GameState) {
  const localHomes = s.buildings.filter(b => homeCapacity(b) && b.kind !== 'warehouse');
  const limit = Math.min(ERAS[s.level - 1].cap, localHomes.reduce((n, b) => n + homeCapacity(b), 0));
  while (s.villagers.filter(v => !isMerchant(v)).length < limit) {
    const home = localHomes.find(b => s.villagers.filter(v => v.home === b.id).length < homeCapacity(b));
    if (!home) break;
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
      const amount = Math.min(remaining, available(s, b, r)); b.inventory[r] -= amount; remaining -= amount; recordFlow(s, 'consumed', r, amount);
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
    requirements = [requirement('Bauernhof', counts('farm'), 1), requirement('Mineneingang', counts('mine'), 1), requirement('Schmelzhütte', counts('smelter'), 1), requirement('Bewohner', s.villagers.length, 18)];
    cost = goods(0, 25, 20, 20);
  } else if (s.level === 3) {
    requirements = [requirement('Schafzucht', counts('sheepfold'), 1), requirement('Weberei', counts('weaver'), 1), requirement('Schneiderei', counts('tailor'), 1), requirement('Lagerhäuser', counts('warehouse'), 2), requirement('Regionen erkundet', s.regions.length, 3), requirement('Bewohner', s.villagers.length, 24)];
    cost = { ...goods(0, 40, 30, 30, 4), clothes: 10 };
  } else if (s.level === 4) {
    requirements = [requirement('Rathaus', counts('townhall'), 1), requirement('Werkstatt', counts('workshop'), 1), requirement('Akademie', counts('academy'), 1), requirement('Schafzucht', counts('sheepfold'), 1), requirement('Weberei', counts('weaver'), 1), requirement('Schneiderei', counts('tailor'), 1), requirement('Schmiede', counts('forge'), 1), requirement('Bewohner', s.villagers.length, 40)];
    cost = { ...goods(0, 40, 30, 60, 20, 40), clothes: 30, copper: 10, iron: 10 };
  }
  return { requirements, cost, ready: s.level < 5 && requirements.every(r => r.met) && canSpend(s, cost) };
}
export function advanceCivilisation(s: GameState) {
  const progress = civilisationProgress(s);
  if (!progress.ready) return { ok: false, reason: s.level === 5 ? 'Die höchste Stufe ist erreicht.' : 'Erfülle zuerst alle Ziele und sammle die Aufstiegskosten.' };
  spend(s, progress.cost); s.level++; syncResidents(s); welcomeResidents(s); s.revision++;
  event(s, `Neue Zivilisationsstufe: ${ERAS[s.level - 1].name}! ${ERAS[s.level - 1].unlocks}.`);
  return { ok: true, reason: `Willkommen in der Stufe ${ERAS[s.level - 1].name}!` };
}
export function recipeFor(s: GameState, b: Building): { input: Resource | null; output: Resource; count: number; seconds: number; fuel?: Resource } | null {
  if (b.kind === 'smelter') { const metal = b.metal ?? 'iron'; return { input: (metal + 'Ore') as Resource, output: metal, count: 1, seconds: 10, fuel: 'coal' }; }
  if (b.kind === 'manufactory') { const product = b.manufacture ?? 'wire'; return { input: product === 'wire' ? 'copper' : product === 'gears' ? 'iron' : 'wire', fuel: product === 'machineParts' ? 'gears' : undefined, output: product, count: product === 'machineParts' ? 1 : 2, seconds: 12 }; }
  if (b.kind === 'forge') return { input: 'iron', fuel: 'tools', output: b.forgeProduct ?? 'shears', count: 1, seconds: 12 };
  if (b.kind === 'sheepfold') return { input: 'food', output: 'wool', count: 2, seconds: 12 };
  if (b.kind === 'weaver') return { input: 'wool', output: 'cloth', count: 1, seconds: 10 };
  if (b.kind === 'tailor') return { input: 'cloth', output: 'clothes', count: 1, seconds: 10 };
  if (b.kind === 'sawmill') return { input: 'wood', output: 'planks', count: 2, seconds: 5 };
  if (b.kind === 'workshop') return { input: 'stone', fuel: 'planks', output: 'tools', count: 1, seconds: 9 };
  if (b.kind === 'academy') return { input: b.study ?? 'planks', output: 'knowledge', count: b.study === 'gold' ? 20 : b.study === 'copper' ? 6 : 2, seconds: 12 };
  if (b.kind === 'farm') return { input: null, output: 'food', count: 2, seconds: tileAt(s, b.x, b.z).biome === 'meadow' ? 9 : tileAt(s, b.x, b.z).biome === 'desert' ? 22 : 14 };
  return null;
}
function reachable(s: GameState) {
  const queue = settlementOrigins(s).slice(0, 1), visited = new Set(queue.map(p => key(p.x, p.z)));
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
  const safe = (t: Tile) => t.kind === 'grass' && t.discovered && !t.node && !t.road && !t.excavation && !protectedFields.has(key(t.x, t.z)) && !s.buildings.some(b => distance(entrance(b), t) <= 1 || distance(b, t) <= 1);
  for (const t of s.tiles) if (t.discovered && t.sapling) {
    if (!safe(t)) continue;
    const previousStage = treeGrowthStage(t);
    const fostered = foresters.some(b => distance(b, t) <= 7);
    t.sapling += fostered ? 40 : 20;
    if (treeGrowthStage(t) !== previousStage) s.revision++;
    if (t.sapling < BIOMES[t.biome].growth) continue;
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
