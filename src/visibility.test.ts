import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, explore, goods, serialize, step, tileAt, type GameState } from './sim.ts';
import { generateChunk, regionId } from './generator.ts';
import { VISIBILITY_RADIUS, VISIBILITY_FEATHER_TILES, constrainView, inViewRadius, visibleTiles } from './visibility.ts';

test('visibility is a 30-tile circle including its boundary', () => {
  const focus={x:-14,z:17}; assert.equal(VISIBILITY_RADIUS,30);
  assert.ok(inViewRadius({x:16,z:17},focus)); assert.ok(inViewRadius({x:-32,z:41},focus));
  assert.equal(inViewRadius({x:17,z:17},focus),false);
  assert.equal(inViewRadius({x:16,z:47},focus),false);
});

function assertFilledCircle(s: GameState, view: ReturnType<typeof constrainView>) {
  // Probe continuous positions, including the perimeter between tile centers.
  for (let angle=0; angle<360; angle+=.5) for (const fraction of [0,.25,.5,.75,1]) {
    const r=(view.radius-1e-7)*fraction, radians=angle*Math.PI/180;
    const x=Math.round(view.focus.x+Math.cos(radians)*r), z=Math.round(view.focus.z+Math.sin(radians)*r);
    assert.ok(tileAt(s,x,z)?.discovered, `Empty circle at ${x}/${z}`);
  }
}

function regionFixture(missing?: [number,number]) {
  const s=createGame(42); s.regions=[]; s.tiles=[];
  for(let z=-2;z<=2;z++) for(let x=-2;x<=2;x++) {
    if(missing && x===missing[0] && z===missing[1]) continue;
    const id=regionId(x,z); s.regions.push(id); s.tiles.push(...generateChunk(s.seed,id));
  }
  return s;
}

test('three extra terrain fields extend the view without shrinking the fully visible core', () => {
  const s=regionFixture(), view=constrainView(s,{x:12,z:12});
  assert.equal(view.radius,30);
  const core=visibleTiles(s,view.focus,view.radius);
  const extended=visibleTiles(s,view.focus,view.radius+VISIBILITY_FEATHER_TILES);
  const positions=new Set(extended.map(t=>`${t.x},${t.z}`));
  assert.ok(core.every(t=>positions.has(`${t.x},${t.z}`)));
  assert.ok(extended.length>core.length);
  assert.ok(positions.has('45,12')); // 30 + 3 fields from the focus.
  assert.ok(!positions.has('46,12'));
  assert.deepEqual(constrainView(s,view.focus),view);
});

test('camera focus keeps the full circle inside every map edge and corner', () => {
  const s=regionFixture(), before=serialize(s);
  for(const x of [-1000,0,1000]) for(const z of [-1000,0,1000]) {
    const view=constrainView(s,{x,z}); assert.equal(view.radius,30);
    assert.ok(view.focus.x>=-22 && view.focus.x<=47);
    assert.ok(view.focus.z>=-18 && view.focus.z<=41);
    assertFilledCircle(s,view);
  }
  assert.deepEqual(constrainView(s,{x:12.2,z:11.8}).focus,{x:12,z:12});
  assert.equal(serialize(s),before);
});

test('camera avoids undiscovered notches and holes inside the world bounds', () => {
  for(const missing of [[2,0],[0,0]] as [number,number][]) {
    const s=regionFixture(missing);
    for(const requested of [{x:65,z:12},{x:12,z:12},{x:25,z:24},{x:-20,z:-20}]) {
      const view=constrainView(s,requested); assertFilledCircle(s,view);
      assert.ok(view.radius>0 && view.radius<=30);
    }
  }
});

test('small worlds use a filled smaller circle and expansion refreshes camera limits', () => {
  const s=createGame(42), before=serialize(s), small=constrainView(s,{x:1000,z:-1000});
  assert.equal(small.radius,11.5); assertFilledCircle(s,small);
  assert.equal(serialize(s),before);
  s.level=5; s.buildings[0].inventory=goods(1000,1000,1000,1000,1000);
  for(const [x,z] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) assert.ok(explore(s,regionId(x,z)).ok);
  const expanded=constrainView(s,{x:1000,z:-1000});
  assert.equal(expanded.radius,30); assertFilledCircle(s,expanded);
});

test('camera visibility crosses region borders, stays bounded and does not change the world', () => {
  const s=createGame(42);s.level=5;s.buildings[0].inventory=goods(1000,1000,1000,1000,1000);
  for(const [x,z] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) assert.ok(explore(s,regionId(x,z)).ok);
  const before=serialize(s), center={x:12,z:12}, visible=visibleTiles(s,center);
  assert.equal(visible.length,2821); assert.ok(visible.length<s.tiles.length);
  assert.ok(new Set(visible.map(t=>t.region)).size>1);
  const moved={x:-20,z:10}; assert.deepEqual(visibleTiles(s,moved),s.tiles.filter(t=>t.discovered && inViewRadius(t,moved)).sort((a,b)=>a.z-b.z || a.x-b.x));
  assert.deepEqual(visibleTiles(s,{x:1000,z:1000}),[]);assert.equal(serialize(s),before);
  step(s,.1); assert.ok(s.time>0); assert.equal(s.tiles.length,9*624);
});
