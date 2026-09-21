import { entrance, findPath, type Building, type GameState, type Point, type Villager } from './sim.ts';
export const LOCAL_RADIUS = 9;
export const isMerchant = (v: Villager) => v.role === 'merchant';
export const isCenter = (b: Building) => b.complete && ['camp', 'outpost', 'townhall'].includes(b.kind);
export const homeCapacity = (b: Building) => !b.complete ? 0 : b.kind === 'camp' ? 10 : b.kind === 'house' ? 2 : ['miningHouse', 'warehouse'].includes(b.kind) ? 4 : 0;
export const distanceTo = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z));
export function nearestCenter(s: GameState, p: Point) {
  return s.buildings.filter(isCenter).sort((a, b) => distanceTo(a, p) - distanceTo(b, p) || a.id - b.id)[0];
}
export function localCenter(s: GameState, v: Villager): Point {
  return s.buildings.find(b => b.id === v.settlement && isCenter(b)) ?? v.origin ?? s.buildings.find(b => b.id === v.home) ?? {x:8,z:12};
}
export function bindHome(s: GameState, v: Villager, home?: Building) {
  if (home) v.home = home.id;
  const center = nearestCenter(s, home ?? v);
  if (center) v.settlement = center.id; else delete v.settlement;
  v.origin = center ? {x:center.x,z:center.z} : home ? {x:home.x,z:home.z} : {x:Math.round(v.x),z:Math.round(v.z)};
}
export function inLocalArea(s: GameState, v: Villager, p: Point) {
  return isMerchant(v) || distanceTo(localCenter(s, v), p) <= LOCAL_RADIUS;
}
export function workerPath(s: GameState, v: Villager, target: Point, from: Point = v) {
  return findPath(s, from, target, isMerchant(v) ? undefined : p => inLocalArea(s, v, p));
}
export const merchantCapacity = (s: GameState) => s.level >= 4 ? 16 : s.level >= 3 ? 8 : 2;
export const merchantVehicle = (s: GameState) => s.level >= 4 ? 'Kutsche' : s.level >= 3 ? 'Pferdekarren' : 'Zu Fuß';
export type TradeVehicle = 'cart' | 'coach';
export const vehicleCapacity = (vehicle?: TradeVehicle) => vehicle === 'coach' ? 16 : vehicle === 'cart' ? 8 : 2;
export function availableVehicle(s: GameState, v: Villager): TradeVehicle | undefined {
  const home = merchantHome(s, v);
  if (!isMerchant(v) || !home || distanceTo(v, home) > .1) return undefined;
  const occupied = (vehicle: TradeVehicle) => s.villagers.some(n => n.id !== v.id && n.home === v.home && n.task?.vehicle === vehicle);
  if (s.level >= 4 && !occupied('coach')) return 'coach';
  if (s.level >= 3 && !occupied('cart')) return 'cart';
  return undefined;
}
export const haulCapacity = (s: GameState, v: Villager) => vehicleCapacity(v.task ? v.task.vehicle : availableVehicle(s, v));
export function merchantHome(s: GameState, v: Villager) {
  return s.buildings.find(b => b.id === v.home && b.kind === 'warehouse' && b.complete);
}
export function sameSettlement(s: GameState, a: Building, b: Building) {
  return nearestCenter(s, a)?.id === nearestCenter(s, b)?.id;
}
export function localBuilding(s: GameState, v: Villager, b: Building) { return inLocalArea(s, v, entrance(b)); }
