import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WIDTH, HEIGHT, tileAt, buildingAt, placement, type GameState, type BuildingKind, type Point, type Tool } from './sim.ts';

const UNIT = 1.6;
const wx = (x: number) => (x - (WIDTH - 1) / 2) * UNIT;
const wz = (z: number) => (z - (HEIGHT - 1) / 2) * UNIT;
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
export function buildingModel(kind: BuildingKind) {
  const g = new THREE.Group();
  if (kind === 'bridge') {
    for (let i = 0; i < 12; i++) box(g, i % 2 ? LIGHTWOOD : '#ab7b4e', -.76 + i * .28, .05, 0, .25, .16, 1.2);
    for (const z of [-.58, .58]) {
      box(g, WOOD, .8, .56, z, 3.6, .10, .09);
      for (const x of [-.8, .25, 1.35, 2.4]) box(g, WOOD, x, .27, z, .13, .9, .13);
    }
    return g;
  }
  box(g, '#a6a191', 0, .07, 0, 1.48, .14, 1.4);
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
  roof(g, kind === 'woodcutter' ? '#657c51' : kind === 'warehouse' ? '#797467' : ROOF);
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
  preview: THREE.Mesh;
  selection: THREE.Mesh;
  water: THREE.Mesh;
  revision = -1;
  keys = new Set<string>();
  selected: Point | null = null;
  onClick: (p: Point) => void = () => {};
  onHover: (p: Point | null) => void = () => {};
  constructor(public container: HTMLElement, public getState: () => GameState) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor('#cbd8ce');
    this.renderer.domElement.setAttribute('aria-label', 'Grünwassertal: interaktive 3D-Spielwelt. Gebäude über die Bauleiste auswählen und auf ein freies Feld klicken.');
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.Fog('#cbd8ce', 90, 155);
    this.scene.add(new THREE.HemisphereLight('#fff6dc', '#69857e', 2.4));
    const sun = new THREE.DirectionalLight('#fff0cc', 3.0);
    sun.position.set(-22, 40, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 90 });
    sun.shadow.normalBias = .04; sun.shadow.bias = -.0002;
    this.scene.add(sun);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), material('#b7cdc6'));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -.55; sea.receiveShadow = true; this.scene.add(sea);
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(UNIT * 2, UNIT * HEIGHT), new THREE.MeshPhongMaterial({ color: '#69b5bb', shininess: 70, transparent: true, opacity: .86 }));
    this.water.rotation.x = -Math.PI / 2; this.water.position.set(wx(13.5), .26, 0); this.scene.add(this.water);
    this.scene.add(this.terrain, this.buildings, this.people, this.markers);
    this.preview = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#edf9ba', transparent: true, opacity: .42, depthWrite: false }));
    this.preview.visible = false; this.markers.add(this.preview);
    this.selection = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, 1.5), new THREE.MeshBasicMaterial({ color: '#f8d78b', transparent: true, opacity: .72 }));
    this.selection.visible = false; this.markers.add(this.selection);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = .12;
    this.controls.minZoom = .65; this.controls.maxZoom = 3.5;
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
    this.camera.near = .1; this.camera.far = 250; this.camera.updateProjectionMatrix();
  }
  resetCamera() {
    this.camera.position.set(32, 39, 44); this.controls.target.set(-2, 0, 0); this.camera.zoom = 1.25; this.camera.updateProjectionMatrix(); this.controls.update();
  }
  focus(p: Point) {
    const newTarget = new THREE.Vector3(wx(p.x), 0, wz(p.z)), offset = newTarget.clone().sub(this.controls.target);
    this.camera.position.add(offset); this.controls.target.copy(newTarget); this.controls.update();
  }
  rotate(angle: number) {
    const offset = this.camera.position.clone().sub(this.controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.camera.position.copy(this.controls.target).add(offset); this.controls.update();
  }
  zoom(factor: number) { this.camera.zoom = Math.max(.65, Math.min(3.5, this.camera.zoom * factor)); this.camera.updateProjectionMatrix(); }
  pick(e: PointerEvent): Point | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.tileTargets);
    if (!hits.length) return null;
    const p = hits[0].point;
    const x = Math.round(p.x / UNIT + (WIDTH - 1) / 2), z = Math.round(p.z / UNIT + (HEIGHT - 1) / 2);
    return x >= 0 && x < WIDTH && z >= 0 && z < HEIGHT ? { x, z } : null;
  }
  hover(p: Point | null, tool: Tool | null) {
    if (!p || !tool) { this.preview.visible = false; return; }
    const s = this.getState(), check = placement(s, tool, p.x, p.z);
    const bridge = tool === 'bridge' && (p.x === 13 || p.x === 14);
    const x = bridge ? 13.5 : p.x;
    this.preview.position.set(wx(x), tileAt(s, p.x, p.z).height + .1, wz(p.z));
    this.preview.scale.set(bridge ? 3.12 : 1.53, .16, 1.53);
    (this.preview.material as THREE.MeshBasicMaterial).color.set(check.ok ? '#d0efa0' : '#e27d68');
    this.preview.visible = true;
  }
  rebuild() {
    const s = this.getState();
    for (const child of this.terrain.children) if (child instanceof THREE.InstancedMesh) child.dispose();
    this.terrain.clear(); this.tileTargets = [];
    const land = s.tiles.filter(t => t.kind !== 'water');
    const earth = new THREE.InstancedMesh(geometry, material('#997b53'), land.length);
    const grass = new THREE.InstancedMesh(geometry, material('#ffffff'), land.length);
    const matrix = new THREE.Matrix4(); const dummy = new THREE.Object3D();
    land.forEach((t, i) => {
      dummy.position.set(wx(t.x), (t.height - .2) / 2 - .3, wz(t.z)); dummy.scale.set(UNIT, t.height + .4, UNIT); dummy.updateMatrix(); matrix.copy(dummy.matrix); earth.setMatrixAt(i, matrix);
      dummy.position.y = t.height - .07; dummy.scale.set(UNIT, .14, UNIT); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      grass.setColorAt(i, new THREE.Color(t.road ? '#c4b180' : t.variant < .25 ? '#88a76a' : t.variant > .8 ? '#a3b97d' : '#93ad70'));
      const g = new THREE.Group(); g.position.set(wx(t.x), t.height, wz(t.z));
      if (t.node === 'tree') {
        const h = 1.25 + t.variant * .8;
        box(g, '#745038', 0, h / 2, 0, .26, h, .28);
        const foliage = t.variant > .84 ? '#607d4b' : '#537b48';
        box(g, foliage, 0, h + .1, 0, 1.25, .85, 1.15);
        box(g, '#739452', -.1, h + .64, -.02, .88, .5, .82);
        box(g, '#829d59', -.12, h + .94, -.02, .46, .15, .46);
        if (t.variant > .82) box(g, '#d3bc66', .48, h + .16, .48, .16, .16, .16);
      } else if (t.node === 'rock') {
        box(g, '#87958e', -.18, .35, .07, .95, .7, 1.0);
        box(g, '#a7b2a3', .25, .52, -.15, .7, 1.04, .72);
        box(g, '#bac3b2', .2, 1.05, -.15, .5, .12, .52);
      } else if (!t.road && !buildingAt(s, t.x, t.z) && t.variant > .88) {
        for (let j = 0; j < 3; j++) {
          const x = -.4 + j * .31, z = (j % 2) * .4 - .2;
          box(g, '#7e9458', x, .12, z, .05, .24, .05);
          box(g, t.variant > .95 ? '#ece0a3' : '#c6b26f', x, .23, z, .14, .08, .14);
        }
      }
      this.terrain.add(g);
    });
    earth.receiveShadow = true; grass.receiveShadow = true; this.terrain.add(earth, grass);
    this.tileTargets.push(grass, this.water);
    this.buildings.clear(); this.buildingMeshes.clear();
    for (const b of s.buildings) {
      const model = buildingModel(b.kind);
      model.position.set(wx(b.x), b.kind === 'bridge' ? .86 : tileAt(s, b.x, b.z).height, wz(b.z));
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
    this.water.position.y = .26 + Math.sin(time * .6) * .018;
    for (const b of s.buildings) {
      const model = this.buildingMeshes.get(b.id)!;
      const final = model.userData.final as THREE.Group;
      (model.userData.scaffold as THREE.Group).visible = !b.complete;
      final.children.forEach((part, i) => { part.visible = b.complete || i < Math.max(1, Math.floor(final.children.length * b.progress)); });
    }
    for (const v of s.villagers) {
      let g = this.personMeshes.get(v.id);
      if (!g) {
        g = new THREE.Group();
        box(g, ['#bd754c', '#6a8494', '#dac38a', '#799372', '#986b6c'][v.id % 5], 0, .32, 0, .24, .28, .18);
        box(g, '#e4b590', 0, .57, 0, .21, .22, .2);
        box(g, '#634734', 0, .68, -.02, .23, .08, .22);
        const legs = new THREE.Group();
        box(legs, '#554d3e', -.07, .1, 0, .08, .2, .10); box(legs, '#554d3e', .07, .1, 0, .08, .2, .10);
        g.add(legs); g.userData.legs = legs;
        const cargo = box(g, LIGHTWOOD, 0, .3, .22, .27, .24, .2); g.userData.cargo = cargo;
        this.people.add(g); this.personMeshes.set(v.id, g);
      }
      const t = tileAt(s, Math.round(v.x), Math.round(v.z));
      const walking = !!v.task?.path.length;
      g.position.set(wx(v.x), (t.kind === 'water' ? .97 : t.height) + (walking ? Math.abs(Math.sin(s.time * 9 + v.id)) * .055 : 0), wz(v.z));
      g.rotation.y = v.facing;
      const legs = g.userData.legs as THREE.Group;
      legs.children[0].rotation.x = walking ? Math.sin(s.time * 9 + v.id) * .5 : 0;
      legs.children[1].rotation.x = -legs.children[0].rotation.x;
      const cargo = g.userData.cargo as THREE.Mesh;
      cargo.visible = !!v.cargo;
      if (v.cargo) cargo.material = material(v.cargo.resource === 'stone' ? '#98a6a4' : v.cargo.resource === 'planks' ? '#dbb375' : '#89603e');
    }
    for (const [id, g] of this.personMeshes) if (!s.villagers.some(v => v.id === id)) { this.people.remove(g); this.personMeshes.delete(id); }
    this.selection.visible = !!this.selected;
    if (this.selected) this.selection.position.set(wx(this.selected.x), tileAt(s, this.selected.x, this.selected.z).height + .03, wz(this.selected.z));
    this.renderer.render(this.scene, this.camera);
  }
}
