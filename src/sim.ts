export const WIDTH = 26;
export const HEIGHT = 24;
export const RESOURCES = ['wood', 'planks', 'stone'] as const;
export type Resource = typeof RESOURCES[number];
export type Stock = Record<Resource, number>;
export type Point = { x: number; z: number };
export type BuildingKind = 'camp' | 'woodcutter' | 'sawmill' | 'quarry' | 'house' | 'warehouse' | 'bridge' | 'outpost';
export type Tool = Exclude<BuildingKind, 'camp'> | 'road';
export const NAMES: Record<Resource, string> = { wood: 'Holz', planks: 'Bretter', stone: 'Stein' };
export const emptyStock = (): Stock => ({ wood: 0, planks: 0, stone: 0 });
export const DEFINITIONS: Record<BuildingKind, { name: string; cost: Stock; description: string; producer?: boolean }> = {
  camp: { name: 'Gründungslager', cost: emptyStock(), description: 'Hier begann eure Reise. Zentrales Lager und Heimat eurer ersten zehn Bewohner.' },
  woodcutter: { name: 'Holzfäller', cost: { wood: 4, planks: 0, stone: 2 }, description: 'Ein Arbeiter fällt Bäume im Umkreis von 9 Feldern und trägt das Holz zur Hütte.', producer: true },
  sawmill: { name: 'Sägewerk', cost: { wood: 5, planks: 0, stone: 3 }, description: 'Ein Arbeiter holt Holz und verarbeitet 1 Holz zu 2 Brettern.', producer: true },
  quarry: { name: 'Steinbruch', cost: { wood: 4, planks: 2, stone: 0 }, description: 'Ein Arbeiter gewinnt Stein aus Vorkommen im Umkreis von 9 Feldern.', producer: true },
  house: { name: 'Wohnhaus', cost: { wood: 3, planks: 4, stone: 2 }, description: 'Ein Zuhause für zwei neue Bewohner. Bis zu 20 Menschen können hier leben.' },
  warehouse: { name: 'Lagerhaus', cost: { wood: 4, planks: 4, stone: 3 }, description: 'Sammelt Waren aus nahen Betrieben und verkürzt Transportwege.' },
  bridge: { name: 'Brücke', cost: { wood: 0, planks: 12, stone: 6 }, description: 'Verbindet beide Ufer. Auf dem Fluss platzieren; Lieferung erfolgt vom Westufer.' },
  outpost: { name: 'Außenposten', cost: { wood: 6, planks: 12, stone: 10 }, description: 'Gründe am Ostufer einen neuen Ort. Das Ziel eures ersten Kapitels.' },
};
export interface Tile extends Point { height: number; kind: 'grass' | 'water'; node: 'tree' | 'rock' | null; amount: number; road: boolean; variant: number }
export interface Building extends Point { id: number; kind: BuildingKind; complete: boolean; delivered: Stock; inventory: Stock; progress: number; active: boolean }
export interface Task { kind: 'haul' | 'gather' | 'saw'; phase: 'pickup' | 'work' | 'drop'; sourceId?: number; destId: number; resource: Resource; amount: number; node?: Point; path: Point[]; timer: number }
export interface Villager extends Point { id: number; name: string; job: number | null; task: Task | null; cargo: { resource: Resource; amount: number } | null; facing: number }
export interface GameState { version: 1; seed: number; time: number; nextId: number; tiles: Tile[]; buildings: Building[]; villagers: Villager[]; milestones: BuildingKind[]; events: { time: number; message: string }[]; won: boolean; revision: number }

const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
export const tileAt = (s: GameState, x: number, z: number) => s.tiles[z * WIDTH + x];
export const inside = (x: number, z: number) => Number.isInteger(x) && Number.isInteger(z) && x >= 0 && x < WIDTH && z >= 0 && z < HEIGHT;
export const buildingAt = (s: GameState, x: number, z: number) => s.buildings.find(b => b.z === z && (b.x === x || (b.kind === 'bridge' && x === b.x + 1)));
export const entrance = (b: Building): Point => b.kind === 'bridge' ? { x: 12, z: b.z } : { x: b.x, z: b.z };
export const isStorage = (b: Building) => b.complete && ['camp', 'warehouse', 'outpost'].includes(b.kind);
export function walkable(s: GameState, x: number, z: number): boolean {
  if (!inside(x, z)) return false;
  const tile = tileAt(s, x, z);
  return !tile.node && (tile.kind !== 'water' || !!s.buildings.find(b => b.kind === 'bridge' && b.complete && b.z === z));
}
export function findPath(s: GameState, start: Point, target: Point): Point[] | null {
  const sx = Math.round(start.x), sz = Math.round(start.z);
  if (!walkable(s, sx, sz) || !walkable(s, target.x, target.z)) return null;
  const from = sz * WIDTH + sx, to = target.z * WIDTH + target.x;
  if (from === to) return [];
  const previous = new Int32Array(WIDTH * HEIGHT).fill(-1);
  const queue = [from]; previous[from] = from;
  for (let n = 0; n < queue.length; n++) {
    const current = queue[n], x = current % WIDTH, z = Math.floor(current / WIDTH);
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, nz = z + dz, index = nz * WIDTH + nx;
      if (!walkable(s, nx, nz) || previous[index] !== -1) continue;
      previous[index] = current;
      if (index === to) {
        const result: Point[] = [];
        for (let at = to; at !== from; at = previous[at]) result.push({ x: at % WIDTH, z: Math.floor(at / WIDTH) });
        return result.reverse();
      }
      queue.push(index);
    }
  }
  return null;
}

export function createGame(seed = 42): GameState {
  let randomState = seed;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const tiles: Tile[] = [];
  for (let z = 0; z < HEIGHT; z++) for (let x = 0; x < WIDTH; x++) {
    const river = x === 13 || x === 14;
    const v = random();
    const clear = (x >= 5 && x <= 12 && z >= 8 && z <= 16) || (x >= 15 && x <= 19 && z >= 10 && z <= 15);
    const hill = Math.max(0, Math.min(3, Math.floor((Math.hypot(x - 12, z - 13) - 9) / 2.8)));
    const node = !river && !clear && v > 0.70 ? (v > 0.93 ? 'rock' : 'tree') : null;
    tiles.push({ x, z, kind: river ? 'water' : 'grass', height: river ? 0.18 : 0.8 + hill * 0.38, node, amount: node === 'tree' ? 14 : node === 'rock' ? 48 : 0, road: false, variant: random() });
  }
  // Accessible starting deposits make the opening independent of random decoration.
  for (const [x, z, kind] of [[4, 10, 'tree'], [4, 12, 'tree'], [5, 7, 'tree'], [9, 6, 'rock'], [10, 6, 'rock']] as const) {
    const t = tiles[z * WIDTH + x]; t.node = kind; t.amount = kind === 'tree' ? 20 : 80;
  }
  const s: GameState = { version: 1, seed, time: 0, nextId: 2, tiles, buildings: [{ id: 1, x: 8, z: 12, kind: 'camp', complete: true, progress: 1, delivered: emptyStock(), inventory: { wood: 18, planks: 4, stone: 12 }, active: true }], villagers: [], milestones: [], events: [{ time: 0, message: 'Zehn Menschen. Ein neuer Anfang. Willkommen im Grünwassertal.' }], won: false, revision: 0 };
  for (let i = 0; i < 10; i++) addVillager(s);
  for (let x = 7; x <= 11; x++) tileAt(s, x, 13).road = true;
  return s;
}
const PEOPLE = ['Alva', 'Bruno', 'Clara', 'Emil', 'Frida', 'Jonas', 'Lina', 'Milo', 'Nora', 'Oskar', 'Ada', 'Ben', 'Ella', 'Finn', 'Greta', 'Hugo', 'Ida', 'Jona', 'Kira', 'Leo'];
function addVillager(s: GameState) {
  const i = s.villagers.length;
  s.villagers.push({ id: i + 1, name: PEOPLE[i], x: 7 + (i % 4), z: 13 + Math.floor(i / 4), job: null, task: null, cargo: null, facing: 0 });
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
  if (tool === 'bridge') {
    if (x !== 13 && x !== 14) return deny('Platziere die Brücke auf dem Fluss.');
    x = 13;
    if (buildingAt(s, x, z)) return deny('Hier ist bereits eine Brücke geplant.');
    if (!findPath(s, s.buildings[0], { x: 12, z }) || !walkable(s, 15, z)) return deny('Beide Ufer müssen frei sein.');
    return { ok: true, reason: 'Eine Brücke zu neuen Möglichkeiten.', x, z };
  }
  const tile = tileAt(s, x, z);
  if (tile.kind === 'water') return deny('Auf Wasser kannst du nur Brücken bauen.');
  if (tile.node) return deny(tile.node === 'tree' ? 'Hier steht ein Baum. Dein Holzfäller kann ihn abbauen.' : 'Hier liegt ein Steinvorkommen.');
  if (buildingAt(s, x, z)) return deny('Dieses Feld ist bereits bebaut.');
  if (tool === 'outpost' && x < 15) return deny('Gründe deinen Außenposten am anderen Flussufer.');
  if (!findPath(s, s.buildings[0], { x, z })) return deny('Noch nicht erreichbar. Baue zuerst eine Brücke.');
  if (tool === 'road' && tile.road) return deny('Hier liegt bereits ein Weg.');
  return { ok: true, reason: tool === 'road' ? 'Wege machen deine Bewohner 60 % schneller.' : 'Klicken, um die Baustelle zu planen.', x, z };
}
export function place(s: GameState, tool: Tool, x: number, z: number): { ok: boolean; reason: string; id?: number } {
  const check = placement(s, tool, x, z);
  if (!check.ok) return check;
  if (tool === 'road') { tileAt(s, x, z).road = true; s.revision++; return { ok: true, reason: 'Weg angelegt.' }; }
  const b: Building = { id: s.nextId++, x: check.x, z: check.z, kind: tool, complete: false, progress: 0, delivered: emptyStock(), inventory: emptyStock(), active: true };
  s.buildings.push(b); s.revision++;
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
  for (const b of s.buildings.filter(b => b.complete && !isStorage(b))) for (const r of RESOURCES) {
    if (available(s, b, r) <= 0) continue;
    const dest = s.buildings.filter(isStorage).sort((a, c) => distance(b, a) - distance(b, c)).find(c => findPath(s, b, c) !== null);
    if (dest && assignHaul(s, v, b, dest, r, Math.min(2, available(s, b, r)))) return;
  }
}
function assignProducer(s: GameState, v: Villager, b: Building) {
  if (b.kind === 'sawmill') {
    if (b.inventory.planks >= 16) return;
    if (unreservedStock(s, 'wood') <= foundingReserve(s, 'wood')) return;
    const source = sourceFor(s, v, 'wood', b.id);
    if (source) v.task = { kind: 'saw', phase: 'pickup', sourceId: source.id, destId: b.id, resource: 'wood', amount: 1, path: findPath(s, v, source)!, timer: 0 };
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
  if (t.phase === 'work' && t.kind === 'saw') {
    s.buildings.find(b => b.id === t.destId)!.inventory.planks += 2;
    v.cargo = null; v.task = null;
    return;
  }
  if (t.phase === 'drop') {
    const b = s.buildings.find(b => b.id === t.destId) ?? s.buildings[0];
    if (t.kind === 'saw') { t.phase = 'work'; t.timer = 5; return; }
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
      if (b.kind === 'house') for (let n = 0; n < 2 && s.villagers.length < 20; n++) addVillager(s);
      if (b.kind === 'outpost' && !s.won) { s.won = true; event(s, 'Ein neues Kapitel beginnt. Euer Außenposten am Ostufer steht!'); }
    }
  }
  // Each active workshop claims one idle person; at least two people remain carriers.
  for (const v of s.villagers) if (v.job && !v.task && !s.buildings.find(b => b.id === v.job)?.active) v.job = null;
  for (const b of s.buildings.filter(b => b.complete && b.active && DEFINITIONS[b.kind].producer)) {
    if (s.villagers.some(v => v.job === b.id)) continue;
    const unemployed = s.villagers.filter(v => v.job === null);
    const worker = unemployed.find(v => !v.task);
    if (worker && unemployed.length > 2) worker.job = b.id;
  }
  for (const v of s.villagers) {
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
    } else if (t.timer > 0) t.timer = Math.max(0, t.timer - dt);
    else finishTask(s, v);
  }
}
export function buildingStatus(s: GameState, b: Building): string {
  if (!b.complete) {
    const missing = RESOURCES.filter(r => b.delivered[r] < DEFINITIONS[b.kind].cost[r]);
    return missing.length ? `Wartet auf ${missing.map(r => NAMES[r]).join(', ')}` : 'Wird aufgebaut';
  }
  if (!b.active) return 'Betrieb pausiert';
  if (!DEFINITIONS[b.kind].producer) return b.kind === 'bridge' ? 'Beide Ufer verbunden' : 'Bereit';
  const worker = s.villagers.find(v => v.job === b.id);
  if (!worker) return 'Wartet auf freien Arbeiter';
  if (worker.task) return worker.task.kind === 'saw' ? 'Verarbeitet Holz zu Brettern' : 'Rohstoffe werden gewonnen';
  if (b.inventory.wood >= 16 || b.inventory.planks >= 16 || b.inventory.stone >= 16) return 'Ausgang voll · wartet auf Transport';
  return b.kind === 'sawmill' ? 'Wartet auf Holz' : 'Kein erreichbares Vorkommen im Umkreis';
}
export function serialize(s: GameState): string { return JSON.stringify(s); }
export function deserialize(raw: string): GameState {
  if (raw.length > 2_000_000) throw new Error('Der Spielstand ist zu groß.');
  const s = JSON.parse(raw) as GameState;
  const fail = () => { throw new Error('Dieser Spielstand ist beschädigt oder hat eine andere Version.'); };
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const integer = (n: unknown): n is number => finite(n) && Number.isInteger(n) && n >= 0;
  const validStock = (a: Stock) => a && RESOURCES.every(r => integer(a[r]));
  const validPoint = (p: Point, whole = true) => p && finite(p.x) && finite(p.z) && p.x >= 0 && p.x < WIDTH && p.z >= 0 && p.z < HEIGHT && (!whole || (Number.isInteger(p.x) && Number.isInteger(p.z)));
  if (!s || s.version !== 1 || !integer(s.seed) || !finite(s.time) || s.time < 0 || !integer(s.nextId) || !integer(s.revision) || typeof s.won !== 'boolean' || !Array.isArray(s.tiles) || s.tiles.length !== WIDTH * HEIGHT || !Array.isArray(s.buildings) || !s.buildings.length || s.buildings.length > WIDTH * HEIGHT || !Array.isArray(s.villagers) || s.villagers.length < 10 || s.villagers.length > 20 || !Array.isArray(s.milestones) || !Array.isArray(s.events)) fail();
  for (const [i, t] of s.tiles.entries()) if (!validPoint(t) || t.x !== i % WIDTH || t.z !== Math.floor(i / WIDTH) || !['grass', 'water'].includes(t.kind) || ![null, 'tree', 'rock'].includes(t.node) || !integer(t.amount) || !finite(t.height) || t.height < 0 || t.height > 4 || !finite(t.variant) || typeof t.road !== 'boolean') fail();
  const ids = new Set<number>();
  for (const b of s.buildings) {
    if (!validPoint(b) || !integer(b.id) || ids.has(b.id) || !Object.hasOwn(DEFINITIONS, b.kind) || !validStock(b.inventory) || !validStock(b.delivered) || !finite(b.progress) || b.progress < 0 || b.progress > 1 || typeof b.active !== 'boolean' || typeof b.complete !== 'boolean') fail();
    ids.add(b.id);
  }
  if (s.buildings[0].kind !== 'camp' || !s.buildings[0].complete || s.nextId <= Math.max(...ids)) fail();
  const peopleIds = new Set<number>();
  for (const v of s.villagers) {
    if (!validPoint(v, false) || !integer(v.id) || peopleIds.has(v.id) || typeof v.name !== 'string' || v.name.length > 40 || !finite(v.facing) || (v.job !== null && !ids.has(v.job))) fail();
    peopleIds.add(v.id);
    if (v.cargo && (!RESOURCES.includes(v.cargo.resource) || !integer(v.cargo.amount) || v.cargo.amount < 1 || v.cargo.amount > 2)) fail();
    if (v.task) {
      const t = v.task;
      if (!['haul', 'gather', 'saw'].includes(t.kind) || !['pickup', 'work', 'drop'].includes(t.phase) || !ids.has(t.destId) || (t.sourceId !== undefined && !ids.has(t.sourceId)) || !RESOURCES.includes(t.resource) || !integer(t.amount) || t.amount < 1 || t.amount > 2 || !finite(t.timer) || t.timer < 0 || !Array.isArray(t.path) || t.path.length > WIDTH * HEIGHT || !t.path.every(p => validPoint(p)) || (t.kind === 'gather' && !validPoint(t.node!)) || (t.phase === 'pickup' && t.sourceId === undefined)) fail();
    } else if (v.cargo) fail();
  }
  if (!s.milestones.every(k => Object.hasOwn(DEFINITIONS, k)) || s.events.length > 30 || !s.events.every(e => finite(e.time) && typeof e.message === 'string' && e.message.length < 500)) fail();
  return s;
}
