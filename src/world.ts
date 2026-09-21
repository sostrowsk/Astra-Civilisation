import { isMerchant } from './logistics.ts';
import { surfaceHeight, treeGrowthStage, pitResource } from './surface.ts';
import { undergroundAt, ORE_COLORS } from './mining.ts';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ORIGINAL_WIDTH, ORIGINAL_HEIGHT, BIOMES, worldBounds, tileAt, buildingAt, placement, type GameState, type BuildingKind, type Point, type Tool } from './sim.ts';

const UNIT = 1.6;
const wx = (x: number) => (x - (ORIGINAL_WIDTH - 1) / 2) * UNIT;
const wz = (z: number) => (z - (ORIGINAL_HEIGHT - 1) / 2) * UNIT;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = new Map<string, THREE.MeshLambertMaterial>();
function material(color: string) {
  let m = materials.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); materials.set(color, m); }
  return m;
}
function box(group: THREE.Group, color: string, x: number, y: number, z: number, w: number, h: number, d: number) {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}
const WOOD = '#775138', LIGHTWOOD = '#bc9060', WALL = '#eadbc0', ROOF = '#aa5a40';
function roof(g: THREE.Group, color = ROOF, base = 1.05) {
  for (let i = 0; i < 4; i++) box(g, color, 0, base + i * .15, 0, 1.54 - i * .33, .18, 1.5);
}
function crate(g: THREE.Group, x: number, y: number, z: number, size = .32) {
  box(g, LIGHTWOOD, x, y + size / 2, z, size, size, size);
  box(g, WOOD, x, y + size / 2, z + size / 2 + .005, size * .13, size, .03);
}
function flag(g: THREE.Group, color = '#d6b46d', y = 1.25) {
  box(g, WOOD, .52, y, -.45, .06, y * 2, .06);
  box(g, color, .75, y * 2 - .2, -.45, .45, .3, .035);
}
function merchantCart(covered: boolean) {
  const g = new THREE.Group(), wheels: THREE.Group[] = [], horseLegs: THREE.Mesh[] = [];
  // Block-built horse, harness and cargo wagon; both vehicles share the same footprint.
  box(g, '#95694b', 0, .5, .85, .34, .37, .7);
  box(g, '#95694b', 0, .77, 1.12, .25, .5, .25);
  box(g, '#b1845b', 0, .92, 1.26, .25, .22, .36);
  box(g, '#453c32', 0, .89, 1.02, .13, .3, .14);
  for (const x of [-.13, .13]) for (const z of [.6, 1.06]) horseLegs.push(box(g, '#694b38', x, .19, z, .09, .4, .1));
  for (const x of [-.24, .24]) box(g, WOOD, x, .35, .25, .045, .055, 1.15);
  box(g, LIGHTWOOD, 0, .32, -.42, .85, .12, 1.1);
  for (const x of [-.43, .43]) box(g, WOOD, x, .51, -.48, .065, .3, 1);
  box(g, WOOD, 0, .5, -.98, .85, .3, .06);
  if (covered) {
    box(g, '#d9cba3', 0, .84, -.56, .83, .65, .8);
    box(g, '#446352', 0, 1.2, -.56, .97, .12, .96);
    for (const x of [-.43, .43]) box(g, '#4e5b57', x, .9, -.55, .025, .22, .35);
  }
  for (const x of [-.49, .49]) for (const z of (covered ? [-.78, -.12] : [-.5])) {
    const wheel = new THREE.Group(); wheel.position.set(x, .23, z);
    box(wheel, '#554639', 0, 0, 0, .09, .44, .44);
    box(wheel, LIGHTWOOD, x < 0 ? -.055 : .055, 0, 0, .025, .32, .045);
    g.add(wheel); wheels.push(wheel);
  }
  const load = new THREE.Group(); crate(load, -.19, .38, -.55, .3); crate(load, .18, .38, -.55, .3); g.add(load);
  g.userData.load = load; g.userData.wheels = wheels; g.userData.horseLegs = horseLegs;
  return g;
}
export function buildingModel(kind: BuildingKind) {
  const g = new THREE.Group();
  if (kind === 'bridge') {
    for (let i = 0; i < 6; i++) box(g, i % 2 ? LIGHTWOOD : '#ab7b4e', -.65 + i * .26, .05, 0, .24, .16, 1.6);
    for (const x of [-.65, .65]) for (const z of [-.65, .65]) box(g, WOOD, x, -.15, z, .12, .8, .12);
    return g;
  }
  if (kind === 'mine') {
    box(g, '#33393c', 0, .1, 0, 1.3, .16, 1.3);
    for (const x of [-.55, .55]) box(g, WOOD, x, .85, 0, .2, 1.7, .22);
    box(g, LIGHTWOOD, 0, 1.65, 0, 1.45, .23, .4);
    box(g, '#d6a763', -.48, 1.3, .25, .18, .24, .17);
    box(g, '#a6a9a3', 0, 1.0, 0, .07, 1.1, .07);
    box(g, '#71634d', 0, .44, 0, .65, .4, .6);
    for (let i = 0; i < 4; i++) box(g, LIGHTWOOD, .52, .25 + i * .28, .6, .33, .07, .1);
    return g;
  }
  if (kind === 'smelter') {
    // Tall masonry furnace with chimney, glowing tap and ingot rack.
    box(g, '#915f49', -.18, .82, -.12, 1.05, 1.64, 1.0);
    for (let i = 0; i < 5; i++) box(g, '#b18b65', -.18, .25 + i * .3, -.12, 1.1, .06, 1.06);
    box(g, '#565a56', -.18, 1.85, -.12, .62, .5, .64);
    box(g, '#343c3a', -.18, 2.12, -.12, .4, .06, .42);
    box(g, '#342e2b', -.18, .48, .4, .57, .57, .06);
    box(g, '#f5ac42', -.18, .36, .45, .38, .23, .06);
    box(g, '#cbbb99', .58, .18, .45, .28, .18, .7);
    for (let i = 0; i < 3; i++) box(g, '#d29c63', -.38 + i * .27, .18, .85, .23, .15, .3);
    return g;
  }
  if (kind === 'forge') {
    // Low open timber workshop, separate hearth, anvil and hammer.
    for (const x of [-.6, .6]) for (const z of [-.48, .48]) box(g, WOOD, x, .7, z, .12, 1.4, .12);
    roof(g, '#506b7b', 1.32);
    box(g, '#797c75', .4, .38, -.28, .44, .74, .58);
    box(g, '#e89142', .4, .75, -.28, .3, .08, .4);
    box(g, WOOD, -.25, .3, .56, .48, .6, .42);
    box(g, '#626c70', -.25, .68, .56, .8, .2, .34);
    box(g, '#a9b7b9', -.6, .75, .56, .25, .13, .24);
    const hammer = box(g, LIGHTWOOD, .14, .73, .72, .06, .55, .07); hammer.rotation.z = -.5;
    box(g, '#65757a', .27, .99, .72, .3, .13, .14);
    return g;
  }
  if (kind === 'sheepfold') {
    box(g, '#8caa67', 0, .08, 0, 1.55, .12, 1.5);
    for (const x of [-.7, .7]) for (const z of [-.65, 0, .65]) box(g, WOOD, x, .35, z, .07, .6, .07);
    for (const x of [-.7, .7]) box(g, LIGHTWOOD, x, .48, 0, .07, .08, 1.4);
    box(g, LIGHTWOOD, 0, .48, -.65, 1.4, .08, .07);
    for (const [x, z] of [[-.3, -.2], [.3, .3]]) {
      box(g, '#f4ecd9', x, .38, z, .5, .35, .3);
      box(g, '#756957', x + .29, .4, z, .18, .2, .2);
      for (const dx of [-.15, .15]) box(g, '#675d50', x + dx, .18, z, .08, .2, .18);
    }
    box(g, '#986c45', -.2, .18, .7, .6, .2, .23); return g;
  }
  if (kind === 'manufactory') {
    box(g, '#a76f52', 0, .68, 0, 1.35, 1.2, 1.1); roof(g, '#536e71', 1.28);
    for (const x of [-.42, .05]) { box(g, '#686f69', x, 1.7, -.4, .24, 1.5, .26); box(g, '#bdd2c5', x, .7, .57, .25, .38, .04); }
    box(g, '#d49754', .66, .46, .68, .45, .45, .24); box(g, '#515e5e', .66, .46, .82, .2, .2, .04);
    crate(g, -.5, .12, .8); return g;
  }
  box(g, '#a6a191', 0, .07, 0, 1.48, .14, 1.4);
  if (kind === 'farm') {
    box(g, WALL, -.3, .4, -.24, .68, .62, .7);
    for (let i = 0; i < 3; i++) box(g, '#b0804b', -.3, .75 + i * .12, -.24, .88 - i * .25, .15, .92);
    box(g, WOOD, -.3, .33, .12, .2, .42, .03);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      box(g, '#715137', -.56 + i * .32, .16, .33 + j * .18, .23, .06, .12);
      box(g, '#d0b451', -.56 + i * .32, .32, .33 + j * .18, .08, .28, .08);
    }
    return g;
  }
  if (kind === 'townhall') {
    box(g, '#d1ccbb', 0, .68, 0, 1.3, 1.18, 1.2);
    for (const x of [-.48, 0, .48]) box(g, WALL, x, .65, .63, .12, 1.2, .14);
    box(g, '#435c60', 0, .48, .65, .3, .75, .035);
    roof(g, '#687c83', 1.34);
    box(g, '#cfcab7', 0, 1.95, -.22, .48, .9, .48);
    box(g, '#e0c280', 0, 2.05, .035, .24, .24, .025);
    box(g, '#516572', 0, 2.45, -.22, .65, .16, .65);
    flag(g, '#c79b50', 1.25); return g;
  }
  if (kind === 'camp') {
    box(g, '#d6c29a', -.12, .43, -.12, 1.1, .7, 1.0);
    for (let i = 0; i < 5; i++) box(g, i % 2 ? '#d6bd8b' : '#e3cda3', -.12, .65 + i * .15, -.12, 1.35 - i * .24, .17, 1.28);
    box(g, '#4e4232', -.12, .39, .39, .35, .64, .03);
    flag(g, '#e8bb6e', 1.05); crate(g, .56, .14, .42, .28); crate(g, -.5, .14, .56, .25);
    return g;
  }
  if (kind === 'quarry') {
    box(g, '#888f86', -.3, .4, 0, .7, .65, 1.1);
    box(g, '#aab0a2', -.35, .7, -.2, .5, .22, .55);
    box(g, WOOD, .4, .9, -.35, .13, 1.65, .13);
    box(g, WOOD, .12, 1.62, -.35, 1.2, .12, .16);
    box(g, '#494b40', -.37, 1.22, -.35, .025, .8, .025);
    box(g, '#727c75', -.37, .9, -.35, .35, .25, .35);
    crate(g, .45, .14, .42); return g;
  }
  if (kind === 'outpost') {
    box(g, WOOD, 0, 1.0, 0, .85, 1.9, .85);
    box(g, WALL, 0, 1.55, 0, 1.18, .65, 1.18);
    box(g, '#37473d', 0, 1.58, .6, .36, .3, .03);
    roof(g, '#526c58', 1.95); flag(g, '#e5bd6f', 1.48);
    for (const x of [-.54, .54]) box(g, LIGHTWOOD, x, .65, .57, .09, 1.3, .09);
    return g;
  }
  box(g, kind === 'warehouse' ? LIGHTWOOD : WALL, 0, .6, 0, 1.23, .95, 1.16);
  for (const x of [-.58, .58]) for (const z of [-.54, .54]) box(g, WOOD, x, .6, z, .12, 1.0, .12);
  box(g, WOOD, 0, .35, .59, .34, .65, .06);
  box(g, WOOD, 0, .87, .6, 1.23, .1, .08);
  box(g, '#6e948d', -.35, .68, .61, .22, .25, .035);
  roof(g, kind === 'woodcutter' || kind === 'forester' ? '#657c51' : kind === 'academy' ? '#566f91' : kind === 'miningHouse' ? '#526b7b' : kind === 'workshop' ? '#657274' : kind === 'warehouse' ? '#797467' : ROOF);
  if (kind === 'forester') {
    flag(g, '#8fba6d', .95);
    for (const x of [-.48, 0, .48]) { box(g, '#96724b', x, .23, .8, .2, .2, .2); box(g, '#537c51', x, .5, .8, .24, .32, .24); }
  }
  if (kind === 'workshop') {
    box(g, '#7a827f', .5, 1.2, -.4, .28, 1.8, .3);
    box(g, '#414e4c', .7, .38, .53, .42, .42, .4);
    box(g, '#d79c5c', .7, .42, .74, .24, .18, .04);
    box(g, '#9baba7', -.55, .32, .78, .38, .23, .2);
  }
  if (kind === 'academy') {
    box(g, '#bda776', 0, 1.72, 0, .18, .15, .18);
    for (let i = 0; i < 4; i++) box(g, ['#647e91', '#a97c64', '#839163', '#c5ad76'][i], -.46 + i * .16, .3, .78, .1, .3, .2);
  }
  if (kind === 'miningHouse') {
    box(g, '#79817f', .4, 1.5, -.3, .25, .75, .25);
    box(g, '#efc76f', .35, .72, .63, .18, .22, .06);
    box(g, WOOD, .7, .5, .3, .09, .85, .09);
    const pick = box(g, '#afbfc2', .7, .84, .3, .52, .09, .1); pick.rotation.z = -.25;
    crate(g, -.46, .18, .78, .3); flag(g, '#d4b363', .95);
  }
  if (kind === 'weaver') {
    for (const x of [-.42, .42]) box(g, WOOD, x, .6, .8, .08, .9, .08);
    for (const y of [.28, .94]) box(g, LIGHTWOOD, 0, y, .8, .92, .09, .1);
    for (let i = 0; i < 7; i++) box(g, i % 2 ? '#a9beb6' : '#ead9ac', -.3 + i * .1, .6, .82, .035, .55, .04);
  }
  if (kind === 'tailor') {
    box(g, '#986c8a', 0, 1.02, .68, 1.32, .12, .44);
    box(g, LIGHTWOOD, .63, .48, .87, .07, .7, .07);
    box(g, '#b98e9a', .63, .7, .87, .37, .4, .15);
    for (let i = 0; i < 3; i++) box(g, ['#7795a4', '#cfb378', '#b18a93'][i], -.5 + i * .23, .26, .8, .2, .2, .32);
  }
  if (kind === 'house') {
    box(g, '#ada392', .38, 1.47, -.3, .23, .65, .23);
    box(g, '#d2c6af', .38, 1.8, -.3, .28, .1, .28);
    box(g, '#82633f', -.35, .48, .67, .36, .09, .15);
    box(g, '#84944c', -.35, .55, .67, .31, .1, .12);
  }
  if (kind === 'woodcutter') {
    for (let i = 0; i < 3; i++) box(g, '#96724c', -.5 + i * .25, .25, .76, .21, .21, .6);
    box(g, '#d2b884', -.5, .25, 1.07, .18, .18, .025);
  }
  if (kind === 'sawmill') {
    box(g, WOOD, .8, .5, .1, .45, .12, 1.0);
    for (let i = 0; i < 4; i++) box(g, LIGHTWOOD, .78, .64 + i * .08, .2, .4, .06, .7);
    box(g, '#889b98', .8, .74, -.27, .04, .35, .26);
  }
  if (kind === 'warehouse') { crate(g, -.5, .14, .76); crate(g, .5, .14, .7); crate(g, .5, .46, .7, .27); }
  return g;
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera();
  controls: OrbitControls;
  terrain = new THREE.Group();
  buildings = new THREE.Group();
  people = new THREE.Group();
  markers = new THREE.Group();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  tileTargets: THREE.Object3D[] = [];
  buildingMeshes = new Map<number, THREE.Group>();
  personMeshes = new Map<number, THREE.Group>();
  workerLabels = new Map<number, HTMLDivElement>();
  labelVisibility = { surface: false, underground: false };
  preview: THREE.Mesh;
  selection: THREE.Mesh;
  revision = -1;
  depth = 0;
  keys = new Set<string>();
  selected: Point | null = null;
  onClick: (p: Point) => void = () => {};
  onHover: (p: Point | null) => void = () => {};
  constructor(public container: HTMLElement, public getState: () => GameState) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor('#cbd8ce');
    this.renderer.domElement.setAttribute('aria-label', 'Astra: interaktive 3D-Spielwelt. Gebäude über die Bauleiste auswählen und auf ein freies Feld klicken.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.Fog('#cbd8ce', 1000, 2400);
    this.scene.add(new THREE.HemisphereLight('#fff6dc', '#69857e', 2.4));
    const sun = new THREE.DirectionalLight('#fff0cc', 3.0);
    sun.position.set(-22, 40, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 90 });
    sun.shadow.normalBias = .12; sun.shadow.bias = .0001;
    sun.name = 'sun'; this.scene.add(sun); this.scene.add(sun.target);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), material('#b7cdc6'));
    sea.name = 'backdrop'; sea.rotation.x = -Math.PI / 2; sea.position.y = -.55; sea.receiveShadow = true; this.scene.add(sea);
    this.scene.add(this.terrain, this.buildings, this.people, this.markers);
    this.preview = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#edf9ba', transparent: true, opacity: .42, depthWrite: false }));
    this.preview.visible = false; this.markers.add(this.preview);
    this.selection = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, 1.5), new THREE.MeshBasicMaterial({ color: '#f8d78b', transparent: true, opacity: .72 }));
    this.selection.visible = false; this.markers.add(this.selection);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = .12;
    this.controls.minZoom = .12; this.controls.maxZoom = 3.5;
    this.controls.minPolarAngle = .3; this.controls.maxPolarAngle = Math.PI / 2.5;
    this.controls.mouseButtons = { LEFT: undefined as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.resetCamera(); this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
    let down = { x: 0, y: 0 };
    this.renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    this.renderer.domElement.addEventListener('pointerup', e => { if (e.button === 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) { const p = this.pick(e); if (p) this.onClick(p); } });
    this.renderer.domElement.addEventListener('pointermove', e => this.onHover(this.pick(e)));
    this.renderer.domElement.addEventListener('pointerleave', () => this.onHover(null));
    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => { if (!(e.target instanceof HTMLInputElement) && !document.querySelector('dialog[open]')) this.keys.add(e.key.toLowerCase()); });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }
  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setSize(w, h); const span = 24;
    this.camera.left = -span * w / h; this.camera.right = span * w / h; this.camera.top = span; this.camera.bottom = -span;
    this.camera.near = .1; this.camera.far = 4000; this.camera.updateProjectionMatrix();
  }
  resetCamera() {
    this.camera.position.set(338, 390, 440); this.controls.target.set(-2, 0, 0); this.camera.zoom = 1.25; this.camera.updateProjectionMatrix(); this.controls.update();
  }
  focus(p: Point) {
    const newTarget = new THREE.Vector3(wx(p.x), 0, wz(p.z)), offset = newTarget.clone().sub(this.controls.target);
    this.camera.position.add(offset); this.controls.target.copy(newTarget); this.controls.update();
  }
  rotate(angle: number) {
    const offset = this.camera.position.clone().sub(this.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.camera.position.copy(this.controls.target).add(offset); this.controls.update();
  }
  zoom(factor: number) { this.camera.zoom = Math.max(.12, Math.min(3.5, this.camera.zoom * factor)); this.camera.updateProjectionMatrix(); }
  pick(e: PointerEvent): Point | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.tileTargets);
    if (!hits.length) return null;
    const p = hits[0].point;
    const x = Math.round(p.x / UNIT + (ORIGINAL_WIDTH - 1) / 2), z = Math.round(p.z / UNIT + (ORIGINAL_HEIGHT - 1) / 2);
    return tileAt(this.getState(), x, z) ? { x, z } : null;
  }
  hover(p: Point | null, tool: Tool | null) {
    if (!p || !tool) { this.preview.visible = false; return; }
    const s = this.getState(), check = placement(s, tool, p.x, p.z);
    const bridge = false;
    const x = p.x;
    this.preview.position.set(wx(x), surfaceHeight(tileAt(s, p.x, p.z)) + .1, wz(p.z));
    this.preview.scale.set(bridge ? 3.12 : 1.53, .16, 1.53);
    (this.preview.material as THREE.MeshBasicMaterial).color.set(check.ok ? '#d0efa0' : '#e27d68');
    this.preview.visible = true;
  }
  rebuild() {
    const s = this.getState();
    for (const child of this.terrain.children) if (child instanceof THREE.InstancedMesh) child.dispose();
    this.terrain.clear(); this.tileTargets = [];
    if (this.depth) { this.rebuildUnderground(); return; }
    const land = s.tiles.filter(t => t.discovered && t.kind !== 'water');
    const bounds = worldBounds(s), sun = this.scene.getObjectByName('sun') as THREE.DirectionalLight;
    sun.target.position.set(wx(bounds.minX + bounds.width / 2), 0, wz(bounds.minZ + bounds.height / 2));
    sun.position.copy(sun.target.position).add(new THREE.Vector3(-35, 65, 35));
    const extent = Math.max(bounds.width, bounds.height) * UNIT * .65;
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, far: 160 }); sun.shadow.camera.updateProjectionMatrix();
    const earth = new THREE.InstancedMesh(geometry, material('#997b53'), land.length);
    const grass = new THREE.InstancedMesh(geometry, material('#ffffff'), land.length);
    const matrix = new THREE.Matrix4(); const dummy = new THREE.Object3D();
    land.forEach((t, i) => {
      const top = surfaceHeight(t), bottom = -3.4;
      dummy.position.set(wx(t.x), (top + bottom) / 2 - .07, wz(t.z)); dummy.scale.set(UNIT, top - bottom, UNIT); dummy.updateMatrix(); matrix.copy(dummy.matrix); earth.setMatrixAt(i, matrix);
      dummy.position.y = top - .07; dummy.scale.set(UNIT, .14, UNIT); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      grass.setColorAt(i, new THREE.Color(t.excavation ? '#9b9685' : t.road ? '#c4b180' : t.biome === 'highland' && t.height > 6.2 ? '#e2e7df' : BIOMES[t.biome].ground).multiplyScalar(t.road ? 1 : .94 + t.variant * .12));
      const g = new THREE.Group(); g.position.set(wx(t.x), top, wz(t.z));
      if (t.excavation?.ordered || t.priorityQuarrying) {
        for (const edge of [-.7, .7]) {
          box(g, '#e5ad52', edge, .06, 0, .07, .08, 1.45);
          box(g, '#e5ad52', 0, .06, edge, 1.45, .08, .07);
        }
      }
      if (t.excavation?.remaining && pitResource(s.seed, t.x, t.z, t.excavation.depth + 1) === 'coal') {
        for (const x of [-.38, 0, .38]) box(g, '#564230', x, .08, .18, .22, .12, .55);
      }
      if (t.node === 'tree') {
        if (t.priorityFelling) {
          for (const edge of [-.7, .7]) {
            box(g, '#e5ad52', edge, .06, 0, .07, .08, 1.45);
            box(g, '#e5ad52', 0, .06, edge, 1.45, .08, .07);
          }
        }
        const h = 1.25 + t.variant * .8;
        box(g, '#745038', 0, h / 2, 0, .26, h, .28);
        const foliage = BIOMES[t.biome].leaves;
        box(g, foliage, 0, h + .1, 0, t.biome === 'desert' ? 1.55 : 1.25, t.biome === 'desert' ? .4 : .85, 1.15);
        if (t.biome === 'forest') box(g, '#2f5747', 0, h + 1.2, 0, .3, .4, .3);
        box(g, t.biome === 'forest' ? '#426e57' : t.biome === 'desert' ? '#aca66b' : '#739452', -.1, h + .64, -.02, .88, .5, .82);
        box(g, t.biome === 'forest' ? '#5a8667' : t.biome === 'desert' ? '#beb780' : '#829d59', -.12, h + .94, -.02, .46, .15, .46);
        if (t.variant > .82) box(g, '#d3bc66', .48, h + .16, .48, .16, .16, .16);
      } else if (t.node === 'rock') {
        box(g, '#87958e', -.18, .35, .07, .95, .7, 1.0);
        box(g, '#a7b2a3', .25, .52, -.15, .7, 1.04, .72);
        box(g, '#bac3b2', .2, 1.05, -.15, .5, .12, .52);
      } else if (t.sapling) {
        const scale = [.18, .30, .45, .62, .82][treeGrowthStage(t) - 1];
        const h = (1.25 + t.variant * .8) * scale;
        box(g, '#8c744b', 0, h / 2, 0, .26 * scale, h, .28 * scale);
        box(g, BIOMES[t.biome].leaves, 0, h + .1 * scale, 0, 1.25 * scale, .85 * scale, 1.15 * scale);
        box(g, BIOMES[t.biome].leaves, -.1 * scale, h + .64 * scale, 0, .88 * scale, .5 * scale, .82 * scale);
      } else if (!t.excavation && !t.road && !buildingAt(s, t.x, t.z) && t.variant > .88) {
        for (let j = 0; j < 3; j++) {
          const x = -.4 + j * .31, z = (j % 2) * .4 - .2;
          box(g, '#7e9458', x, .12, z, .05, .24, .05);
          box(g, t.variant > .95 ? '#ece0a3' : '#c6b26f', x, .23, z, .14, .08, .14);
        }
      }
      this.terrain.add(g);
    });
    // Batch every decorative cube by material: large biomes need dozens, not thousands, of draw calls.
    this.terrain.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.Matrix4[]>();
    for (const group of this.terrain.children) group.traverse(child => { if (child instanceof THREE.Mesh) { const mat = child.material as THREE.Material; const batch = batches.get(mat) ?? []; batch.push(child.matrixWorld.clone()); batches.set(mat, batch); } });
    this.terrain.clear();
    for (const [mat, matrices] of batches) { const mesh = new THREE.InstancedMesh(geometry, mat, matrices.length); matrices.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.castShadow = true; mesh.receiveShadow = true; this.terrain.add(mesh); }
    earth.receiveShadow = true; grass.receiveShadow = true; this.terrain.add(earth, grass);
    const waters = s.tiles.filter(t => t.kind === 'water'), waterMesh = new THREE.InstancedMesh(geometry, material('#74b7bc'), waters.length);
    waters.forEach((t, i) => { dummy.position.set(wx(t.x), .22, wz(t.z)); dummy.scale.set(UNIT, .16, UNIT); dummy.updateMatrix(); waterMesh.setMatrixAt(i, dummy.matrix); waterMesh.setColorAt(i, new THREE.Color(t.waterway === 'lake' ? '#c5e3ef' : '#dcf6ec')); });
    waterMesh.receiveShadow = true; this.terrain.add(waterMesh);
    this.tileTargets.push(grass, waterMesh);
    this.buildings.clear(); this.buildingMeshes.clear();
    for (const b of s.buildings) {
      const model = buildingModel(b.kind);
      model.position.set(wx(b.x), b.kind === 'bridge' ? .42 : surfaceHeight(tileAt(s, b.x, b.z)), wz(b.z));
      const final = new THREE.Group();
      while (model.children.length) final.add(model.children[0]);
      model.add(final);
      const scaffold = new THREE.Group();
      for (const x of [-.69, .69]) for (const z of [-.64, .64]) box(scaffold, '#bc9c61', x, .48, z, .06, .96, .06);
      for (const z of [-.64, .64]) box(scaffold, '#bc9c61', 0, .78, z, 1.45, .06, .06);
      model.add(scaffold); model.userData.final = final; model.userData.scaffold = scaffold;
      this.buildings.add(model); this.buildingMeshes.set(b.id, model);
    }
    this.revision = s.revision;
  }
  setDepth(depth: number) {
    (this.scene.getObjectByName('backdrop') as THREE.Mesh).material = material(depth ? '#28333b' : '#b7cdc6');
    this.depth = depth; this.revision = -1; this.selected = null; this.preview.visible = false;
    this.renderer.setClearColor(depth ? '#20282e' : '#cbd8ce');
    this.scene.fog = new THREE.Fog(depth ? '#20282e' : '#cbd8ce', 1000, 2400);
  }
  rebuildUnderground() {
    const s = this.getState(), tiles = s.underground.filter(t => t.depth === this.depth);
    const mesh = new THREE.InstancedMesh(geometry, material('#ffffff'), tiles.length), dummy = new THREE.Object3D();
    const ores: { x: number; z: number; color: string }[] = [];
    tiles.forEach((t, i) => {
      const h = t.solid || !t.revealed ? .95 : .1;
      dummy.position.set(wx(t.x), h / 2 - .05, wz(t.z)); dummy.scale.set(UNIT * .975, h, UNIT * .975); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(t.order ? '#6a97aa' : !t.revealed ? '#35434b' : t.solid ? '#748087' : '#b4a38b'));
      if (t.revealed && t.ore) ores.push({ x: t.x, z: t.z, color: ORE_COLORS[t.ore] });
    });
    const oreMesh = new THREE.InstancedMesh(geometry, material('#ffffff'), ores.length * 3);
    ores.forEach((t, i) => { for (let j = 0; j < 3; j++) { dummy.position.set(wx(t.x) - .35 + j * .3, .94, wz(t.z) + (j % 2 ? .27 : -.2)); dummy.scale.set(.22, .16, .28); dummy.updateMatrix(); oreMesh.setMatrixAt(i * 3 + j, dummy.matrix); oreMesh.setColorAt(i * 3 + j, new THREE.Color(t.color)); } });
    mesh.receiveShadow = true; this.terrain.add(mesh, oreMesh); this.tileTargets.push(mesh);
    this.buildings.clear(); this.buildingMeshes.clear();
    for (const b of s.buildings.filter(b => b.kind === 'mine' && b.complete)) { const marker = buildingModel('mine'); marker.position.set(wx(b.x), .12, wz(b.z)); this.buildings.add(marker); }
    this.revision = s.revision;
  }
  render(dt: number, time: number) {
    const s = this.getState();
    if (s.revision !== this.revision) this.rebuild();
    if (this.keys.has('q')) this.rotate(dt * .8);
    if (this.keys.has('e')) this.rotate(-dt * .8);
    const dx = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
    const dz = (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0) - (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0);
    if (dx || dz) {
      const forward = this.controls.target.clone().sub(this.camera.position); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
      const offset = right.multiplyScalar(dx * dt * 15).add(forward.multiplyScalar(-dz * dt * 15));
      this.camera.position.add(offset); this.controls.target.add(offset);
    }
    this.controls.update();
    for (const b of s.buildings) {
      const model = this.buildingMeshes.get(b.id); if (!model) continue;
      const final = model.userData.final as THREE.Group;
      (model.userData.scaffold as THREE.Group).visible = !b.complete;
      final.children.forEach((part, i) => { part.visible = b.complete || i < Math.max(1, Math.floor(final.children.length * b.progress)); });
    }
    const labelPositions: { x: number; y: number }[] = [];
    for (const v of s.villagers) {
      let g = this.personMeshes.get(v.id);
      if (!g) {
        g = new THREE.Group(); g.rotation.order = 'YXZ';
        box(g, isMerchant(v) ? '#b58a44' : ['#bd754c', '#6a8494', '#dac38a', '#799372', '#986b6c'][v.id % 5], 0, .32, 0, .24, .28, .18);
        box(g, '#e4b590', 0, .57, 0, .21, .22, .2);
        box(g, '#634734', 0, .68, -.02, .23, .08, .22);
        const legs = new THREE.Group();
        box(legs, '#554d3e', -.07, .1, 0, .08, .2, .10); box(legs, '#554d3e', .07, .1, 0, .08, .2, .10);
        g.add(legs); g.userData.legs = legs;
        const helmet = new THREE.Group();
        box(helmet, '#e2b44d', 0, .75, -.02, .29, .13, .28);
        box(helmet, '#fff1af', 0, .74, .15, .1, .08, .07);
        g.add(helmet); g.userData.helmet = helmet;
        const arms = [-1, 1].map(side => {
          const arm = new THREE.Group(); arm.position.set(side * .17, .43, .02);
          box(arm, '#e4b590', 0, -.1, .02, .09, .25, .1);
          g!.add(arm); return arm;
        });
        g.userData.arms = arms;
        const pickaxe = new THREE.Group(); pickaxe.position.set(.2, .4, .08);
        box(pickaxe, '#bb8a57', 0, .13, .05, .055, .45, .055);
        box(pickaxe, '#c4d1d7', 0, .34, .05, .32, .065, .08);
        g.add(pickaxe); g.userData.pickaxe = pickaxe;
        const axe = new THREE.Group(); axe.position.set(.2, .4, .08);
        box(axe, WOOD, 0, .17, .04, .065, .62, .065);
        box(axe, '#8d9b9e', 0, .41, .1, .11, .19, .28);
        box(axe, '#d8e2de', 0, .41, .25, .12, .23, .07);
        g.add(axe); g.userData.axe = axe;
        const chips = new THREE.Group();
        for (let i = 0; i < 4; i++) box(chips, LIGHTWOOD, 0, 0, 0, .055, .055, .09);
        g.add(chips); g.userData.chips = chips;

        const label = document.createElement('div'); label.className = 'mine-worker-label'; label.hidden = true; this.container.appendChild(label); this.workerLabels.set(v.id, label);
        const cargo = box(g, LIGHTWOOD, 0, .3, .22, .27, .24, .2); g.userData.cargo = cargo;
        this.people.add(g); this.personMeshes.set(v.id, g);
      }
      const t = tileAt(s, Math.round(v.x), Math.round(v.z));
      g.visible = v.depth === this.depth;
      const miner = !!v.mining || s.buildings.some(b => b.id === v.job && b.kind === 'mine');
      (g.userData.helmet as THREE.Group).visible = miner;
      const walking = !!(v.task?.path.length || v.mining?.path.length);
      const trading = isMerchant(v), driving = trading && !!v.task?.vehicle;
      if (trading && !g.userData.cart) { const cart = merchantCart(false), coach = merchantCart(true); g.add(cart, coach); g.userData.cart = cart; g.userData.coach = coach; }
      for (const [name, shown] of [['cart', driving && v.task?.vehicle === 'cart'], ['coach', driving && v.task?.vehicle === 'coach']] as const) {
        const vehicle = g.userData[name] as THREE.Group | undefined; if (!vehicle) continue; vehicle.visible = shown;
        (vehicle.userData.load as THREE.Group).visible = !!v.cargo;
        for (const wheel of vehicle.userData.wheels as THREE.Group[]) wheel.rotation.x = walking ? s.time * 7 : wheel.rotation.x;
        (vehicle.userData.horseLegs as THREE.Mesh[]).forEach((leg, i) => leg.rotation.x = walking ? Math.sin(s.time * 10 + i * Math.PI) * .35 : 0);
      }
      // Work starts only at the resource; carrying and approach paths keep their walking pose.
      const working = !v.depth && !walking && !v.cargo && v.task?.phase === 'work' && (v.task.kind === 'gather' || v.task.kind === 'excavate');
      const chopping = working && v.task?.resource === 'wood';
      const digging = working && v.task?.kind === 'excavate';
      const target = working ? v.task?.node : undefined;
      const phase = (s.time * (chopping ? 1.25 : 1.6) + v.id * .37) % 1;
      // Slow wind-up, fast strike, then recovery. Simulation time also respects pause and speed.
      const strike = phase < .55 ? 1 - phase / .55 : phase < .72 ? (phase - .55) / .17 : 1;
      const swing = -.95 + strike * (digging ? 2.8 : 2.25);
      const pickaxe = g.userData.pickaxe as THREE.Group;
      pickaxe.visible = (!!v.depth && v.mining?.stage !== 'return') || (working && !chopping);
      pickaxe.rotation.x = working ? swing : v.mining?.stage === 'work' ? -.4 + Math.sin(s.time * 8 + v.id) * .85 : .3;
      const axe = g.userData.axe as THREE.Group;
      axe.visible = !!chopping; axe.rotation.x = swing;
      const arms = g.userData.arms as THREE.Group[];
      arms.forEach((arm, i) => { arm.rotation.x = working ? swing - Math.PI : walking ? Math.sin(s.time * 9 + v.id + i * Math.PI) * .4 : 0; });
      g.scale.setScalar(this.depth ? 1.5 : 1);
      g.position.set(wx(v.x), (this.depth ? .12 : t.kind === 'water' ? .57 : surfaceHeight(t)) + (walking ? Math.abs(Math.sin(s.time * 9 + v.id)) * .055 : 0), wz(v.z));
      if (this.depth && g.visible) {
        // Separate colleagues sharing the same shaft tile without changing their real routes.
        const lane = s.villagers.filter(n => n.job === v.job).findIndex(n => n.id === v.id) % 4;
        g.position.x += lane % 2 ? .23 : -.23; g.position.z += lane < 2 ? -.23 : .23;
      }
      g.rotation.y = target && (target.x !== v.x || target.z !== v.z) ? Math.atan2(target.x - v.x, target.z - v.z) : v.facing;
      g.rotation.x = working ? .08 + strike * .12 : 0;
      if (trading) { const lane = v.task?.vehicle === 'coach' ? .55 : v.task?.vehicle === 'cart' ? -.55 : 0; g.position.x += Math.cos(g.rotation.y) * lane; g.position.z -= Math.sin(g.rotation.y) * lane; }
      if (driving) arms.forEach(arm => arm.rotation.x = -.65);
      if (target && !digging) {
        // Lean into the adjacent resource visually without changing the worker's route.
        g.position.x += Math.sin(g.rotation.y) * .65;
        g.position.z += Math.cos(g.rotation.y) * .65;
      }
      const chips = g.userData.chips as THREE.Group;
      chips.visible = !!working && phase >= .72;
      if (chips.visible) chips.children.forEach((part, i) => {
        const age = (phase - .72) / .28;
        part.position.set(.1 + (i - 1.5) * age * .17, (digging ? .08 : .45) + Math.sin(age * Math.PI) * .24, .62 + age * (i % 2 ? .15 : -.18));
        part.rotation.set(age * 5 + i, age * 3, i);
        part.scale.set(.055 * (1 - age), .055 * (1 - age), .09 * (1 - age));
        (part as THREE.Mesh).material = material(chopping ? LIGHTWOOD : v.task?.resource === 'coal' ? '#454745' : '#9da7a3');
      });
      const label = this.workerLabels.get(v.id)!;
      const projected = new THREE.Vector3(g.position.x, g.position.y + 1.3, g.position.z).project(this.camera);
      label.hidden = !(this.depth ? this.labelVisibility.underground : this.labelVisibility.surface) || !g.visible || projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
      if (!label.hidden) {
        label.textContent = `${v.name}${trading ? ' · Händler · ' + (v.task?.vehicle === 'coach' ? 'Kutsche' : v.task?.vehicle === 'cart' ? 'Pferdekarren' : 'zu Fuß') : ''} · ${v.cargo ? 'trägt ' + v.cargo.amount : walking ? 'unterwegs' : v.mining?.stage === 'work' || v.task?.kind === 'excavate' ? 'gräbt' : v.task?.kind === 'gather' ? v.task.resource === 'wood' ? 'fällt Holz' : 'baut Stein ab' : v.task ? 'arbeitet' : 'wartet'}`;
        const x = (projected.x + 1) / 2 * this.container.clientWidth;
        let y = (1 - projected.y) / 2 * this.container.clientHeight;
        while (labelPositions.some(p => Math.abs(p.x - x) < 130 && Math.abs(p.y - y) < 25)) y -= 25;
        labelPositions.push({ x, y }); label.style.left = `${x}px`; label.style.top = `${y}px`;
      }
      const legs = g.userData.legs as THREE.Group; legs.visible = !driving;
      legs.children[0].rotation.x = walking ? Math.sin(s.time * 9 + v.id) * .5 : 0;
      legs.children[1].rotation.x = -legs.children[0].rotation.x;
      const cargo = g.userData.cargo as THREE.Mesh;
      cargo.visible = !!v.cargo && !driving;
      if (v.cargo) cargo.material = material(v.cargo.resource === 'stone' ? '#98a6a4' : v.cargo.resource === 'planks' ? '#dbb375' : v.cargo.resource === 'food' ? '#c5a249' : v.cargo.resource === 'tools' ? '#718993' : v.cargo.resource === 'knowledge' ? '#899bbb' : '#89603e');
    }
    for (const [id, g] of this.personMeshes) if (!s.villagers.some(v => v.id === id)) { this.people.remove(g); this.personMeshes.delete(id); this.workerLabels.get(id)?.remove(); this.workerLabels.delete(id); }
    this.selection.visible = !!this.selected;
    if (this.selected) this.selection.position.set(wx(this.selected.x), (this.depth ? undergroundAt(s, this.selected.x, this.selected.z, this.depth)?.solid ? 1.0 : .15 : surfaceHeight(tileAt(s, this.selected.x, this.selected.z)) + .03), wz(this.selected.z));
    this.renderer.render(this.scene, this.camera);
  }
}
