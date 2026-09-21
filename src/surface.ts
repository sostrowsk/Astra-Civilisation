import { hash } from './generator.ts';
import { BIOMES, buildingAt, tileAt, type GameState, type Tile } from './sim.ts';
export const PIT_LAYER_AMOUNT = 20;
export function surfaceHeight(t: Tile) { return t.height - (t.excavation?.depth ?? 0) * .8; }
export function treeGrowthStage(t: Tile): number {
  return t.node === 'tree' ? 6 : t.sapling ? Math.min(5, 1 + Math.floor(t.sapling / BIOMES[t.biome].growth * 5)) : 0;
}
export function pitResource(seed: number, x: number, z: number, layer: number): 'stone' | 'coal' {
  return layer >= 2 && hash(seed ^ (layer * 7919), x, z) < (layer === 2 ? .05 : .10) ? 'coal' : 'stone';
}
export function excavationCheck(s: GameState, x: number, z: number) {
  const t = tileAt(s, x, z), no = (reason: string) => ({ ok: false, reason });
  if (!t?.discovered || t.kind === 'water') return no('Nur auf entdecktem Land möglich.');
  if (buildingAt(s, x, z) || t.road) return no('Gebäude und Wege bleiben geschützt.');
  if (t.node) return no(t.node === 'tree' ? 'Zuerst den ausgewachsenen Baum fällen.' : 'Zuerst das Steinvorkommen abbauen.');
  const depth = t.excavation?.depth ?? 0;
  if (depth >= 3) return no('Maximale Tagebautiefe: 3 Ebenen.');
  if (depth) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    const neighbor = tileAt(s, x + dx, z + dz);
    if (!neighbor?.discovered || (neighbor.excavation?.depth ?? 0) < depth) return no(`Zuerst alle 8 Nachbarfelder auf Ebene ${depth} abgraben (3 × 3).`);
  }
  return { ok: true, reason: `Ebene ${depth + 1} abgraben · ${t.excavation?.remaining || PIT_LAYER_AMOUNT} Rohstoffe. Steinbruch in 9 Feldern Reichweite benötigt.` };
}
export function orderExcavation(s: GameState, x: number, z: number, ordered = true) {
  const t = tileAt(s, x, z);
  if (!ordered && t?.excavation) { t.excavation.ordered = false; s.revision++; return { ok: true, reason: 'Tagebau pausiert. Laufender Abbau wird beendet.' }; }
  const check = excavationCheck(s, x, z); if (!check.ok) return check;
  t.excavation ??= { depth: 0, remaining: PIT_LAYER_AMOUNT, ordered: false };
  if (!t.excavation.remaining) t.excavation.remaining = PIT_LAYER_AMOUNT;
  t.excavation.ordered = true; t.sapling = 0; s.revision++;
  return { ok: true, reason: 'Tagebau beauftragt. Steinbrucharbeiter übernehmen den Abbau.' };
}
export function excavationStatus(s: GameState, t: Tile) {
  const p = t.excavation;
  if (!p?.ordered) return excavationCheck(s, t.x, t.z).reason;
  const worker = s.villagers.find(v => v.task?.kind === 'excavate' && v.task.phase === 'work' && v.task.node?.x === t.x && v.task.node.z === t.z);
  if (worker) return `${worker.name} ${worker.task!.path.length ? 'ist unterwegs' : 'gräbt'} · Ebene ${p.depth + 1}.`;
  const huts = s.buildings.filter(b => b.kind === 'quarry' && b.complete && Math.abs(b.x - t.x) + Math.abs(b.z - t.z) <= 9);
  if (!huts.length) return 'Wartet auf einen Steinbruch im Umkreis von 9 Feldern.';
  if (!huts.some(b => b.active)) return 'Steinbruch pausiert.';
  return 'Beauftragt · wartet auf freien Arbeiter, begehbaren Weg oder Lagerplatz.';
}
