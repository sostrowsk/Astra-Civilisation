import { CHUNK_W, CHUNK_H, regionCoords, regionId } from './generator.ts';
import { tileAt, type GameState, type Point, type Tile } from './sim.ts';

export const VISIBILITY_RADIUS = 30;
export function inViewRadius(p: Point, focus: Point, radius = VISIBILITY_RADIUS) {
  return (p.x - focus.x) ** 2 + (p.z - focus.z) ** 2 <= radius ** 2;
}
export function visibleTiles(s: GameState, focus: Point, radius = VISIBILITY_RADIUS): Tile[] {
  const tiles: Tile[] = [];
  for (let z = Math.ceil(focus.z - radius); z <= Math.floor(focus.z + radius); z++) {
    for (let x = Math.ceil(focus.x - radius); x <= Math.floor(focus.x + radius); x++) {
      if (!inViewRadius({ x, z }, focus, radius)) continue;
      const tile = tileAt(s, x, z);
      if (tile?.discovered) tiles.push(tile);
    }
  }
  return tiles;
}

type SafeView = { radius: number; candidates: Point[]; keys: Set<string> };
const safeViews = new WeakMap<GameState, { regions: string; view: SafeView }>();
const pointKey = (p: Point) => `${p.x},${p.z}`;

// Region edges describe the actual discovered footprint, including bays and holes.
function safeView(s: GameState): SafeView {
  const regions = s.regions.join(','), cached = safeViews.get(s);
  if (cached?.regions === regions) return cached.view;
  const discovered = new Set(s.regions), edges: {x1:number;z1:number;x2:number;z2:number}[] = [];
  for (const id of s.regions) {
    const {cx,cz} = regionCoords(id), x=cx*CHUNK_W-.5, z=cz*CHUNK_H-.5;
    if (!discovered.has(regionId(cx-1,cz))) edges.push({x1:x,z1:z,x2:x,z2:z+CHUNK_H});
    if (!discovered.has(regionId(cx+1,cz))) edges.push({x1:x+CHUNK_W,z1:z,x2:x+CHUNK_W,z2:z+CHUNK_H});
    if (!discovered.has(regionId(cx,cz-1))) edges.push({x1:x,z1:z,x2:x+CHUNK_W,z2:z});
    if (!discovered.has(regionId(cx,cz+1))) edges.push({x1:x,z1:z+CHUNK_H,x2:x+CHUNK_W,z2:z+CHUNK_H});
  }
  let maximum = 0;
  const cells = s.tiles.filter(t=>t.discovered).map(t=>{
    let clearanceSquared = Infinity;
    for (const e of edges) {
      const dx = t.x - Math.max(e.x1,Math.min(e.x2,t.x)), dz = t.z - Math.max(e.z1,Math.min(e.z2,t.z));
      clearanceSquared = Math.min(clearanceSquared,dx*dx+dz*dz);
    }
    maximum = Math.max(maximum,clearanceSquared);
    return {point:{x:t.x,z:t.z},clearanceSquared};
  });
  const radius = Math.min(VISIBILITY_RADIUS,Math.sqrt(maximum));
  const candidates = cells.filter(c=>c.clearanceSquared+1e-9>=radius*radius).map(c=>c.point);
  const view = {radius,candidates,keys:new Set(candidates.map(pointKey))};
  safeViews.set(s,{regions,view}); return view;
}

export function constrainView(s: GameState, requested: Point): {focus: Point; radius: number} {
  const view = safeView(s), rounded={x:Math.round(requested.x),z:Math.round(requested.z)};
  if (view.keys.has(pointKey(rounded))) return {focus:rounded,radius:view.radius};
  let focus=view.candidates[0] ?? {x:8,z:12}, best=Infinity;
  for (const p of view.candidates) {
    const distance=(p.x-requested.x)**2+(p.z-requested.z)**2;
    if(distance<best) {best=distance;focus=p;}
  }
  return {focus,radius:view.radius};
}
