import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/manrope/wght.css';
import './style.css';
import { World } from './world.ts';
import { createGame, step, stock, place, placement, tileAt, buildingAt, buildingStatus, cancelConstruction, serialize, deserialize, DEFINITIONS, NAMES, RESOURCES, WIDTH, HEIGHT, type GameState, type Tool, type Point, type BuildingKind } from './sim.ts';

const ICONS: Record<string, string> = {
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
const SAVE_KEY = 'astra-civilisation:save:v1';
let state: GameState = createGame();
let startupMessage = '';
try { const saved = localStorage.getItem(SAVE_KEY); if (saved) { state = deserialize(saved); startupMessage = 'Willkommen zurück. Dein Tal wartet auf dich.'; } } catch { startupMessage = 'Der gespeicherte Spielstand konnte nicht geladen werden. Ein neues Tal ist bereit.'; }
let tool: Tool | null = null, selected: Point | null = null, hovered: Point | null = null;
let speed = 1, lastSpeed = 1, world: World, wonShown = state.won, toastTimer: ReturnType<typeof setTimeout>;
let inspectorKey = '', missionKey = '', lastEvent = '';

const tools: Tool[] = ['woodcutter', 'sawmill', 'quarry', 'house', 'warehouse', 'bridge', 'outpost', 'road'];
const toolName = (t: Tool) => t === 'road' ? 'Weg' : DEFINITIONS[t].name;
el('app').innerHTML = `
  <main id="world" aria-label="Spielwelt"></main>
  <header class="topbar">
    <a class="brand" href="#" id="brand-home" aria-label="Astra · Heimatansicht">${icon('cube')}<span>ASTRA<small>CIVILISATION</small></span><em>ALPHA</em></a>
    <div class="resource-bar" aria-label="Vorräte in Gebäuden">
      ${RESOURCES.map(r => `<div class="resource" title="${NAMES[r]} in Lagern und Betrieben; Baustoffe und Waren unterwegs sind nicht enthalten.">${icon(r)}<div><span>${NAMES[r]}</span><strong id="res-${r}">0</strong></div></div>`).join('')}
      <div class="resource population">${icon('people')}<div><span>Bewohner</span><strong id="population">10 <small>/ 20</small></strong></div></div>
    </div>
    <div class="time-panel"><div class="day">${icon('sun')}<span id="day">Tag 1</span></div><div class="speeds" aria-label="Spielgeschwindigkeit"><button id="pause" class="icon-button" aria-label="Spiel pausieren" title="Pause · Leertaste">${icon('pause')}</button>${[1, 2, 4].map(n => `<button class="speed ${n === 1 ? 'active' : ''}" data-speed="${n}" aria-label="${n}-fache Geschwindigkeit" aria-pressed="${n === 1}">${n}×</button>`).join('')}</div></div>
    <button id="help" class="icon-button top-help" aria-label="Spielhilfe öffnen" title="Spielhilfe">${icon('help')}</button>
  </header>
  <div class="place-label"><span class="live-dot"></span> GRÜNWASSERTAL <span class="divider">/</span> <span>Eine neue Welt</span></div>
  <aside class="mission panel"><div class="eyebrow">DEINE GESCHICHTE <span>01</span></div><h1>Ein neuer Anfang.</h1><p>Aus einem kleinen Lager wird<br>ein Ort, der bleibt.</p><div class="mission-progress"><i id="mission-fill"></i></div><ol id="mission-list"></ol><div id="mission-next"></div></aside>
  <aside id="inspector" class="inspector panel" aria-label="Auswahl und Bauinformationen"></aside>
  <div class="view-controls"><button id="rotate-left" class="icon-button" aria-label="Kamera nach links drehen" title="Drehen · Q">${icon('turn')}</button><span></span><button id="zoom-in" class="icon-button" aria-label="Vergrößern">${icon('plus')}</button><button id="zoom-out" class="icon-button" aria-label="Verkleinern">${icon('minus')}</button><span></span><button id="home" class="icon-button" aria-label="Kamera zum Gründungslager" title="Heimatansicht · H">${icon('compass')}</button></div>
  <section class="minimap panel" aria-label="Übersichtskarte"><div class="minimap-title">${icon('compass')} DEIN TAL <span>N ↑</span></div><canvas id="minimap" width="260" height="240" aria-label="Karte mit Gebäuden, Wald und Fluss. Klicken, um die Kamera zu versetzen."></canvas><div class="map-caption"><span class="live-dot"></span><span id="map-state">Westufer · Gründungslager</span></div></section>
  <div id="placement-hint" class="placement-hint" aria-live="polite"></div>
  <nav class="build-dock panel" aria-label="Bauauswahl"><div class="dock-heading"><span>DEIN DORF WÄCHST</span><span>Wählen & platzieren <kbd>1–8</kbd></span></div><div class="build-tools">${tools.map((t, i) => `<button class="build-tool" data-tool="${t}" aria-label="${toolName(t)} bauen" aria-pressed="false"><kbd>${i + 1}</kbd>${icon(t)}<span>${toolName(t)}</span></button>`).join('')}</div></nav>
  <div class="bottom-right"><div id="event" class="event"></div><div class="utility"><span id="save-status">Lokal gespeichert</span><button id="save" class="icon-button" aria-label="Spiel speichern" title="Spiel speichern">${icon('save')}</button><button id="load" class="icon-button" aria-label="Spielstand laden" title="Spielstand laden">${icon('load')}</button><button id="new-game" class="icon-button" aria-label="Neues Spiel starten" title="Neues Spiel">${icon('reset')}</button></div></div>
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
function updateInspector() {
  const panel = el('inspector');
  const b = selected ? buildingAt(state, selected.x, selected.z) : undefined;
  const t = selected ? tileAt(state, selected.x, selected.z) : undefined;
  const key = tool ? `tool-${tool}` : b ? `building-${b.id}-${b.complete}` : t ? `tile-${t.x}-${t.z}-${t.node}` : `intro-${state.milestones.join(',')}`;
  if (key !== inspectorKey) {
    inspectorKey = key;
    const close = `<button class="icon-button panel-close" id="close-inspector" aria-label="Auswahl schließen">${icon('close')}</button>`;
    if (tool) {
      panel.innerHTML = `${close}<div class="eyebrow">BAUPLAN</div><div class="inspector-icon">${icon(tool)}</div><h2>${toolName(tool)}</h2><p>${tool === 'road' ? 'Kurze Wege, große Wirkung. Bewohner bewegen sich auf Wegen 60 % schneller.' : DEFINITIONS[tool].description}</p><div class="costs">${costs(tool)}</div><div class="tip">${icon('cube')}<span>${tool === 'road' ? 'Klicke auf freie Landfelder. Wege entstehen sofort.' : 'Deine Bewohner liefern die Waren und bauen selbstständig.'}</span></div><details class="coordinate-build"><summary>Feld gezielt wählen</summary><form id="coordinate-form"><label>X<input id="build-x" name="x" type="number" min="0" max="25" value="7" required></label><label>Z<input id="build-z" name="z" type="number" min="0" max="23" value="10" required></label><button type="submit" class="primary">Hier bauen</button></form></details><button class="text-button" id="cancel-tool">Plan schließen <kbd>ESC</kbd></button>`;
      el('cancel-tool').onclick = () => setTool(null);
      el('coordinate-form').onsubmit = e => { e.preventDefault(); buildAt({ x: Number(el<HTMLInputElement>('build-x').value), z: Number(el<HTMLInputElement>('build-z').value) }); };
    } else if (b) {
      panel.innerHTML = `${close}<div class="eyebrow">${b.complete ? 'DEINE SIEDLUNG' : 'BAUSTELLE'} <span>${b.x} / ${b.z}</span></div><div class="inspector-icon">${icon(b.kind)}</div><h2>${DEFINITIONS[b.kind].name}</h2><p>${DEFINITIONS[b.kind].description}</p><div id="building-status" class="building-status"></div><div id="building-details"></div>${!b.complete ? '<button id="cancel-construction" class="text-button danger">Baustelle abbrechen</button>' : DEFINITIONS[b.kind].producer ? '<button id="toggle-production" class="secondary"></button>' : ''}`;
      if (!b.complete) el('cancel-construction').onclick = () => { cancelConstruction(state, b.id); selected = null; world.selected = null; inspectorKey = ''; updateUI(); toast('Baustelle abgebrochen. Material wird zurückgeführt.'); };
      else if (DEFINITIONS[b.kind].producer) el('toggle-production').onclick = () => { b.active = !b.active; updateInspector(); };
    } else if (t?.node) {
      panel.innerHTML = `${close}<div class="eyebrow">ENTDECKT <span>${t.x} / ${t.z}</span></div><div class="inspector-icon">${icon(t.node === 'tree' ? 'woodcutter' : 'stone')}</div><h2>${t.node === 'tree' ? 'Ein Stück Wald' : 'Steinvorkommen'}</h2><p>${t.node === 'tree' ? 'Ein Holzfäller in der Nähe kann diesen Baum abbauen. Danach wird das Feld frei.' : 'Baue einen Steinbruch in der Nähe. Ein Arbeiter trägt den gewonnenen Stein zurück.'}</p><div class="deposit-amount" id="deposit-amount"></div>`;
    } else if (t) {
      panel.innerHTML = `${close}<div class="eyebrow">DEIN TAL <span>${t.x} / ${t.z}</span></div><div class="inspector-icon">${icon(t.kind === 'water' ? 'bridge' : 'compass')}</div><h2>${t.kind === 'water' ? 'Grünwasser' : t.road ? 'Ein guter Weg' : 'Platz für Ideen'}</h2><p>${t.kind === 'water' ? 'Der Fluss trennt die beiden Ufer. Eine Brücke öffnet eurer Siedlung neue Wege.' : t.x >= 15 && !state.milestones.includes('bridge') ? 'Das andere Ufer. Erst eine fertige Brücke macht diesen Ort erreichbar.' : 'Wähle unten ein Gebäude und mache aus diesem Feld einen Teil deiner Siedlung.'}</p>`;
    } else if (state.milestones.length) {
      const next = missions.find(m => !state.milestones.includes(m.kind));
      panel.innerHTML = `<div class="eyebrow">DAS LEBEN IM TAL</div><div class="intro-art">${icon('woodcutter')}${icon('house')}${icon('outpost')}</div><h2>Dein Dorf lebt.</h2><p>Jede Lieferung bringt euch weiter. Klicke auf ein Gebäude, um seinen Betrieb und seine Waren zu sehen.</p><div class="economy-chain"><span>${icon('wood')} Holz</span>${icon('arrow')}<span>${icon('planks')} Bretter</span></div><p>${next ? `Euer nächster Schritt: <strong>${next.title}</strong>.` : 'Euer erstes Kapitel ist geschafft. Jetzt ist Raum für neue Häuser, kurze Wege und eigene Ideen.'}</p><button class="primary" id="continue-building">${next ? `${DEFINITIONS[next.kind].name} planen` : 'Ein Wohnhaus planen'} ${icon('arrow')}</button>`;
      el('continue-building').onclick = () => setTool(next ? next.kind as Tool : 'house');
    } else {
      panel.innerHTML = `<div class="eyebrow">WILLKOMMEN IM TAL</div><div class="intro-art">${icon('woodcutter')}${icon('house')}${icon('woodcutter')}</div><h2>Großes beginnt klein.</h2><p>Zehn Bewohner sind bereit.<br>Du gibst die Richtung vor.</p><div class="intro-step"><b>1</b><span>Plane einen <strong>Holzfäller</strong> in der Nähe des Waldes.</span></div><div class="intro-step"><b>2</b><span>Beobachte, wie deine Bewohner bauen und arbeiten.</span></div><button class="primary" id="start-building">Den Anfang machen ${icon('arrow')}</button><span class="intro-footnote">In deinem Tempo. Ohne Zeitdruck.</span>`;
      el('start-building').onclick = () => setTool('woodcutter');
    }
    if (document.getElementById('close-inspector')) el('close-inspector').onclick = () => { selected = null; world.selected = null; setTool(null); };
  }
  if (b && !tool) {
    el('building-status').innerHTML = `<span class="live-dot ${!b.active || !b.complete ? 'amber' : ''}"></span>${buildingStatus(state, b)}`;
    el('building-details').innerHTML = b.complete ? `<div class="inventory-label">WAREN IM GEBÄUDE</div><div class="inventory">${RESOURCES.map(r => `<span>${icon(r)}<b>${b.inventory[r]}</b></span>`).join('')}</div>${DEFINITIONS[b.kind].producer ? `<p class="worker-label">${icon('people')} ${state.villagers.find(v => v.job === b.id)?.name ?? 'Noch niemand zugeteilt'} · 1 Arbeitsplatz</p>` : ''}` : `<div class="deliveries">${RESOURCES.filter(r => DEFINITIONS[b.kind].cost[r]).map(r => `<div>${icon(r)}<span>${NAMES[r]}</span><b>${b.delivered[r]} <small>/ ${DEFINITIONS[b.kind].cost[r]}</small></b></div>`).join('')}</div><div class="construction-meter"><i style="width:${b.progress * 100}%"></i></div><span class="progress-label">Aufbau ${Math.floor(b.progress * 100)} % · nach allen Lieferungen</span>`;
    if (DEFINITIONS[b.kind].producer && b.complete) el('toggle-production').textContent = b.active ? 'Betrieb pausieren' : 'Betrieb fortsetzen';
  }
  if (t?.node && !b && !tool) el('deposit-amount').textContent = `${t.amount} ${t.node === 'tree' ? 'Holz' : 'Stein'} verfügbar`;
}
const missions: { kind: BuildingKind; title: string; sub: string }[] = [
  { kind: 'woodcutter', title: 'Die erste Hütte', sub: 'Baue einen Holzfäller' },
  { kind: 'sawmill', title: 'Aus Holz wird Zukunft', sub: 'Errichte ein Sägewerk' },
  { kind: 'quarry', title: 'Ein festes Fundament', sub: 'Erschließe ein Steinvorkommen' },
  { kind: 'bridge', title: 'Zum anderen Ufer', sub: 'Baue eine Brücke über den Fluss' },
  { kind: 'outpost', title: 'Neue Horizonte', sub: 'Gründe einen Außenposten im Osten' },
];
function updateMissions() {
  const key = state.milestones.join(',');
  if (key === missionKey && el('mission-list').children.length) return;
  missionKey = key;
  const current = missions.findIndex(m => !state.milestones.includes(m.kind));
  el('mission-list').innerHTML = missions.map((m, i) => { const done = state.milestones.includes(m.kind); return `<li class="${done ? 'done' : i === current ? 'current' : ''}"><span class="step-circle">${done ? icon('check') : String(i + 1).padStart(2, '0')}</span><div><strong>${m.title}</strong><span>${m.sub}</span></div></li>`; }).join('');
  el('mission-fill').style.width = `${missions.filter(m => state.milestones.includes(m.kind)).length / missions.length * 100}%`;
  el('mission-next').innerHTML = current < 0 ? `<div class="chapter-done">${icon('check')} Kapitel abgeschlossen</div>` : `<button class="text-button" id="next-mission">${DEFINITIONS[missions[current].kind].name} planen ${icon('arrow')}</button>`;
  if (current >= 0) el('next-mission').onclick = () => setTool(missions[current].kind as Tool);
}
function drawMinimap() {
  const canvas = el<HTMLCanvasElement>('minimap'), ctx = canvas.getContext('2d')!;
  for (const t of state.tiles) { ctx.fillStyle = t.kind === 'water' ? '#7ebabc' : t.node === 'tree' ? '#4f7950' : t.node === 'rock' ? '#a1a698' : t.road ? '#d3bf90' : '#9cb47b'; ctx.fillRect(t.x * 10, t.z * 10, 10, 10); }
  for (const b of state.buildings) { ctx.fillStyle = b.complete ? '#f5e3ac' : '#b36c46'; ctx.fillRect(b.x * 10, b.z * 10, b.kind === 'bridge' ? 20 : 10, 10); }
  ctx.fillStyle = '#fff9db'; for (const v of state.villagers) ctx.fillRect(v.x * 10 + 3, v.z * 10 + 3, 3, 3);
  el('map-state').textContent = state.milestones.includes('bridge') ? 'Zwei Ufer · eine Siedlung' : 'Westufer · Gründungslager';
}
function updateUI() {
  const stocks = stock(state); for (const r of RESOURCES) el(`res-${r}`).textContent = stocks[r].toString();
  el('population').innerHTML = `${state.villagers.length} <small>/ 20</small>`;
  el('day').textContent = `Tag ${Math.floor(state.time / 120) + 1}`;
  updateMissions(); updateInspector(); drawMinimap();
  if (state.events[0]?.message !== lastEvent) { lastEvent = state.events[0]?.message; el('event').textContent = lastEvent; }
  if (state.won && !wonShown) { wonShown = true; showVictory(); }
}
function save(manual = false) {
  try { localStorage.setItem(SAVE_KEY, serialize(state)); el('save-status').textContent = `Gespeichert · ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`; if (manual) toast('Dein Tal wurde auf diesem Gerät gespeichert.'); }
  catch { el('save-status').textContent = 'Speichern nicht möglich'; if (manual) toast('Der Browser konnte den Spielstand nicht speichern. Prüfe den verfügbaren lokalen Speicher.'); }
}
function replaceState(next: GameState) {
  state = next; selected = null; tool = null; world.selected = null; world.revision = -1; world.hover(null, null); inspectorKey = ''; missionKey = '__refresh__'; wonShown = next.won; setTool(null); world.resetCamera(); updateUI();
}
let dialogSpeed = 1;
function openDialog(html: string) {
  const d = el<HTMLDialogElement>('dialog');
  dialogSpeed = speed; setSpeed(0); world.keys.clear(); d.innerHTML = html; d.showModal();
  d.onclose = () => setSpeed(dialogSpeed);
  d.querySelectorAll<HTMLElement>('[data-close]').forEach(b => b.onclick = () => d.close());
}
function showHelp() {
  openDialog(`<div class="eyebrow">DEIN KLEINER REISEFÜHRER</div><h2>Ein Tal voller Möglichkeiten.</h2><p>Plane Betriebe und beobachte, wie deine Bewohner daraus eine Siedlung machen.</p><div class="help-grid"><div><h3>So wächst dein Dorf</h3><p>Holzfäller gewinnen Holz. Das Sägewerk macht aus <b>1 Holz → 2 Bretter</b>. Ein Steinbruch versorgt deine Baustellen mit Stein. Baue Betriebe nah an Rohstoffen und Lagern.</p><p>Ein Arbeiter pro Betrieb wird automatisch zugeteilt. Die anderen tragen bis zu zwei Waren gleichzeitig. Baustellen bekommen zuerst Material.</p><p>Für die Brücke brauchst du <b>12 Bretter und 6 Stein</b>. Plane anschließend am Ostufer einen Außenposten. Wohnhäuser bringen jeweils zwei neue Bewohner.</p></div><div><h3>Die Welt in deiner Hand</h3><dl><dt>Auswählen / bauen</dt><dd>Linksklick</dd><dt>Kamera drehen</dt><dd>Rechtsziehen · Q / E</dd><dt>Kamera bewegen</dt><dd>WASD / Pfeile<br>Shift + Rechtsziehen</dd><dt>Vergrößern</dt><dd>Mausrad</dd><dt>Heimatansicht</dt><dd>H</dd><dt>Bauauswahl</dt><dd>1–8</dd><dt>Plan schließen</dt><dd>Escape</dd><dt>Pause / weiter</dt><dd>Leertaste</dd></dl></div></div><div class="help-note">Waren unterwegs und angelieferte Baustoffe zählen nicht zu den Vorräten oben. Wege sind kostenlos und machen Transporte schneller. Der Fortschritt wird alle 20 Sekunden lokal gespeichert.</div><button class="primary" data-close>Zurück ins Tal ${icon('arrow')}</button>`);
}
function showVictory() {
  openDialog(`<div class="victory-symbol">${icon('outpost')}</div><div class="eyebrow">KAPITEL 01 · ABGESCHLOSSEN</div><h2>Aus einem Anfang<br>wird eine Zukunft.</h2><p>Der Fluss verbindet euch jetzt. Euer neuer Außenposten ist fertig, und das Grünwassertal ist ein Stück mehr Zuhause.</p><div class="victory-stats"><span><b>${state.villagers.length}</b>Bewohner</span><span><b>${state.buildings.filter(b => b.complete).length}</b>Bauwerke</span><span><b>${Math.floor(state.time / 120) + 1}</b>Tage</span></div><button class="primary" data-close>Unser Tal wächst weiter ${icon('arrow')}</button>`);
  save();
}
try { world = new World(el('world'), () => state); }
catch (error) { el('world').innerHTML = `<div class="webgl-error"><h1>Die 3D-Welt konnte nicht starten.</h1><p>Bitte öffne das Spiel in einem Browser mit aktiviertem WebGL2 und Hardwarebeschleunigung.</p><code>${escape(String(error))}</code></div>`; throw error; }
world.onClick = p => { if (tool) buildAt(p); else { selected = p; world.selected = p; inspectorKey = ''; updateInspector(); } };
world.onHover = p => { hovered = p; world.hover(p, tool); updateHint(); };
document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => b.onclick = () => setTool(tool === b.dataset.tool ? null : b.dataset.tool as Tool));
document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(b => b.onclick = () => setSpeed(Number(b.dataset.speed)));
el('pause').onclick = () => setSpeed(speed ? 0 : lastSpeed);
el('help').onclick = showHelp;
el('home').onclick = () => world.resetCamera();
el('brand-home').onclick = e => { e.preventDefault(); world.resetCamera(); };
el('rotate-left').onclick = () => world.rotate(Math.PI / 4);
el('zoom-in').onclick = () => world.zoom(1.2); el('zoom-out').onclick = () => world.zoom(1 / 1.2);
el('save').onclick = () => save(true);
el('load').onclick = () => {
  let loaded: GameState;
  try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) { toast('Noch kein gespeichertes Tal vorhanden.'); return; } loaded = deserialize(raw); }
  catch { toast('Dieser Spielstand konnte nicht gelesen werden. Dein aktuelles Tal bleibt erhalten.'); return; }
  openDialog(`<div class="eyebrow">ZURÜCK ZUM LETZTEN SPIELSTAND</div><h2>Dein gespeichertes Tal laden?</h2><p>Änderungen seit dem letzten Speichern werden verworfen.</p><div class="dialog-actions"><button class="secondary" data-close>Weiterspielen</button><button class="primary" id="confirm-load">Spielstand laden</button></div>`);
  el('confirm-load').onclick = () => { replaceState(loaded); el<HTMLDialogElement>('dialog').close(); toast('Dein gespeichertes Tal ist wieder da.'); };
};
el('new-game').onclick = () => {
  openDialog(`<div class="eyebrow">EIN NEUER ANFANG</div><h2>Noch einmal aufbrechen?</h2><p>Dein aktuelles Tal und der lokale Spielstand werden durch eine neue Siedlung ersetzt.</p><div class="dialog-actions"><button class="secondary" data-close>Im Tal bleiben</button><button class="primary" id="confirm-new">Neues Tal gründen</button></div>`);
  el('confirm-new').onclick = () => { replaceState(createGame()); save(); dialogSpeed = 1; el<HTMLDialogElement>('dialog').close(); toast('Ein neues Tal. Zehn Menschen. Alles ist möglich.'); };
};
el('minimap').onclick = e => { const r = el('minimap').getBoundingClientRect(); world.focus({ x: Math.min(WIDTH - 1, Math.floor((e.clientX - r.left) / r.width * WIDTH)), z: Math.min(HEIGHT - 1, Math.floor((e.clientY - r.top) / r.height * HEIGHT)) }); };
window.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); if (!e.repeat) setSpeed(speed ? 0 : lastSpeed); }
  if (e.key === 'Escape') setTool(null);
  if (e.key.toLowerCase() === 'h') world.resetCamera();
  if (Number(e.key) >= 1 && Number(e.key) <= 8) setTool(tools[Number(e.key) - 1]);
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
