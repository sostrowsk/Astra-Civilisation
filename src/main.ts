import { treeGrowthStage, excavationCheck, excavationStatus, orderExcavation, pitResource } from './surface.ts';
import { capacity, economyRows, staffingSummary, equipmentFor } from './economy.ts';
import { seedNumber } from './generator.ts';
import { mineStatus, DEPTHS, ORE_COLORS, undergroundAt, ensureDepth, markMining } from './mining.ts';
import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/manrope/wght.css';
import './style.css';
import { browserSaveStore, readStoredGame } from './persistence.ts';
import { SaveLibrary, type SavedWorld } from './save-library.ts';
import { knownRegions, regionInfo, BIOMES, ERAS, populationCap, civilisationProgress, advanceCivilisation, expeditionStatus, explore, worldBounds, spendableStock, workerTarget } from './sim.ts';
import { World } from './world.ts';
import { createGame, step, stock, place, placement, markTreeForFelling, treeFellingStatus, markStoneForQuarrying, tileAt, buildingAt, buildingStatus, cancelConstruction, demolitionCheck, demolishBuilding, housingCapacity, serialize, deserialize, DEFINITIONS, NAMES, RESOURCES, type GameState, type Tool, type Point, type BuildingKind, type Building } from './sim.ts';

const ICONS: Record<string, string> = {
  sheepfold: '<path d="M5 17v5m12-5v5M4 10c-2-5 5-8 8-4 5-3 9 2 6 6v5H5V9Zm14-2h3v6h-3"/>',
  weaver: '<path d="M4 3v19M20 3v19M4 6h16M4 18h16M8 6v12m4-12v12m4-12v12M4 12h16"/>',
  tailor: '<path d="m8 3 4 3 4-3 6 5-4 4-2-2v12H8V10l-2 2-4-4Z"/>',
  manufactory: '<path d="M3 22V10l6 4V9l6 5V8l6 5v9ZM4 10V2h3v10M7 18h1m4 0h1m4 0h1"/>',

  miningHouse: '<path d="m2 11 10-8 10 8M5 9v12h14V9M8 21v-6h5v6m1-12 5 5m-6 0 6-5"/>',
  mine: '<path d="M4 22V6h16v16M2 6h20M7 9h10v13M8 14h8m-8 4h8"/>',
  smelter: '<path d="M3 22V10h14v12M13 10V2h5v20M7 21v-6h6v6"/>',
  forge: '<path d="m3 7 8 4h9l-3 5H9l-6-4Zm7 9-2 6h9l-2-6M8 2v5"/>',
  food: '<path d="M12 22V4m0 8C4 12 3 5 3 5s9-1 9 7Zm0 5c8 0 9-7 9-7s-9-1-9 7Z"/>',
  tools: '<path d="m4 21 11-11M14 3a6 6 0 0 0 7 7l-4-4V2Z"/>',
  knowledge: '<path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16"/>',
  farm: '<path d="M3 21V10l7-6 7 6v11M7 21v-7h6v7M20 21V5m-3 5 3 2 3-2"/>',
  forester: '<path d="m8 3-5 8h3l-4 5h5v6h2v-6h5l-4-5h3Zm10 1v16m-3-10 3 3 4-5"/>',
  workshop: '<path d="M3 21V8h7v5l5-5v5l6-5v13ZM6 17h2m4 0h2m3 0h2M5 8V3h3v5"/>',
  academy: '<path d="m2 8 10-5 10 5-10 5Zm4 3v8h12v-8M9 13v6m6-6v6"/>',
  townhall: '<path d="m2 8 10-6 10 6ZM4 10v9m5-9v9m6-9v9m5-9v9M2 22h20"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  wood: '<path d="m5 8 9-5 6 4v10l-9 5-6-4Z"/><path d="m5 8 6 4 9-5M11 12v10m-3-10 8-5"/>',
  planks: '<path d="m3 7 14-4 4 3-14 4Zm0 5 4 3 14-4M3 17l4 4 14-5M7 10v4m0 2v5"/>',
  stone: '<path d="m8 4 9 1 5 9-5 7-12-2-3-8Z"/><path d="m8 4 2 9 12 1M10 13l-5 6m5-6 7 8"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/>',
  woodcutter: '<path d="M12 3 5 12h4l-5 5h6v5h4v-5h6l-5-5h4Z"/>',
  sawmill: '<path d="M3 21V10l9-7 9 7v11ZM8 21v-8h8v8M3 10h18"/><path d="m15 5 3-3m-1 6 4-3"/>',
  quarry: '<path d="m3 20 3-8 8-3 7 11ZM5 5l14 2M12 6l-2 10M9 3l6 1"/>',
  house: '<path d="m2 11 10-8 10 8M5 9v12h14V9M9 21v-7h6v7"/>',
  warehouse: '<path d="M3 21V9l9-6 9 6v12ZM7 21V11h10v10M7 15h10M7 18h10"/>',
  bridge: '<path d="M2 18h20M4 18V6m16 12V6M4 9c4 6 12 6 16 0M8 13v5m4-3v3m4-5v5M2 22h20"/>',
  outpost: '<path d="M7 22V9h10v13M5 9l7-5 7 5M12 4V1h7v4h-7M10 22v-5h4v5M10 12h4"/>',
  road: '<path d="m8 2-5 20m13-20 5 20M12 3v3m0 4v4m0 4v3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  save: '<path d="M4 3h13l4 4v14H3V3Zm3 0v7h10V3M7 21v-7h10v7"/>',
  load: '<path d="M3 8V4h7l2 3h9v14H3V8Zm9 2v8m-4-4 4 4 4-4"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  turn: '<path d="M4 10a8 8 0 1 1 2 8M4 3v7h7"/>',
};
const icon = (name: string, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.cube}</svg>`;
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const sandbox = new URLSearchParams(location.search).has('sandbox');
const labelSettingsKey = 'astra-civilisation:labels' + (sandbox ? ':sandbox' : '');
const labelVisibility = { surface: false, underground: false };
try {
  const saved = JSON.parse(localStorage.getItem(labelSettingsKey) ?? '{}');
  if (typeof saved?.surface === 'boolean') labelVisibility.surface = saved.surface;
  if (typeof saved?.underground === 'boolean') labelVisibility.underground = saved.underground;
} catch { /* Use defaults when browser settings are unavailable. */ }

const saveLibrary = new SaveLibrary(browserSaveStore, sandbox);
let state: GameState, activeSlot: SavedWorld | null = null;
let canSave = true, startupMessage = '';
try {
  const loaded = await saveLibrary.open(() => readStoredGame(sandbox));
  state = loaded.state; activeSlot = loaded.slot;
} catch {
  state = createGame(); canSave = false;
  startupMessage = 'Dein Spielstand bleibt geschützt, weil er nicht geladen werden konnte. Über „Spielstände“ kannst du eine andere oder eine neue Partie öffnen.';
}
let saveBusy = false;
let pendingSave: Promise<boolean> = Promise.resolve(true);
if (import.meta.env.DEV && sandbox) {
  const scenario = new URLSearchParams(location.search).get('scenario');
  if (scenario && ['village', 'world', 'mining', 'economy', 'surface', 'workers'].includes(scenario)) {
    try { const response = await fetch(`/dev-fixtures/${scenario}.json`); if (!response.ok) throw new Error('Fixture fehlt'); state = deserialize(await response.text()); canSave = true; startupMessage = 'Isolierte Testwelt: ' + scenario; }
    catch { startupMessage = 'Testwelt nicht vorhanden. Zuerst npm run fixtures ausführen.'; }
  }
}
let tool: Tool | null = null, selected: Point | null = null, hovered: Point | null = null;
let speed = 1, lastSpeed = 1, world: World, wonShown = state.won, toastTimer: ReturnType<typeof setTimeout>;
let inspectorKey = '', missionKey = '', lastEvent = '';
let buildCategory = 'pioneers';
let viewDepth = 0, activeMine = 0, miningMode: 'inspect' | 'dig' | 'area' | 'cancel' = 'inspect', areaStart: Point | null = null;

const tools: Tool[] = ['woodcutter', 'sawmill', 'quarry', 'house', 'warehouse', 'bridge', 'outpost', 'road', 'farm', 'forester', 'workshop', 'academy', 'townhall', 'mine', 'smelter', 'forge', 'miningHouse', 'sheepfold', 'weaver', 'tailor', 'manufactory'];
const categoryTools = (): Tool[] => buildCategory === 'pioneers' ? tools.slice(0, 8) : buildCategory === 'mining' ? tools.slice(13, 17) : buildCategory === 'textile' ? tools.slice(17) : [...tools.slice(8, 13), 'camp'];
const toolName = (t: Tool) => t === 'road' ? 'Weg' : DEFINITIONS[t].name;
el('app').innerHTML = `
  <main id="world" aria-label="Spielwelt"></main>
  <header class="topbar">
    <a class="brand" href="#" id="brand-home" aria-label="Astra · Heimatansicht">${icon('cube')}<span>ASTRA<small>CIVILISATION</small></span><em>ALPHA</em></a>
    <div class="resource-bar" aria-label="Vorräte in Gebäuden">
      ${RESOURCES.slice(0, 6).map(r => `<div class="resource" data-resource="${r}" title="${NAMES[r]} in Lagern und Betrieben; Baustoffe und Waren unterwegs sind nicht enthalten.">${icon(r)}<div><span>${NAMES[r]}</span><strong id="res-${r}">0</strong></div></div>`).join('')}
      <div class="resource population">${icon('people')}<div><span>Bewohner</span><strong id="population">10 <small>/ 20</small></strong></div></div>
    </div>
    <div class="time-panel"><div class="day">${icon('sun')}<span id="day">Tag 1</span></div><div class="speeds" aria-label="Spielgeschwindigkeit"><button id="pause" class="icon-button" aria-label="Spiel pausieren" title="Pause · Leertaste">${icon('pause')}</button>${[1, 2, 4].map(n => `<button class="speed ${n === 1 ? 'active' : ''}" data-speed="${n}" aria-label="${n}-fache Geschwindigkeit" aria-pressed="${n === 1}">${n}×</button>`).join('')}</div></div>
    <button id="help" class="icon-button top-help" aria-label="Spielhilfe öffnen" title="Spielhilfe">${icon('help')}</button>
  </header>
  <div class="place-label"><span class="live-dot"></span> ASTRA <span class="divider">/</span> <button id="development" class="era-button">Pionierlager · Stufe I</button> <button id="expeditions" class="era-button">${icon('compass')} Expeditionen</button><button id="world-settings" class="era-button">Seed ${state.seed}</button><button id="underground-toggle" class="era-button">${icon('mine')} Unter Tage</button><button id="stock-list" class="era-button">Wirtschaft</button><button id="world-library" class="era-button">Spielstände</button><button id="label-settings" class="era-button">Bewohnerlabels</button>${sandbox ? '<b class="sandbox-label">TESTWELT</b>' : ''}</div>
  <aside id="mission-panel" class="mission panel"><div class="eyebrow">DEINE GESCHICHTE <span id="chapter-number">01</span></div><h1 id="chapter-title">Ein neuer Anfang.</h1><p id="chapter-description">Aus einem kleinen Lager wird<br>ein Ort, der bleibt.</p><div class="mission-progress"><i id="mission-fill"></i></div><ol id="mission-list"></ol><div id="mission-next"></div></aside>
  <aside id="inspector" class="inspector panel" aria-label="Auswahl und Bauinformationen"></aside>
  <div class="view-controls"><button id="rotate-left" class="icon-button" aria-label="Kamera nach links drehen" title="Drehen · Q">${icon('turn')}</button><span></span><button id="zoom-in" class="icon-button" aria-label="Vergrößern">${icon('plus')}</button><button id="zoom-out" class="icon-button" aria-label="Verkleinern">${icon('minus')}</button><span></span><button id="home" class="icon-button" aria-label="Kamera zum Gründungslager" title="Heimatansicht · H">${icon('compass')}</button></div>
  <section class="minimap panel" aria-label="Übersichtskarte"><div class="minimap-title">${icon('compass')} DEIN TAL <span>N ↑</span></div><canvas id="minimap" width="260" height="240" aria-label="Karte mit Gebäuden, Wald und Fluss. Klicken, um die Kamera zu versetzen."></canvas><div class="map-caption"><span class="live-dot"></span><span id="map-state">Westufer · Gründungslager</span></div></section>
  <div id="placement-hint" class="placement-hint" aria-live="polite"></div>
  <nav class="build-dock panel" aria-label="Bauauswahl"><div class="dock-heading"><div class="build-categories"><button data-category="pioneers" class="active">Pioniere</button><button data-category="civilisation">Dorf & Stadt</button><button data-category="mining">Bergbau</button><button data-category="textile">Viehzucht & Handwerk</button></div><span>Wählen & platzieren <kbd>1–8</kbd></span></div><div class="build-tools">${tools.slice(0, 8).map((t, i) => `<button class="build-tool" data-tool="${t}" aria-label="${toolName(t)} bauen" aria-pressed="false"><kbd>${i + 1}</kbd>${icon(t)}<span>${toolName(t)}</span></button>`).join('')}</div></nav>
  <nav id="mining-dock" class="mining-dock panel" hidden aria-label="Untertage-Werkzeuge">
    <div class="mining-dock-heading"><strong>UNTER TAGE</strong><select id="mine-select" aria-label="Aktiver Mineneingang"></select><select id="depth-select" aria-label="Tiefenebene">${[1, 2, 3].map(d => `<option value="${d}">−${DEPTHS[d]} m</option>`).join('')}</select><button id="surface" class="secondary">Zur Oberfläche ↑</button></div>
    <div class="mining-actions"><button data-mining-mode="inspect" class="active">Ansehen</button><button data-mining-mode="dig">Stollen graben</button><button data-mining-mode="area">Gebiet markieren</button><button data-mining-mode="cancel">Markierung löschen</button><label><input id="auto-mine" type="checkbox"> Automatisch erkunden</label></div><p id="mining-help">Dunkles Gestein ist unbekannt. Helle Erzadern wurden bereits entdeckt.</p>
  </nav>
  <div class="bottom-right"><div id="event" class="event"></div><div class="utility"><span id="save-status">Lokal gespeichert</span><button id="save" class="icon-button" aria-label="Spiel speichern" title="Spiel speichern">${icon('save')}</button><button id="load" class="icon-button" aria-label="Spielstände verwalten" title="Spielstände verwalten">${icon('load')}</button><button id="new-game" class="icon-button" aria-label="Neues Spiel starten" title="Neues Spiel">${icon('reset')}</button></div></div>
  <div class="camera-hint">Rechtsziehen <span>Drehen</span> <b>·</b> Scrollen <span>Zoom</span> <b>·</b> WASD <span>Bewegen</span></div>
  <div id="toast" class="toast" role="status"></div>
  <dialog id="dialog"></dialog>
`;

function toast(message: string) { el('toast').textContent = message; el('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el('toast').classList.remove('visible'), 4200); }
function setSpeed(n: number) {
  speed = n; if (n) lastSpeed = n;
  document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b => { const active = Number(b.dataset.speed) === n; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  el('pause').innerHTML = icon(n ? 'pause' : 'play'); el('pause').setAttribute('aria-label', n ? 'Spiel pausieren' : 'Spiel fortsetzen');
  el('pause').classList.toggle('active', !n); el('world').classList.toggle('paused', !n);
}
function setTool(next: Tool | null) {
  tool = next; selected = null; world.selected = null; inspectorKey = '';
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => { const active = b.dataset.tool === tool; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  el('world').classList.toggle('building-mode', !!tool); world.hover(hovered, tool); updateInspector(); updateHint();
}
function buildAt(p: Point) {
  if (!tool) return;
  const result = place(state, tool, p.x, p.z);
  if (!result.ok) { toast(result.reason); return; }
  if (tool !== 'road') { setTool(null); selected = p; world.selected = p; inspectorKey = ''; updateInspector(); }
  updateUI();
}
function costs(t: Tool) {
  if (t === 'road') return '<span class="free-cost">Keine Baukosten</span>';
  return RESOURCES.filter(r => DEFINITIONS[t].cost[r]).map(r => `<span title="${NAMES[r]}">${icon(r)}<b>${DEFINITIONS[t].cost[r]}</b><small>${NAMES[r]}</small></span>`).join('');
}
function updateHint() {
  const hint = el('placement-hint');
  if (!tool) { hint.classList.remove('visible'); return; }
  const check = hovered ? placement(state, tool, hovered.x, hovered.z) : null;
  hint.innerHTML = `${icon(check && !check.ok ? 'close' : tool)}<span>${escape(check?.reason ?? `${toolName(tool)}: Wähle ein Feld in der Welt.`)}</span><kbd>ESC</kbd>`;
  hint.classList.add('visible'); hint.classList.toggle('invalid', !!check && !check.ok);
}
function staffingMarkup(b: Building) {
  return `<label class="recipe-choice">Bergleute einstellen<select id="mine-staff" aria-label="Bergleute einstellen">${[1, 2, 3, 4].map(n => `<option value="${n}" ${workerTarget(b) === n ? 'selected' : ''}>${n} ${n === 1 ? 'Bergmann' : 'Bergleute'}</option>`).join('')}</select></label><p class="staffing-note">Freie Bewohner werden automatisch zugeteilt. Bergmannshäuser in 12 Feldern Nähe haben Vorrang. Beim Reduzieren werden laufende Transporte beendet.</p>`;
}
function bindStaffing(b: Building) {
  el<HTMLSelectElement>('mine-staff').onchange = () => { b.mineWorkers = Number(el<HTMLSelectElement>('mine-staff').value); updateUI(); };
}
function updateInspector() {
  if (viewDepth) { updateMiningInspector(); return; }
  const panel = el('inspector');
  const b = selected ? buildingAt(state, selected.x, selected.z) : undefined;
  const t = selected ? tileAt(state, selected.x, selected.z) : undefined;
  const key = tool ? `tool-${tool}` : b ? `building-${b.id}-${b.complete}` : t ? `tile-${t.x}-${t.z}-${t.node}-${!!t.excavation}` : `intro-${state.level}-${state.milestones.join(',')}`;
  if (key !== inspectorKey) {
    inspectorKey = key;
    const close = `<button class="icon-button panel-close" id="close-inspector" aria-label="Auswahl schließen">${icon('close')}</button>`;
    if (tool) {
      panel.innerHTML = `${close}<div class="eyebrow">BAUPLAN</div><div class="inspector-icon">${icon(tool)}</div><h2>${toolName(tool)}</h2><p>${tool === 'road' ? 'Kurze Wege, große Wirkung. Bewohner bewegen sich auf Wegen 60 % schneller.' : DEFINITIONS[tool].description}</p><div class="costs">${costs(tool)}</div><div class="tip">${icon('cube')}<span>${tool === 'road' ? 'Klicke auf freie Landfelder. Wege entstehen sofort.' : (DEFINITIONS[tool].tier ?? 1) > state.level ? 'Freischaltung: ' + ERAS[(DEFINITIONS[tool].tier ?? 1) - 1].name : 'Deine Bewohner liefern die Waren und bauen selbstständig.'}</span></div><details class="coordinate-build"><summary>Feld gezielt wählen</summary><form id="coordinate-form"><label>X<input id="build-x" name="x" type="number"  value="${hovered?.x ?? 7}" required></label><label>Z<input id="build-z" name="z" type="number"  value="${hovered?.z ?? 10}" required></label><button type="submit" class="primary">Hier bauen</button></form></details><button class="text-button" id="cancel-tool">Plan schließen <kbd>ESC</kbd></button>`;
      el('cancel-tool').onclick = () => setTool(null);
      el('coordinate-form').onsubmit = e => { e.preventDefault(); buildAt({ x: Number(el<HTMLInputElement>('build-x').value), z: Number(el<HTMLInputElement>('build-z').value) }); };
    } else if (b) {
      panel.innerHTML = `${close}<div class="eyebrow">${b.complete ? 'DEINE SIEDLUNG' : 'BAUSTELLE'} <span>${b.x} / ${b.z}</span></div><div class="inspector-icon">${icon(b.kind)}</div><h2>${DEFINITIONS[b.kind].name}</h2><p>${DEFINITIONS[b.kind].description}</p><div id="building-status" class="building-status"></div>${b.complete ? '<button id="demolish-building" class="text-button danger">Gebäude abreißen</button>' : ''}<div id="building-details"></div>${b.complete && b.kind === 'mine' ? staffingMarkup(b) + '<button class="primary" id="enter-mine">Unter Tage ansehen ↓</button>' : ''}${b.complete && ['smelter', 'academy', 'forge', 'manufactory'].includes(b.kind) ? `<label class="recipe-choice">${b.kind === 'smelter' ? 'Metall schmelzen' : b.kind === 'academy' ? 'Forschung mit' : 'Produkt wählen'}<select id="recipe-select">${(b.kind === 'smelter' ? ['iron', 'copper', 'gold'] : b.kind === 'forge' ? ['shears', 'drill'] : b.kind === 'manufactory' ? ['wire', 'gears', 'machineParts'] : ['planks', 'copper', 'gold']).map(r => `<option value="${r}">${NAMES[r as keyof typeof NAMES]}</option>`).join('')}</select></label>` : ''}${b.complete && DEFINITIONS[b.kind].producer ? `<label class="recipe-choice">Betriebspriorität<select id="staff-priority" aria-label="Betriebspriorität">${['Niedrig', 'Normal', 'Hoch'].map((n, i) => `<option value="${i}" ${i === (b.priority ?? 1) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}${!b.complete ? '<button id="cancel-construction" class="text-button danger">Baustelle abbrechen</button>' : (DEFINITIONS[b.kind].producer || b.kind === 'forester') ? '<button id="toggle-production" class="secondary"></button>' : ''}`;
      if (b.complete) {
        el('demolish-building').onclick = () => showDemolition(b);
      }
      if (b.complete && b.kind === 'mine') { el('enter-mine').onclick = () => enterUnderground(b.id); bindStaffing(b); }
      if (b.complete && ['smelter', 'academy', 'forge', 'manufactory'].includes(b.kind)) { const choice = el<HTMLSelectElement>('recipe-select'); choice.value = b.kind === 'smelter' ? b.metal ?? 'iron' : b.kind === 'forge' ? b.forgeProduct ?? 'shears' : b.kind === 'manufactory' ? b.manufacture ?? 'wire' : b.study ?? 'planks'; choice.onchange = () => { if (state.villagers.some(v => v.job === b.id && v.task)) return; if (b.kind === 'smelter') b.metal = choice.value as 'iron' | 'copper' | 'gold'; else if (b.kind === 'forge') b.forgeProduct = choice.value as 'shears' | 'drill'; else if (b.kind === 'manufactory') b.manufacture = choice.value as 'wire' | 'gears' | 'machineParts'; else b.study = choice.value as 'planks' | 'copper' | 'gold'; }; }
      if (b.complete && DEFINITIONS[b.kind].producer) el<HTMLSelectElement>('staff-priority').onchange = () => { b.priority = Number(el<HTMLSelectElement>('staff-priority').value); };
      if (!b.complete) el('cancel-construction').onclick = () => { cancelConstruction(state, b.id); selected = null; world.selected = null; inspectorKey = ''; updateUI(); toast('Baustelle abgebrochen. Material wird zurückgeführt.'); };
      else if (DEFINITIONS[b.kind].producer || b.kind === 'forester') el('toggle-production').onclick = () => { b.active = !b.active; updateInspector(); };
    } else if (t?.node) {
      panel.innerHTML = `${close}<div class="eyebrow">ENTDECKT <span>${t.x} / ${t.z}</span></div><div class="inspector-icon">${icon(t.node === 'tree' ? 'woodcutter' : 'stone')}</div><h2>${t.node === 'tree' ? 'Ein Stück Wald' : 'Steinvorkommen'}</h2><div class="biome-label">${BIOMES[t.biome].name} · ${regionInfo(state, t.region).name}</div><p>${t.node === 'tree' ? 'Ein Holzfäller in der Nähe kann diesen Baum abbauen. Danach wird das Feld frei.' : 'Baue einen Steinbruch in der Nähe. Ein Arbeiter trägt den gewonnenen Stein zurück.'}</p><div class="deposit-amount" id="deposit-amount"></div>${t.node === 'tree' ? '<button class="primary" id="priority-felling">Bevorzugt fällen</button><p id="felling-status" aria-live="polite"></p>' : '<button class="primary" id="priority-quarrying">Bevorzugt abbauen</button><p id="quarrying-status"></p>'}`;
      if (t.node === 'rock') el('priority-quarrying').onclick = () => { markStoneForQuarrying(state, t.x, t.z, !t.priorityQuarrying); updateInspector(); save(); };
      if (t.node === 'tree') el('priority-felling').onclick = () => {
        const marked = !t.priorityFelling;
        if (markTreeForFelling(state, t.x, t.z, marked)) {
          updateInspector(); save();
          toast(marked ? 'Baum zum bevorzugten Fällen vorgemerkt.' : 'Fällpriorität aufgehoben. Eine bereits begonnene Arbeit wird beendet.');
        }
      };
    } else if (t) {
      panel.innerHTML = `${close}<div class="eyebrow">DEIN TAL <span>${t.x} / ${t.z}</span></div><div class="inspector-icon">${icon(t.kind === 'water' ? 'bridge' : 'compass')}</div><h2>${t.kind === 'water' ? t.waterway === 'lake' ? 'Ein stiller See' : 'Ein Flusslauf' : t.excavation ? 'Tagebau' : t.road ? 'Ein guter Weg' : BIOMES[t.biome].name}</h2><p class="biome-note">${regionInfo(state, t.region).name} · ${t.sapling ? 'Ein junger Baum wächst heran. Bis zur vollen Größe bleibt das Feld bebaubar.' : BIOMES[t.biome].description}</p><p>${t.kind === 'water' ? 'Der Fluss trennt die beiden Ufer. Eine Brücke öffnet eurer Siedlung neue Wege.' : 'Wähle unten ein Gebäude und mache aus diesem Feld einen Teil deiner Siedlung.'}</p>`;
      if (t.kind !== 'water') {
        panel.innerHTML += '<p id="growth-status"></p><div class="inventory-label">TAGEBAU · MAXIMAL 3 EBENEN</div><p id="pit-info"></p><p id="pit-status"></p><button class="primary" id="pit-order">Tagebau eröffnen</button><p>20 Rohstoffe je Feld und Ebene. Ab Ebene 2 müssen alle acht Nachbarfelder auf der vorherigen Ebene liegen. Braunkohle: 5 % auf Ebene 2, 10 % auf Ebene 3; nutzbar als Kohle.</p>';
        el('pit-order').onclick = () => { const result = orderExcavation(state, t.x, t.z, !t.excavation?.ordered); toast(result.reason); inspectorKey = ''; updateInspector(); save(); };
      }
    } else if (state.milestones.length) {
      const next = state.won ? undefined : missions.find(m => !state.milestones.includes(m.kind));
      panel.innerHTML = `<div class="eyebrow">DAS LEBEN IM TAL</div><div class="intro-art">${icon('woodcutter')}${icon('house')}${icon('outpost')}</div><h2>Dein Dorf lebt.</h2><p>Jede Lieferung bringt euch weiter. Klicke auf ein Gebäude, um seinen Betrieb und seine Waren zu sehen.</p><div class="economy-chain"><span>${icon('wood')} Holz</span>${icon('arrow')}<span>${icon('planks')} Bretter</span></div><p>${next ? `Euer nächster Schritt: <strong>${next.title}</strong>.` : state.level < 5 ? `Mit der Stufe ${ERAS[state.level - 1].name} eröffnen sich neue Möglichkeiten: entdecke Regionen und plane den nächsten Aufstieg.` : 'Alle Stufen erreicht. Erschließe die restlichen Regionen und baue neue Siedlungen.'}</p><button class="primary" id="continue-building">${next ? `${DEFINITIONS[next.kind].name} planen` : 'Neue Horizonte entdecken'} ${icon('arrow')}</button>`;
      el('continue-building').onclick = () => next ? setTool(next.kind as Tool) : showDevelopment();
    } else {
      panel.innerHTML = `<div class="eyebrow">WILLKOMMEN IM TAL</div><div class="intro-art">${icon('woodcutter')}${icon('house')}${icon('woodcutter')}</div><h2>Großes beginnt klein.</h2><p>Zehn Bewohner sind bereit.<br>Du gibst die Richtung vor.</p><div class="intro-step"><b>1</b><span>Plane einen <strong>Holzfäller</strong> in der Nähe des Waldes.</span></div><div class="intro-step"><b>2</b><span>Beobachte, wie deine Bewohner bauen und arbeiten.</span></div><button class="primary" id="start-building">Den Anfang machen ${icon('arrow')}</button><span class="intro-footnote">In deinem Tempo. Ohne Zeitdruck.</span>`;
      el('start-building').onclick = () => setTool('woodcutter');
    }
    panel.scrollTop = 0;
    if (document.getElementById('close-inspector')) el('close-inspector').onclick = () => { selected = null; world.selected = null; setTool(null); };
  }
  if (b && !tool) {
    if (document.getElementById('recipe-select')) el<HTMLSelectElement>('recipe-select').disabled = state.villagers.some(v => v.job === b.id && !!v.task);
    el('building-status').innerHTML = `<span class="live-dot ${!b.active || !b.complete ? 'amber' : ''}"></span>${buildingStatus(state, b)}`;
    el('building-details').innerHTML = b.complete ? `<div class="inventory-label">WAREN IM GEBÄUDE</div><div class="inventory">${RESOURCES.filter(r => b.inventory[r] > 0 || capacity(b, r) > 0).map(r => `<span title="${NAMES[r]}">${icon(r)}<b>${b.inventory[r]} / ${capacity(b, r)}</b><small>${NAMES[r]}</small></span>`).join('')}</div>${DEFINITIONS[b.kind].producer ? `<p class="worker-label">${icon('people')} ${state.villagers.filter(v => v.job === b.id).map(v => escape(v.name)).join(', ') || 'Noch niemand zugeteilt'} · ${state.villagers.filter(v => v.job === b.id).length} / ${workerTarget(b)} besetzt</p>` : ''}` : `<div class="deliveries">${RESOURCES.filter(r => DEFINITIONS[b.kind].cost[r]).map(r => `<div>${icon(r)}<span>${NAMES[r]}</span><b>${b.delivered[r]} <small>/ ${DEFINITIONS[b.kind].cost[r]}</small></b></div>`).join('')}</div><div class="construction-meter"><i style="width:${b.progress * 100}%"></i></div><span class="progress-label">Aufbau ${Math.floor(b.progress * 100)} % · nach allen Lieferungen</span>`;
    if (b.complete && equipmentFor(b)) el('building-details').innerHTML += `<p class="worker-label">${NAMES[equipmentFor(b)!]}: ${b.equipmentUses ?? 0} Nutzungen verbleiben</p>`;
    if (b.complete && b.kind === 'miningHouse') {
      const residents = state.villagers.filter(v => v.home === b.id);
      el('building-details').innerHTML = `<div class="inventory-label">DEINE BERGMANN-SIEDLUNG</div><p>${residents.length} / 4 Wohnplätze belegt</p><p>${residents.map(v => escape(v.name)).join(', ') || 'Noch keine Bewohner eingezogen. Prüfe die Bevölkerungsgrenze.'}</p><p>${residents.filter(v => state.buildings.some(m => m.id === v.job && m.kind === 'mine')).length} im Bergbau beschäftigt</p><p>Nahe Mine auswählen und bis zu vier Bergleute einstellen. Ein Lagerhaus verkürzt den Abtransport.</p>`;
    }
    if ((DEFINITIONS[b.kind].producer || b.kind === 'forester') && b.complete) el('toggle-production').textContent = b.active ? 'Betrieb pausieren' : 'Betrieb fortsetzen';
  }
  if (t?.node === 'rock' && !b && !tool) {
    el('priority-quarrying').textContent = t.priorityQuarrying ? 'Abbaupriorität aufheben' : 'Bevorzugt abbauen';
    el('quarrying-status').textContent = t.priorityQuarrying ? 'Bevorzugt vorgemerkt. Benötigt einen aktiven Steinbruch mit Arbeiter, freiem Lager und begehbarem Zugang im Umkreis von 9 Feldern. Laufende Arbeiten werden beendet.' : '';
  }
  if (t && !t.node && !b && !tool && t.kind !== 'water') {
    el('growth-status').textContent = t.sapling ? `Baumwachstum: Stufe ${treeGrowthStage(t)} / 6 · noch bebaubar.` : '';
    el('pit-info').textContent = `Abgegraben: ${t.excavation?.depth ?? 0} / 3 Ebenen` + (t.excavation?.remaining ? ` · ${t.excavation.remaining} ${pitResource(state.seed, t.x, t.z, t.excavation.depth + 1) === 'coal' ? 'Braunkohle' : 'Stein'} verbleiben in der nächsten Schicht` : '');
    el('pit-status').textContent = excavationStatus(state, t);
    const button = el<HTMLButtonElement>('pit-order');
    button.textContent = t.excavation?.ordered ? 'Tagebau pausieren' : t.excavation?.remaining ? 'Abbau fortsetzen' : t.excavation ? 'Nächste Ebene abgraben' : 'Tagebau eröffnen';
    button.disabled = !t.excavation?.ordered && !excavationCheck(state, t.x, t.z).ok;
  }
  if (t?.node === 'tree' && !b && !tool) {
    el('priority-felling').textContent = t.priorityFelling ? 'Fällpriorität aufheben' : 'Bevorzugt fällen';
    el('felling-status').textContent = treeFellingStatus(state, t);
  }
  if (t?.node && !b && !tool) el('deposit-amount').textContent = `${t.amount} ${t.node === 'tree' ? 'Holz' : 'Stein'} verfügbar`;
}
const missions: { kind: BuildingKind; title: string; sub: string }[] = [
  { kind: 'woodcutter', title: 'Die erste Hütte', sub: 'Baue einen Holzfäller' },
  { kind: 'sawmill', title: 'Aus Holz wird Zukunft', sub: 'Errichte ein Sägewerk' },
  { kind: 'quarry', title: 'Ein festes Fundament', sub: 'Erschließe ein Steinvorkommen' },
  { kind: 'warehouse', title: 'Ein Ort für Vorräte', sub: 'Errichte ein Lagerhaus' },
  { kind: 'outpost', title: 'Neue Horizonte', sub: 'Gründe einen Außenposten' },
];
function updateMissions() {
  const progress = civilisationProgress(state);
  const key = JSON.stringify([state.level, state.milestones, state.regions, progress.requirements, progress.ready]);
  if (key === missionKey && el('mission-list').children.length) return;
  missionKey = key;
  el('mission-panel').classList.toggle('continuing', state.won);
  el('chapter-number').textContent = String(state.won ? Math.min(5, state.level + 1) : 1).padStart(2, '0');
  if (!state.won) {
    el('chapter-title').textContent = 'Ein neuer Anfang.';
    el('chapter-description').textContent = 'Aus einem kleinen Lager wird ein Ort, der bleibt.';
    const current = missions.findIndex(m => !state.milestones.includes(m.kind));
    el('mission-list').innerHTML = missions.map((m, i) => { const done = state.milestones.includes(m.kind); return `<li class="${done ? 'done' : i === current ? 'current' : ''}"><span class="step-circle">${done ? icon('check') : String(i + 1).padStart(2, '0')}</span><div><strong>${m.title}</strong><span>${m.sub}</span></div></li>`; }).join('');
    el('mission-fill').style.width = `${missions.filter(m => state.milestones.includes(m.kind)).length / missions.length * 100}%`;
    el('mission-next').innerHTML = `<button class="text-button" id="next-mission">${DEFINITIONS[missions[Math.max(0, current)].kind].name} planen ${icon('arrow')}</button>`;
    el('next-mission').onclick = () => setTool(missions[Math.max(0, current)].kind as Tool);
  } else {
    el('chapter-title').textContent = state.level < 5 ? `${ERAS[state.level].name} werden.` : 'Eine Welt für euch.';
    el('chapter-description').textContent = state.level < 5 ? 'Neue Ideen brauchen neue Orte. Erfülle die Ziele und steige auf.' : 'Alle Stufen erreicht. Erschließe die restlichen Regionen und vergrößere deine Städte.';
    const requirements = progress.requirements;
    el('mission-list').innerHTML = requirements.length ? requirements.map(r => `<li class="${r.met ? 'done' : 'current'}"><span class="step-circle">${r.met ? icon('check') : icon('plus')}</span><div><strong>${r.label}</strong><span>${r.current} / ${r.target}</span></div></li>`).join('') : `<li class="done"><span class="step-circle">${icon('check')}</span><div><strong>Manufaktur erreicht</strong><span>${state.regions.length} Regionen entdeckt</span></div></li>`;
    el('mission-fill').style.width = `${requirements.length ? requirements.filter(r => r.met).length / requirements.length * 100 : 100}%`;
    el('mission-next').innerHTML = `<button class="text-button ${progress.ready ? 'ready' : ''}" id="next-development">${progress.ready ? 'Aufstieg möglich!' : 'Entwicklung & Expeditionen'} ${icon('arrow')}</button>`;
    el('next-development').onclick = showDevelopment;
  }
  el('development').textContent = `${ERAS[state.level - 1].name} · Stufe ${state.level}`;
  updateBuildTools();
}
function drawMinimap() {
  const canvas = el<HTMLCanvasElement>('minimap'), ctx = canvas.getContext('2d')!;
  const bounds = worldBounds(state), sx = canvas.width / bounds.width, sz = canvas.height / bounds.height;
  ctx.fillStyle = viewDepth ? '#26333c' : '#c4cbbb'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const t of state.tiles) {
    const u = viewDepth ? undergroundAt(state, t.x, t.z, viewDepth) : null;
    ctx.fillStyle = viewDepth ? !u?.revealed ? '#35434b' : u.order ? '#6a97aa' : u.ore ? ORE_COLORS[u.ore] : u.solid ? '#748087' : '#b4a38b' : t.excavation ? t.excavation.ordered ? '#d4a052' : '#9b9685' : t.kind === 'water' ? '#7ebabc' : t.node === 'tree' ? BIOMES[t.biome].leaves : t.node === 'rock' ? '#a1a698' : t.road ? '#d3bf90' : BIOMES[t.biome].ground;
    ctx.fillRect((t.x - bounds.minX) * sx, (t.z - bounds.minZ) * sz, sx + .2, sz + .2);
  }
  for (const b of state.buildings.filter(b => !viewDepth || b.kind === 'mine')) { ctx.fillStyle = b.complete ? '#fff0b9' : '#b36c46'; ctx.fillRect((b.x - bounds.minX) * sx, (b.z - bounds.minZ) * sz, Math.max(3, sx), Math.max(3, sz)); }
  ctx.fillStyle = '#fff9db'; for (const v of state.villagers.filter(v => v.depth === viewDepth)) ctx.fillRect((v.x - bounds.minX) * sx, (v.z - bounds.minZ) * sz, 2, 2);
  el('map-state').textContent = viewDepth ? `−${DEPTHS[viewDepth]} m · ${state.underground.filter(t => t.depth === viewDepth && t.revealed && !t.solid).length} offene Felder` : `${state.regions.length} Regionen · Seed ${state.seed}`;
}
function updateUI() {
  const stocks = stock(state); for (const r of RESOURCES.slice(0, 6)) { el(`res-${r}`).textContent = stocks[r].toString(); const tier = r === 'food' || r === 'tools' ? 2 : r === 'knowledge' ? 3 : 1; document.querySelector<HTMLElement>(`[data-resource="${r}"]`)!.hidden = state.level < tier; }
  el('population').innerHTML = `${state.villagers.length} <small>/ ${populationCap(state)}</small>`;
  el('day').textContent = `Tag ${Math.floor(state.time / 120) + 1}`;
  updateMissions(); updateInspector(); drawMinimap();
  if (el<HTMLDialogElement>('dialog').open && document.getElementById('economy-content') && performance.now() - economyRefreshed > 1000) renderEconomy();
  if (state.events[0]?.message !== lastEvent) { lastEvent = state.events[0]?.message; el('event').textContent = lastEvent; }
  if (state.won && !wonShown) { wonShown = true; showVictory(); }
}
function save(manual = false, force = false): Promise<boolean> {
  if (saveBusy && !force) return pendingSave;
  if (!canSave || !activeSlot) { el('save-status').textContent = 'Alter Spielstand geschützt'; if (manual) toast(startupMessage); return Promise.resolve(false); }
  const slot = activeSlot, snapshot = serialize(state);
  pendingSave = pendingSave.then(async () => {
    try {
      const updated = await saveLibrary.save(slot, deserialize(snapshot));
      if (activeSlot?.id === slot.id) activeSlot = updated;
      el('save-status').textContent = `Gespeichert · ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
      if (manual) toast(`„${slot.name}“ wurde auf diesem Gerät gespeichert.`);
      return true;
    } catch {
      el('save-status').textContent = 'Speichern nicht möglich';
      if (manual) toast('Der Browser konnte den Spielstand nicht speichern. Prüfe den verfügbaren lokalen Speicher.');
      return false;
    }
  });
  return pendingSave;
}
function replaceState(next: GameState) {
  viewDepth = 0; activeMine = 0; areaStart = null; world.setDepth(0); el('underground-toggle').innerHTML = icon('mine') + ' Unter Tage'; document.body.classList.remove('underground'); el('mining-dock').hidden = true; el('world-settings').textContent = 'Seed ' + next.seed;
  state = next; selected = null; tool = null; world.selected = null; world.revision = -1; world.hover(null, null); inspectorKey = ''; missionKey = '__refresh__'; wonShown = next.won; setTool(null); world.resetCamera(); updateUI();
}
let dialogSpeed = 1, economyRefreshed = 0;
function openDialog(html: string, pause = true) {
  const d = el<HTMLDialogElement>('dialog');
  if (!d.open) dialogSpeed = speed; if (pause) setSpeed(0); world.keys.clear(); d.className = ''; d.innerHTML = html; d.showModal();
  d.onclose = () => setSpeed(dialogSpeed);
  d.querySelectorAll<HTMLElement>('[data-close]').forEach(b => b.onclick = () => d.close());
}
function showDemolition(b: Building) {
  const check = demolitionCheck(state, b.id);
  if (!check.ok) { toast(check.reason); return; }
  const housing = ['camp', 'house', 'miningHouse'].includes(b.kind);
  const remainingHousing = housingCapacity({ ...state, buildings: state.buildings.filter(n => n.id !== b.id) });
  openDialog(`<div class="eyebrow">PLATZ FÜR NEUES · ${b.x} / ${b.z}</div><h2>${DEFINITIONS[b.kind].name} abreißen?</h2><p>Das Gebäude wird dauerhaft entfernt. Lagerwaren und bereits transportierte Güter werden in andere Lager zurückgeführt; bei Platzmangel warten sie als Rückgaben im Wirtschafts-Dashboard.</p><p>Baukosten, bereits eingesetzte Produktionszutaten und angebrochene Ausrüstung werden nicht erstattet. Zugewiesene Arbeiter stehen danach für andere Aufgaben bereit.</p>${housing ? `<p>Die Bewohner bleiben in der Siedlung. Danach gibt es ${remainingHousing} Wohnplätze für ${state.villagers.length} Bewohner. Neue Bewohner ziehen erst ein, wenn wieder Wohnraum frei ist.</p>` : ''}${b.kind === 'camp' ? '<p>Das Gründungslager lässt sich unter „Dorf &amp; Stadt“ kostenlos neu errichten. Ohne Lager bleiben Waren als Rückgaben erhalten.</p>' : ''}${b.kind === 'mine' ? '<p>Alle Bergleute werden mit ihrer Ladung an die Oberfläche geholt. Erkundete Höhlen bleiben erhalten.</p>' : ''}${b.kind === 'bridge' ? '<p>Bewohner auf der Brücke werden ans nächste sichere Ufer versetzt. Transportwege werden neu geplant. Getrennte Ufer benötigen für den Warenaustausch eine neue Brücke.</p>' : ''}${b.kind === 'outpost' ? '<p>Der Baubereich dieses Außenpostens entfällt. Für Neubauten in dieser Region kann ein neuer Außenposten nötig sein.</p>' : ''}<div class="dialog-actions"><button class="secondary" data-close>Behalten</button><button class="primary" id="confirm-demolition">Jetzt abreißen</button></div>`);
  el('confirm-demolition').onclick = () => {
    const result = demolishBuilding(state, b.id);
    el<HTMLDialogElement>('dialog').close();
    if (result.ok) { inspectorKey = ''; missionKey = '__refresh__'; updateUI(); save(); }
    toast(result.reason);
  };
}
function showHelp() {
  openDialog(`<div class="eyebrow">DEIN KLEINER REISEFÜHRER</div><h2>Ein Tal voller Möglichkeiten.</h2><p>Plane Betriebe und beobachte, wie deine Bewohner daraus eine Siedlung machen.</p><div class="help-grid"><div><h3>So wächst dein Dorf</h3><p>Holzfäller gewinnen Holz. Das Sägewerk macht aus <b>1 Holz → 2 Bretter</b>. Ein Steinbruch versorgt deine Baustellen mit Stein. Baue Betriebe nah an Rohstoffen und Lagern.</p><p>Ein Arbeiter pro Betrieb wird automatisch zugeteilt, in Minen bis zu vier nach deiner Einstellung. Die anderen tragen bis zu zwei Waren gleichzeitig. Baustellen bekommen zuerst Material.</p><p>Brückenfelder kosten jeweils <b>4 Bretter und 2 Stein</b>. Baue vom Ufer aus weiter. Ein Außenposten braucht mindestens fünf Felder Abstand vom Lager. Wohnhäuser bringen jeweils zwei neue Bewohner. Zivilisationsstufen erhöhen die Grenze bis auf 128. Über Entwicklung und Expeditionen erschließt du neue Biome. Im Reiter „Dorf &amp; Stadt“ warten Bauernhöfe, Försterei, Werkstatt, Akademie und Rathaus.</p></div><div><h3>Unter Tage</h3><p>Ab dem Dorf: Bergmannshäuser bieten vier Wohnplätze und bevorzugen Minen in 12 Feldern Entfernung. Stelle am Mineneingang unter „Bergleute einstellen“ ein bis vier Arbeitsplätze ein. Mindestens zwei Bewohner bleiben als Träger frei. Mehrere erreichbare Abbaustellen erlauben paralleles Graben. Mineneingang bauen, „Unter Tage“ öffnen und eine Tiefe wählen. Markiere einzelne Stollen oder mit zwei Klicks rechteckige Gebiete. Beginne am Schacht oder einer offenen Höhle. Automatische Erkundung sucht erreichbare Adern in 18 Feldern Umkreis. Schmelzhütten brauchen Erz und Kohle; Werkstätten verarbeiten Stein und Bretter zu einfachen Werkzeugen; Schmieden verarbeiten Eisen und einfache Werkzeuge zu Scheren oder Bohrern. Auf Stufe Viehzucht entsteht aus Nahrung Wolle, daraus Stoff und mit Scheren Kleidung. Die Manufaktur fertigt Draht, Zahnräder und Maschinenteile. Die Akademie verwertet Kupfer und Gold; zwei Diamanten finanzieren eine Expedition.</p><h3>Die Welt in deiner Hand</h3><dl><dt>Auswählen / bauen</dt><dd>Linksklick</dd><dt>Kamera drehen</dt><dd>Rechtsziehen · Q / E</dd><dt>Kamera bewegen</dt><dd>WASD / Pfeile<br>Shift + Rechtsziehen</dd><dt>Vergrößern</dt><dd>Mausrad</dd><dt>Heimatansicht</dt><dd>H</dd><dt>Bauauswahl</dt><dd>1–8</dd><dt>Plan schließen</dt><dd>Escape</dd><dt>Pause / weiter</dt><dd>Leertaste</dd></dl></div></div><div class="help-note">Waren unterwegs und angelieferte Baustoffe zählen nicht zu den Vorräten oben. Wege sind kostenlos und machen Transporte schneller. Der Fortschritt wird alle 20 Sekunden lokal gespeichert. Neue Welten entstehen aus einem Seed. Alte Testpartien der Versionen 1 und 2 sind deaktiviert. Bäume wachsen bei geringer Dichte langsam nach; Förstereien unterstützen sie.</div><button class="primary" data-close>Zurück ins Tal ${icon('arrow')}</button>`);
}
function showVictory() {
  openDialog(`<div class="victory-symbol">${icon('outpost')}</div><div class="eyebrow">KAPITEL 01 · ABGESCHLOSSEN</div><h2>Aus einem Anfang<br>wird eine Zukunft.</h2><p>Ein neuer Ort ist entstanden. Erkundet als Nächstes benachbarte Regionen und entwickelt euer Lager zum Dorf. Über „Entwicklung & Expeditionen“ geht eure Geschichte weiter.</p><div class="victory-stats"><span><b>${state.villagers.length}</b>Bewohner</span><span><b>${state.buildings.filter(b => b.complete).length}</b>Bauwerke</span><span><b>${Math.floor(state.time / 120) + 1}</b>Tage</span></div><button class="primary" data-close>Unser Tal wächst weiter ${icon('arrow')}</button>`);
  save();
}
try { world = new World(el('world'), () => state); world.labelVisibility = labelVisibility; }
catch (error) { el('world').innerHTML = `<div class="webgl-error"><h1>Die 3D-Welt konnte nicht starten.</h1><p>Bitte öffne das Spiel in einem Browser mit aktiviertem WebGL2 und Hardwarebeschleunigung.</p><code>${escape(String(error))}</code></div>`; throw error; }
world.onClick = p => { if (viewDepth) { miningClick(p); return; } if (tool) buildAt(p); else { selected = p; world.selected = p; inspectorKey = ''; updateInspector(); } };
world.onHover = p => { hovered = p; if (viewDepth) return; world.hover(p, tool); updateHint(); };
updateBuildTools();
document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b => b.onclick = () => { buildCategory = b.dataset.category!; updateBuildTools(); });
el('development').onclick = showDevelopment; el('expeditions').onclick = showDevelopment;
document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b => b.onclick = () => setSpeed(Number(b.dataset.speed)));
el('pause').onclick = () => setSpeed(speed ? 0 : lastSpeed);
el('help').onclick = showHelp;
el('label-settings').onclick = () => {
  openDialog(`<div class="eyebrow">ANSICHT</div><h2>Bewohnerlabels</h2><p>Namen und Tätigkeiten über den Bewohnern getrennt ein- oder ausblenden. Die Auswahl gilt für alle deine Partien in diesem Browser.</p><div class="label-options"><label><input id="surface-labels" type="checkbox" ${labelVisibility.surface ? 'checked' : ''}> Oberfläche</label><label><input id="underground-labels" type="checkbox" ${labelVisibility.underground ? 'checked' : ''}> Unter Tage</label></div><button class="primary" data-close>Zurück ins Spiel</button>`);
  for (const [id, key] of [['surface-labels', 'surface'], ['underground-labels', 'underground']] as const) {
    el<HTMLInputElement>(id).onchange = () => {
      labelVisibility[key] = el<HTMLInputElement>(id).checked;
      try { localStorage.setItem(labelSettingsKey, JSON.stringify(labelVisibility)); }
      catch { toast('Die Auswahl gilt für diese Sitzung; der Browser konnte sie nicht dauerhaft speichern.'); }
    };
  }
};

el('home').onclick = () => world.resetCamera();
el('brand-home').onclick = e => { e.preventDefault(); world.resetCamera(); };
el('rotate-left').onclick = () => world.rotate(Math.PI / 4);
el('zoom-in').onclick = () => world.zoom(1.2); el('zoom-out').onclick = () => world.zoom(1 / 1.2);
el('save').onclick = () => save(true);
el('load').onclick = showSavedWorlds;
el('world-library').onclick = showSavedWorlds;
el('new-game').onclick = () => showNewWorld();

async function worldAction(action: () => Promise<void>) {
  if (saveBusy) return;
  saveBusy = true;
  const dialog = el<HTMLDialogElement>('dialog');
  dialog.oncancel = event => event.preventDefault();
  dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.disabled = true);
  try { await pendingSave; await action(); }
  catch (error) { toast(error instanceof Error ? error.message : 'Der Spielstand konnte nicht gespeichert werden. Dein aktuelles Tal bleibt geöffnet.'); }
  finally { saveBusy = false; dialog.oncancel = null; dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.disabled = false); }
}
async function preserveCurrentWorld() {
  if (canSave && activeSlot && !await save(false, true)) throw new Error('Dein aktuelles Tal konnte nicht gespeichert werden. Der Wechsel wurde abgebrochen.');
}
function showNewWorld(restart = false) {
  openDialog(`<div class="eyebrow">EIN NEUER ANFANG</div><h2>${restart ? 'Dieses Tal neu beginnen' : 'Ein neues Tal gründen'}</h2><p>${restart ? 'Du beginnst mit derselben Landschaft wieder im Pionierlager. Dein bisheriger Fortschritt bleibt als eigene Partie erhalten.' : 'Jede Welt hat ihren eigenen Spielstand. Dein bisheriges Tal wird gespeichert und bleibt in deiner Liste.'}</p><form id="new-world-form"><label class="seed-input">Name der Partie<input id="world-name" maxlength="60" placeholder="Mein neues Tal" value="${restart ? escape((activeSlot?.name ?? 'Mein Tal') + ' · Neustart') : ''}"></label><label class="seed-input">Welt-Seed<input id="seed-input" placeholder="Leer lassen für eine zufällige Welt" maxlength="80" ${restart ? `value="${state.seed}" readonly` : ''}><small>Zahl oder Text · gleicher Seed, gleiche Landschaft.</small></label><div class="dialog-actions"><button type="button" class="secondary" data-close>Abbrechen</button><button type="submit" class="primary">${restart ? 'Als neue Partie neu starten' : 'Neues Tal gründen'}</button></div></form>`);
  el<HTMLFormElement>('new-world-form').onsubmit = event => {
    event.preventDefault();
    const seedText = el<HTMLInputElement>('seed-input').value.trim(), name = el<HTMLInputElement>('world-name').value;
    void worldAction(async () => {
      await preserveCurrentWorld();
      const next = seedText ? createGame(seedNumber(seedText)) : createGame();
      const slot = await saveLibrary.create(next, name);
      activeSlot = slot; canSave = true; replaceState(next); dialogSpeed = 1;
      el('save-status').textContent = 'Lokal gespeichert';
      el<HTMLDialogElement>('dialog').close(); toast(`„${slot.name}“ ist bereit. Dein bisheriges Tal bleibt gespeichert.`);
    });
  };
}
async function showSavedWorlds() {
  openDialog('<div class="eyebrow">DEINE WELTEN</div><h2>Spielstände</h2><p>Gespeicherte Welten werden geladen …</p><button class="secondary" data-close>Zurück ins Tal</button>');
  try {
    const slots = await saveLibrary.list();
    if (!el<HTMLDialogElement>('dialog').open) return;
    openDialog(`<div class="eyebrow">DEINE WELTEN · ${slots.length} PARTIEN</div><h2>Spielstände</h2><p>Automatisch alle 20 Sekunden und vor jedem Wechsel gespeichert. Deine Welten bleiben lokal in diesem Browser auf diesem Gerät.</p><div class="world-list">${slots.map(slot => `<article class="saved-world ${slot.id === activeSlot?.id ? 'current' : ''}"><div><h3>${escape(slot.name)} ${slot.id === activeSlot?.id ? '<small>Aktuell</small>' : ''}</h3><p>Tag ${slot.day} · ${escape(ERAS[slot.level - 1]?.name ?? 'Pionierlager')} · ${slot.population} Bewohner · ${slot.regions} Regionen</p><p>Seed ${slot.seed} · Gespeichert ${escape(new Date(slot.updatedAt).toLocaleString('de-DE'))}</p></div><div class="world-actions">${slot.id === activeSlot?.id ? '<button class="secondary" data-close>Weiterspielen</button><button class="secondary" id="restart-world">Neu starten</button>' : `<button class="primary" data-open-world="${escape(slot.id)}">Laden</button>`}<button class="secondary" data-rename-world="${escape(slot.id)}">Umbenennen</button>${slot.id !== activeSlot?.id ? `<button class="secondary danger" data-delete-world="${escape(slot.id)}">Löschen</button>` : ''}</div></article>`).join('') || '<p>Noch keine gespeicherten Welten.</p>'}</div><div class="dialog-actions"><button class="secondary" data-close>Zurück ins Tal</button><button class="primary" id="create-world">Neue Welt</button></div>`);
    el('dialog').className = 'worlds-dialog';
    el('create-world').onclick = () => showNewWorld();
    if (document.getElementById('restart-world')) el('restart-world').onclick = () => showNewWorld(true);
    el('dialog').querySelectorAll<HTMLButtonElement>('[data-open-world]').forEach(button => button.onclick = () => void worldAction(async () => {
      const next = await saveLibrary.load(button.dataset.openWorld!);
      await preserveCurrentWorld(); await saveLibrary.activate(next.slot.id);
      activeSlot = next.slot; canSave = true; replaceState(next.state);
      el('save-status').textContent = 'Lokal gespeichert'; el<HTMLDialogElement>('dialog').close(); toast(`Willkommen zurück in „${next.slot.name}“.`);
    }));
    el('dialog').querySelectorAll<HTMLButtonElement>('[data-rename-world]').forEach(button => button.onclick = () => {
      const slot = slots.find(item => item.id === button.dataset.renameWorld)!;
      openDialog(`<h2>Partie umbenennen</h2><form id="rename-world-form"><label class="seed-input">Name<input id="rename-world-name" value="${escape(slot.name)}" maxlength="60" required></label><div class="dialog-actions"><button type="button" class="secondary" data-close>Abbrechen</button><button class="primary" type="submit">Name speichern</button></div></form>`);
      el<HTMLFormElement>('rename-world-form').onsubmit = event => {
        event.preventDefault(); const name = el<HTMLInputElement>('rename-world-name').value;
        void worldAction(async () => { const renamed = await saveLibrary.rename(slot.id, name); if (activeSlot?.id === slot.id) activeSlot = renamed; await showSavedWorlds(); });
      };
    });
    el('dialog').querySelectorAll<HTMLButtonElement>('[data-delete-world]').forEach(button => button.onclick = () => {
      const slot = slots.find(item => item.id === button.dataset.deleteWorld)!;
      openDialog(`<h2>„${escape(slot.name)}“ löschen?</h2><p>Dieser gespeicherte Spielstand wird dauerhaft entfernt. Dein aktuell geöffnetes Tal bleibt erhalten.</p><div class="dialog-actions"><button class="secondary" data-close>Abbrechen</button><button class="primary" id="confirm-delete-world">Endgültig löschen</button></div>`);
      el('confirm-delete-world').onclick = () => void worldAction(async () => { await saveLibrary.remove(slot.id); await showSavedWorlds(); });
    });
  } catch { toast('Die Spielstandliste konnte nicht geladen werden. Dein aktuelles Tal bleibt geöffnet.'); }
}
el('world-settings').onclick = () => showNewWorld(); el('underground-toggle').onclick = () => viewDepth ? leaveUnderground() : enterUnderground();
el('stock-list').onclick = showStocks;
el('surface').onclick = leaveUnderground;
el('depth-select').onchange = () => setUndergroundDepth(Number(el<HTMLSelectElement>('depth-select').value));
el('mine-select').onchange = () => enterUnderground(Number(el<HTMLSelectElement>('mine-select').value));
el('auto-mine').onchange = () => { const b = state.buildings.find(b => b.id === activeMine); if (b) b.autoMine = el<HTMLInputElement>('auto-mine').checked; };
document.querySelectorAll<HTMLButtonElement>('[data-mining-mode]').forEach(b => b.onclick = () => { miningMode = b.dataset.miningMode as typeof miningMode; areaStart = null; updateMiningControls(); });
el('minimap').onclick = e => { const r = el('minimap').getBoundingClientRect(), bounds = worldBounds(state); world.focus({ x: bounds.minX + Math.min(bounds.width - 1, Math.floor((e.clientX - r.left) / r.width * bounds.width)), z: bounds.minZ + Math.min(bounds.height - 1, Math.floor((e.clientY - r.top) / r.height * bounds.height)) }); };
window.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); if (!e.repeat) setSpeed(speed ? 0 : lastSpeed); }
  if (e.key === 'Escape') { setTool(null); areaStart = null; miningMode = 'inspect'; if (viewDepth) updateMiningControls(); }
  if (e.key.toLowerCase() === 'h') world.resetCamera();
  if (!viewDepth && Number(e.key) >= 1 && Number(e.key) <= 8) { const choice = categoryTools()[Number(e.key) - 1]; if (choice) setTool(choice); }
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
setInterval(() => { if (!document.querySelector('dialog[open]')) save(); }, 20_000);
window.addEventListener('pagehide', () => save());
document.addEventListener('visibilitychange', () => { world.keys.clear(); if (document.hidden) save(); });
let previous = performance.now(), accumulator = 0, uiAccumulator = 0;
function frame(now: number) {
  const dt = Math.min((now - previous) / 1000, .1); previous = now;
  if (!document.hidden) {
    accumulator += dt * speed;
    while (accumulator >= .1) { step(state, .1); accumulator -= .1; }
    uiAccumulator += dt;
    if (uiAccumulator >= .25) { updateUI(); uiAccumulator = 0; }
    world.render(dt, now / 1000);
  }
  requestAnimationFrame(frame);
}
updateUI(); save(); if (startupMessage) toast(startupMessage);
requestAnimationFrame(frame);

function updateBuildTools() {
  const choices = categoryTools();
  const list = document.querySelector<HTMLElement>('.build-tools')!;
  const markup = choices.map((t, i) => { const tier = t === 'road' ? 1 : DEFINITIONS[t].tier ?? 1; return `<button class="build-tool ${tool === t ? 'active' : ''} ${tier > state.level ? 'locked' : ''}" data-tool="${t}" aria-label="${toolName(t)} bauen" aria-pressed="${tool === t}" title="${tier > state.level ? 'Ab Stufe ' + ERAS[tier - 1].name : toolName(t)}"><kbd>${tier > state.level ? 'St. ' + tier : i + 1}</kbd>${icon(t)}<span>${toolName(t)}</span></button>`; }).join('');
  if (list.innerHTML !== markup) {
    list.innerHTML = markup; list.classList.toggle('advanced', buildCategory !== 'pioneers');
    list.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => b.onclick = () => setTool(tool === b.dataset.tool ? null : b.dataset.tool as Tool));
  }
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b => { b.classList.toggle('active', b.dataset.category === buildCategory); b.setAttribute('aria-pressed', String(b.dataset.category === buildCategory)); });
}
function stockCostMarkup(cost: ReturnType<typeof stock>) {
  const free = spendableStock(state);
  return `<div class="expedition-cost">${RESOURCES.filter(r => cost[r]).map(r => `<span class="${free[r] < cost[r] ? 'missing' : ''}" title="${NAMES[r]}: ${free[r]} unreserviert">${icon(r)} ${cost[r]} <small>${NAMES[r]}</small></span>`).join('')}</div>`;
}
function showDevelopment() {
  renderDevelopment(false);
}
function renderDevelopment(refresh: boolean) {
  const era = ERAS[state.level - 1], next = ERAS[state.level], progress = civilisationProgress(state);
  const missingBasics: BuildingKind[] = ['woodcutter', 'sawmill', 'quarry', 'house', 'warehouse', 'outpost'];
  const missing = missingBasics.filter(k => !state.buildings.some(b => b.kind === k && b.complete));
  const html = `<div class="development-heading"><div><div class="eyebrow">EURE GESCHICHTE GEHT WEITER</div><h2>Neue Horizonte.</h2><p>${era.name} · ${state.villagers.length} / ${era.cap} Bewohner · ${state.regions.length} Regionen</p></div><button class="icon-button" data-close aria-label="Entwicklung schließen">${icon('close')}</button></div><div class="era-track">${ERAS.map((e, i) => `<div class="${i + 1 === state.level ? 'current' : i + 1 < state.level ? 'done' : ''}"><b>${i + 1 < state.level ? '✓' : '0' + (i + 1)}</b><span>${e.name}</span></div>`).join('')}</div><div class="development-layout"><section class="ascension"><div class="eyebrow">${next ? 'DER NÄCHSTE SCHRITT' : 'EINE BLÜHENDE ZIVILISATION'}</div><h3>${next ? era.name + ' → ' + next.name : 'Die Manufaktur steht.'}</h3><p>${next?.unlocks ?? 'Weitere Regionen warten hinter jedem Horizont. Baue bis zu 128 Bewohnern ein Zuhause.'}</p><ul>${progress.requirements.map(r => `<li class="${r.met ? 'met' : ''}">${icon(r.met ? 'check' : 'plus')}<span>${r.label}</span><b>${r.current}/${r.target}</b></li>`).join('')}</ul>${state.level === 1 && missing.length ? `<p class="missing-buildings">Noch zu bauen: ${missing.map(k => DEFINITIONS[k].name).join(', ')}.</p>` : ''}${next ? `${stockCostMarkup(progress.cost)}<p class="cost-explanation">Aufstiegskosten werden aus unreservierten Gebäudebeständen bezahlt.</p><button class="primary" id="advance-era" ${progress.ready ? '' : 'disabled'}>Zur Stufe ${next.name} aufsteigen ${icon('arrow')}</button>` : '<div class="chapter-done">✓ Alle Zivilisationsstufen erreicht</div>'}</section><section class="regions"><div class="eyebrow">DIE BEKANNTE WELT</div><h3>Hinter dem nächsten Horizont.</h3><div class="region-grid">${knownRegions(state).map(r => { const discovered = state.regions.includes(r.id), status = expeditionStatus(state, r.id); return `<article class="region-card biome-${r.biome} ${discovered ? 'discovered' : ''}"><div class="region-art">${icon(r.biome === 'forest' ? 'woodcutter' : r.biome === 'highland' ? 'quarry' : r.biome === 'desert' ? 'sun' : 'house')}<span>${BIOMES[r.biome].name}</span><b>${discovered ? 'ENTDECKT' : 'STUFE ' + r.tier}</b></div><div class="region-content"><h4>${r.name}</h4><p>${r.description}</p>${discovered ? `<button class="secondary" data-focus-region="${r.id}">Region ansehen ${icon('arrow')}</button>` : `${stockCostMarkup(r.cost)}<button class="secondary" data-explore="${r.id}" ${status.ok ? '' : 'disabled'}>Expedition starten</button><small class="expedition-reason">${status.reason}</small>${spendableStock(state).diamond >= 2 ? `<button class="secondary" data-gem-explore="${r.id}" ${expeditionStatus(state, r.id, true).ok ? '' : 'disabled'}>Mit 2 Diamanten erkunden</button>` : ''}`}</div></article>`; }).join('')}</div></section></div><div class="development-footer"><span>Expeditionen erschließen jeweils 26 × 24 Felder. Ein Außenposten erlaubt Bauen in 9 Feldern Umkreis. Die Welt wächst mit jeder Expedition in alle vier Richtungen.</span><button class="primary" data-close>Zurück zur Siedlung</button></div>`;
  const dialog = el<HTMLDialogElement>('dialog');
  if (refresh) dialog.innerHTML = html; else openDialog(html);
  dialog.className = 'development-dialog';
  dialog.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b => b.onclick = () => dialog.close());
  dialog.querySelectorAll<HTMLButtonElement>('[data-explore]').forEach(b => b.onclick = () => { const result = explore(state, Number(b.dataset.explore)); toast(result.reason); updateUI(); if (result.ok) save(); renderDevelopment(true); });
  dialog.querySelectorAll<HTMLButtonElement>('[data-gem-explore]').forEach(b => b.onclick = () => { const result = explore(state, Number(b.dataset.gemExplore), true); toast(result.reason); updateUI(); if (result.ok) save(); renderDevelopment(true); });
  dialog.querySelectorAll<HTMLButtonElement>('[data-focus-region]').forEach(b => b.onclick = () => { const r = regionInfo(state, Number(b.dataset.focusRegion)); dialog.close(); world.focus({ x: r.x + 12, z: r.z + 12 }); });
  if (document.getElementById('advance-era')) el('advance-era').onclick = () => { const result = advanceCivilisation(state); toast(result.reason); updateUI(); if (result.ok) save(); renderDevelopment(true); };
}

function showStocks() {
  openDialog(`<div class="eyebrow">DEINE WIRTSCHAFT · LIVE</div><h2>Vorräte, Bedarf & Produktion.</h2><p>Reale Warenflüsse der letzten fünf Spielminuten (10-Sekunden-Intervalle), in Einheiten pro Spielminute. Transporte verändern die Bilanz nicht. Die Simulation läuft weiter.</p><div id="economy-content"></div><button class="primary" data-close>Zurück zur Siedlung</button>`, false);
  el('dialog').className = 'economy-dialog'; renderEconomy();
}
function renderEconomy() {
  economyRefreshed = performance.now();
  const scroll = document.querySelector('.economy-table-scroll')?.scrollLeft ?? 0;
  const open = document.querySelector<HTMLDetailsElement>('.economy-blockers')?.open ?? true;
  const staff = staffingSummary(state), rows = economyRows(state), minutes = Math.min(5, Math.max(0, state.time - (state.economy?.startedAt ?? state.time)) / 60);
  const format = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const blocked = state.buildings.filter(b => b.complete && DEFINITIONS[b.kind].producer).map(b => ({ b, reason: buildingStatus(state, b) })).filter(({ reason }) => /Wartet|voll|Personalmangel|pausiert|Kein|Keine/.test(reason));
  el('economy-content').innerHTML = `<div class="economy-summary"><div><strong>${staff.assigned} / ${staff.jobs}</strong><span>Arbeitsplätze besetzt</span></div><div><strong>${staff.carriers}</strong><span>Träger · mindestens 2</span></div><div><strong>${staff.vacancies}</strong><span>Unbesetzte Stellen</span></div><div><strong>${format(minutes)} min</strong><span>Beobachtungszeit · Spielzeit</span></div></div><div class="economy-table-scroll"><table><thead><tr><th>Ware</th><th>Vorrat / Kapazität</th><th>Unterwegs</th><th>Frei</th><th>Produktion/min</th><th>Verbrauch/min</th><th>Saldo/min</th><th>Betriebsbedarf</th><th>Aufstieg</th><th>Optionale Ausrüstung</th><th>Einordnung</th></tr></thead><tbody>${rows.map(r => `<tr><th>${NAMES[r.resource]}</th><td>${r.amount} / ${r.capacity}</td><td>${r.moving}</td><td>${r.free}</td><td>${format(r.produced)}</td><td>${format(r.consumed)}</td><td class="${r.balance < 0 ? 'negative' : r.balance > 0 ? 'positive' : ''}">${r.balance > 0 ? '+' : ''}${format(r.balance)}</td><td>${r.demand}</td><td>${r.goal}</td><td>${r.upgrades}</td><td>${r.status}${r.pending ? `<small> · ${r.pending} Rückgaben warten</small>` : ''}</td></tr>`).join('')}</tbody></table></div><p class="economy-explanation">Offener Bedarf: noch fehlende Baustoffe und Zutaten für den nächsten Arbeitszyklus aktiver Betriebe, einschließlich nötiger Scheren. Aufstieg zeigt die Kosten der nächsten Stufe; optionale Bohrer und Maschinenteile sind separat aufgeführt. Überschuss bedeutet derzeit mehr Produktion als Verbrauch; Vorräte können trotzdem lokal fehlen. Die ersten Messwerte werden ab diesem Update erfasst.</p><details class="economy-blockers" open><summary>${blocked.length} Betriebe warten oder sind pausiert</summary><ul>${blocked.slice(0, 30).map(({ b, reason }) => `<li><b>${DEFINITIONS[b.kind].name} (${b.x} / ${b.z})</b><span>${escape(reason)}</span></li>`).join('')}</ul>${blocked.length > 30 ? '<p>Die ersten 30 Betriebe werden angezeigt.</p>' : ''}</details>`;
  document.querySelector('.economy-table-scroll')!.scrollLeft = scroll;
  document.querySelector<HTMLDetailsElement>('.economy-blockers')!.open = open;
}
function enterUnderground(id?: number) {
  const mines = state.buildings.filter(b => b.kind === 'mine' && b.complete);
  const mine = mines.find(b => b.id === id) ?? mines.find(b => b.id === activeMine) ?? mines[0];
  if (!mine) { toast('Baue ab der Stufe Dorf zuerst einen Mineneingang.'); return; }
  activeMine = mine.id;
  el('mine-select').innerHTML = mines.map(b => `<option value="${b.id}">Mine ${b.x} / ${b.z}</option>`).join('');
  el<HTMLSelectElement>('mine-select').value = String(mine.id);
  setTool(null); setUndergroundDepth(mine.mineDepth ?? 1); world.focus(mine);
}
function setUndergroundDepth(depth: number, assign = true) {
  viewDepth = depth; const b = state.buildings.find(b => b.id === activeMine); if (b && assign) b.mineDepth = depth;
  ensureDepth(state, depth); world.setDepth(depth); selected = null; areaStart = null; inspectorKey = '';
  document.body.classList.add('underground'); el('mining-dock').hidden = false;
  el<HTMLSelectElement>('depth-select').value = String(depth); el('underground-toggle').textContent = '↑ Oberfläche';
  updateMiningControls(); updateUI();
}
function leaveUnderground() {
  viewDepth = 0; world.setDepth(0); selected = null; areaStart = null; inspectorKey = '';
  document.body.classList.remove('underground'); el('mining-dock').hidden = true; el('underground-toggle').innerHTML = icon('mine') + ' Unter Tage'; updateUI();
}
function updateMiningControls() {
  document.querySelectorAll<HTMLButtonElement>('[data-mining-mode]').forEach(b => { b.classList.toggle('active', b.dataset.miningMode === miningMode); b.setAttribute('aria-pressed', String(b.dataset.miningMode === miningMode)); });
  el<HTMLInputElement>('auto-mine').checked = !!state.buildings.find(b => b.id === activeMine)?.autoMine;
  el('mining-help').textContent = miningMode === 'area' ? areaStart ? 'Zweite Ecke wählen · maximal 256 Felder.' : 'Erste Ecke wählen, danach die gegenüberliegende Ecke.' : miningMode === 'dig' ? 'Klicke Gesteinsfelder an. Verbundene Markierungen ergeben einen Stollen.' : miningMode === 'cancel' ? 'Klicke eine Markierung an, um sie aufzuheben. Laufende Arbeit wird beendet.' : 'Dunkles Gestein ist unbekannt. Helle Erzadern wurden bereits entdeckt.';
}
function miningClick(p: Point) {
  selected = p; world.selected = p; inspectorKey = '';
  if (miningMode === 'area' && !areaStart) areaStart = p;
  else if (miningMode !== 'inspect') { const result = markMining(state, activeMine, viewDepth, areaStart ?? p, p, miningMode === 'cancel'); toast(result.reason); areaStart = null; }
  updateMiningControls(); updateMiningInspector();
}
function updateMiningInspector() {
  const t = selected ? undergroundAt(state, selected.x, selected.z, viewDepth) : null;
  const mine = state.buildings.find(b => b.id === activeMine)!;
  const k = `under:${activeMine}:${viewDepth}:${selected?.x}:${selected?.z}:${t?.revealed}:${t?.solid}:${t?.ore}:${t?.order}`;
  if (inspectorKey !== k) {
    inspectorKey = k;
    el('inspector').innerHTML = `<div class="eyebrow">UNTER TAGE · −${DEPTHS[viewDepth]} M</div><div class="inspector-icon">${icon('mine')}</div><section class="mine-activity" aria-label="Bergbau-Betrieb"><strong id="mine-worker"></strong><p id="mine-status"></p><span id="mine-population"></span><label class="recipe-choice">Bergmann auswählen<select id="worker-select" aria-label="Bergmann auswählen"></select></label><button class="secondary" id="locate-miner">Bergmann zeigen</button></section>${staffingMarkup(mine)}<h2>${!t ? 'Unter dem Tal.' : !t.revealed ? 'Unbekanntes Gestein' : !t.solid ? 'Offener Stollen' : t.ore ? NAMES[t.ore] : 'Massiver Fels'}</h2><p>${!t ? 'Wähle eine Erkundungsrichtung. Deine Bergleute graben Zugänge, entdecken Höhlen und bringen Rohstoffe zum Minenlager.' : !t.revealed ? 'Was hier verborgen liegt, zeigen erst Erkundung und Abbau. Verbinde dieses Ziel mit dem Schacht.' : !t.solid ? 'Ein begehbares Feld. Verbundene Höhlen sind bereits sichtbar.' : 'Nur erreichbare Abbaufronten werden bearbeitet. Markiere einen zusammenhängenden Weg vom Schacht hierher.'}</p><div id="underground-amount"></div><p>${t?.order ? 'Zum Abbau markiert.' : ''}</p><details class="coordinate-build"><summary>Stollen über Koordinaten markieren</summary><form id="mining-form"><label>Von X<input id="mine-x1" type="number" value="${selected?.x ?? state.buildings.find(b => b.id === activeMine)!.x}" required></label><label>Von Z<input id="mine-z1" type="number" value="${selected?.z ?? state.buildings.find(b => b.id === activeMine)!.z}" required></label><label>Bis X<input id="mine-x2" type="number" value="${selected?.x ?? state.buildings.find(b => b.id === activeMine)!.x + 4}" required></label><label>Bis Z<input id="mine-z2" type="number" value="${selected?.z ?? state.buildings.find(b => b.id === activeMine)!.z}" required></label><button class="primary">Abbau markieren</button></form></details><p class="biome-note">Bis zu vier Bergleute pro Mine · Auftragstiefe −${DEPTHS[mine.mineDepth ?? 1]} m. Bereits begonnene Transporte werden auf ihrer bisherigen Ebene abgeschlossen.</p>`;
    bindStaffing(mine);
    el('locate-miner').onclick = () => { const worker = state.villagers.find(v => v.job === activeMine && v.id === Number(el<HTMLSelectElement>('worker-select').value)); if (!worker) return; if (worker.depth) setUndergroundDepth(worker.depth, false); else leaveUnderground(); world.focus(worker); world.zoom(Math.max(1, 2 / world.camera.zoom)); if (viewDepth) el<HTMLSelectElement>('worker-select').value = String(worker.id); };
    el('mining-form').onsubmit = e => { e.preventDefault(); const n = (id: string) => Number(el<HTMLInputElement>(id).value); toast(markMining(state, activeMine, viewDepth, { x: n('mine-x1'), z: n('mine-z1') }, { x: n('mine-x2'), z: n('mine-z2') }).reason); };
  }
  const staff = state.villagers.filter(v => v.job === mine.id);
  const picker = el<HTMLSelectElement>('worker-select'), previous = picker.value;
  const options = staff.map(v => `<option value="${v.id}">${escape(v.name)} · ${v.depth ? '−' + DEPTHS[v.depth] + ' m' : 'Oberfläche'}</option>`).join('') || '<option value="">Kein Bergmann zugeteilt</option>';
  if (picker.innerHTML !== options) { picker.innerHTML = options; if (staff.some(v => String(v.id) === previous)) picker.value = previous; }
  picker.disabled = !staff.length;
  el('mine-worker').textContent = `${staff.length} / ${workerTarget(mine)} Bergleute zugeteilt`;

  el('mine-status').textContent = mineStatus(state, mine);
  el('mine-population').textContent = `${state.villagers.filter(v => v.depth === viewDepth).length} Bergleute auf dieser Ebene · ${Object.values(mine.inventory).reduce((a, b) => a + b, 0)} Waren · max. 40 je Fördergut · Bohrer: ${mine.equipmentUses ?? 0} Nutzungen`;
  el<HTMLButtonElement>('locate-miner').disabled = !staff.length;
  el('underground-amount').textContent = t?.revealed && t.solid ? `${t.amount} ${t.ore ? NAMES[t.ore] : 'Stein'} · Feld ${t.x} / ${t.z}` : '';
}
