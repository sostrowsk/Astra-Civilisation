import type { Tile, Biome } from './sim.ts';
export const CHUNK_W = 26, CHUNK_H = 24;
export const key = (x: number, z: number) => `${x},${z}`;
export function hash(seed: number, x: number, z: number) {
  let n = Math.imul(x + 17, 374761393) ^ Math.imul(z + 31, 668265263) ^ Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function noise(seed: number, x: number, z: number, scale: number) {
  x /= scale; z /= scale;
  const ix = Math.floor(x), iz = Math.floor(z), fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash(seed, ix, iz) * (1 - fx) + hash(seed, ix + 1, iz) * fx;
  const b = hash(seed, ix, iz + 1) * (1 - fx) + hash(seed, ix + 1, iz + 1) * fx;
  return a * (1 - fz) + b * fz;
}
const zig = (n: number) => n >= 0 ? n * 2 : -n * 2 - 1;
const unzig = (n: number) => n % 2 === 0 ? n / 2 : -(n + 1) / 2;
export function regionId(cx: number, cz: number) { const a = zig(cx), b = zig(cz); return (a + b) * (a + b + 1) / 2 + b; }
export function regionCoords(id: number) { const w = Math.floor((Math.sqrt(8 * id + 1) - 1) / 2), b = id - w * (w + 1) / 2; return { cx: unzig(w - b), cz: unzig(b) }; }
export function regionFor(x: number, z: number) { return regionId(Math.floor(x / CHUNK_W), Math.floor(z / CHUNK_H)); }
export function seedNumber(value: string) {
  if (/^\d+$/.test(value.trim())) return Number(BigInt(value.trim()) % 4294967296n);
  let n = 2166136261; for (const char of value) n = Math.imul(n ^ char.codePointAt(0)!, 16777619); return n >>> 0;
}
export function randomSeed() { return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]; }
/** Water geometry is sampled in world space, before any biome or chunk decision. */
export function terrainSample(seed: number, x: number, z: number) {
  let waterDistance = Infinity, lake = false;
  const band = Math.floor(x / 96);
  for (let b = band - 1; b <= band + 1; b++) {
    const center = (zz: number) => b * 96 + 35 + hash(seed + 90, b, 0) * 14 + (noise(seed + b, zz, 11, 38) - .5) * 24;
    const river = Math.abs(x - center(z)) - (1.0 + noise(seed + 70, x, z, 42) * .8);
    waterDistance = Math.min(waterDistance, river);
    const reach = Math.floor(z / 64);
    for (let r = reach - 1; r <= reach + 1; r++) {
      const lz = r * 64 + 22 + hash(seed, b, r) * 22, lx = center(lz);
      const rx = 4 + hash(seed + 1, b, r) * 6, rz = 5 + hash(seed + 2, b, r) * 8;
      const d = (Math.hypot((x - lx) / rx, (z - lz) / rz) - 1) * Math.min(rx, rz);
      if (d < waterDistance) { waterDistance = d; lake = d < 0; }
    }
  }
  // Transverse tributaries join the main rivers and continue across region boundaries.
  const streamZ = Math.floor(z / 110) * 110 + 80 + (noise(seed + 901, x, 0, 36) - .5) * 16;
  waterDistance = Math.min(waterDistance, Math.abs(z - streamZ) - .75);
  const elevation = noise(seed + 101, x, z, 55) * .7 + noise(seed + 102, x, z, 23) * .3;
  const ridge = Math.max(0, elevation - .43) * 17;
  const valley = smooth(Math.max(0, Math.min(1, waterDistance / 8)));
  let height = .65 + ridge * valley + noise(seed + 12, x, z, 8) * .55 * valley;
  // A small blended settlement clearing, independent of all region boundaries.
  const home = Math.hypot(x - 8, z - 12) / 9;
  const blend = smooth(Math.max(0, Math.min(1, home - 1)));
  height = .85 * (1 - blend) + height * blend;
  const water = waterDistance < 0;
  const moisture = noise(seed + 220, x, z, 43), warmth = noise(seed + 440, x, z, 67);
  const biome: Biome = height > 3.0 ? 'highland' : moisture < .36 && warmth > .42 ? 'desert' : moisture > .53 ? 'forest' : 'meadow';
  return { height: water ? .3 : Math.round(height * 4) / 4, water, lake: water && lake, biome, moisture };
}
export function generateTile(seed: number, x: number, z: number): Tile {
  const sample = terrainSample(seed, x, z), variant = hash(seed + 73, x, z), v = hash(seed + 18, x, z);
  const clear = x >= 5 && x <= 12 && z >= 8 && z <= 16;
  let node: Tile['node'] = sample.water || clear ? null : v < (sample.biome === 'highland' ? .16 : .035) ? 'rock' : v < (sample.biome === 'forest' ? .38 : sample.biome === 'desert' ? .065 : .19) ? 'tree' : null;
  if ([[4, 10], [4, 12], [5, 7]].some(([a, b]) => a === x && b === z)) node = 'tree';
  if ([[9, 6], [10, 6]].some(([a, b]) => a === x && b === z)) node = 'rock';
  return { x, z, biome: sample.biome, region: regionFor(x, z), discovered: true, sapling: 0, height: sample.height, kind: sample.water ? 'water' : 'grass', waterway: sample.water ? sample.lake ? 'lake' : 'river' : null, node, amount: node === 'tree' ? sample.biome === 'forest' ? 24 : 20 : node === 'rock' ? 100 : 0, road: false, variant };
}
export function generateChunk(seed: number, id: number) {
  const { cx, cz } = regionCoords(id), result: Tile[] = [];
  for (let z = cz * CHUNK_H; z < (cz + 1) * CHUNK_H; z++) for (let x = cx * CHUNK_W; x < (cx + 1) * CHUNK_W; x++) result.push(generateTile(seed, x, z));
  return result;
}
