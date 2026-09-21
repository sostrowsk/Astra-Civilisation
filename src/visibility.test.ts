import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, explore, goods, serialize, step } from './sim.ts';
import { regionId } from './generator.ts';
import { VISIBILITY_RADIUS, inViewRadius, visibleTiles } from './visibility.ts';

test('visibility is a 30-tile circle including its boundary', () => {
  const focus={x:-14,z:17}; assert.equal(VISIBILITY_RADIUS,30);
  assert.ok(inViewRadius({x:16,z:17},focus)); assert.ok(inViewRadius({x:-32,z:41},focus));
  assert.equal(inViewRadius({x:17,z:17},focus),false);
  assert.equal(inViewRadius({x:16,z:47},focus),false);
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
