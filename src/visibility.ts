import { tileAt, type GameState, type Point, type Tile } from './sim.ts';

export const VISIBILITY_RADIUS = 30;
export function inViewRadius(p: Point, focus: Point) {
  return (p.x - focus.x) ** 2 + (p.z - focus.z) ** 2 <= VISIBILITY_RADIUS ** 2;
}
export function visibleTiles(s: GameState, focus: Point): Tile[] {
  const tiles: Tile[] = [];
  for (let z = Math.ceil(focus.z - VISIBILITY_RADIUS); z <= Math.floor(focus.z + VISIBILITY_RADIUS); z++) {
    for (let x = Math.ceil(focus.x - VISIBILITY_RADIUS); x <= Math.floor(focus.x + VISIBILITY_RADIUS); x++) {
      if (!inViewRadius({ x, z }, focus)) continue;
      const tile = tileAt(s, x, z);
      if (tile?.discovered) tiles.push(tile);
    }
  }
  return tiles;
}
