'use strict';
const assert=require('node:assert/strict');
const A=require('../src/field-atlas.js');
const tiles=Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>
 x===0||y===0||x===11||y===11?4:1
));
for(let y=1;y<11;y++)tiles[y][5]=4;
tiles[8][5]=1;tiles[6][9]=3;
const from={x:2,y:3},to={x:8,y:3};
const path=A.path(tiles,from,to);
assert.equal(path[0].x,from.x);assert.equal(path.at(-1).x,to.x);
assert(path.length>7,'A genuine detour avoids the cliff wall');
assert(path.some(p=>p.x===5&&p.y===8),'Navigation passes through the only open gate');
for(const p of path)assert(A.accessible(tiles[p.y][p.x]),'No step enters an obstacle');
assert.equal(A.direction([{x:1,y:1},{x:1,y:0}]),'↑');
assert.equal(A.direction([{x:1,y:1},{x:2,y:1}]),'→');
assert.equal(A.direction([{x:1,y:1},{x:0,y:1}]),'←');
assert.equal(A.direction([{x:1,y:1},{x:1,y:2}]),'↓');
assert.equal(A.direction([{x:1,y:1}]),'');
assert.deepEqual(A.path(tiles,{x:5,y:1},to),[],'Blocked starting position cannot forge a path');
assert.equal(A.path([],from,to).length,0);
assert.equal(A.nearest(tiles,6,6).x,6);
const near=A.nearest(tiles,5,2);
assert(near&&A.accessible(tiles[near.y][near.x]));
assert.deepEqual(A.path(tiles,from,{x:5,y:2}).at(-1),near,'Blocked destination approaches a walkable neighbor');
const base={map:'village',x:10,y:10,events:{},visited:{village:true}};
assert.equal(A.markers('village',base).some(m=>m.id==='workshop'),false);
const claimed={...base,events:{fieldRequests:{flower:{claimed:true},forest:{claimed:true}}}};
assert.equal(A.markers('village',claimed).some(m=>m.id==='workshop'),true);
assert.equal(A.markers('shrine',{...base,badge:false}).some(m=>m.id==='highland'),false);
assert.equal(A.markers('shrine',{...base,badge:true}).some(m=>m.id==='highland'),true);
assert.equal(A.markers('workshop',base).some(m=>m.id==='archive'),false);
assert.equal(A.markers('workshop',{...base,events:{townLegacy:{claimed:true}}}).some(m=>m.id==='archive'),true);
assert.deepEqual(A.locate(base,'workshop'),null,'Locked POIs cannot be selected');
const waypoint=A.locate(base,'north');
assert.deepEqual(waypoint,{map:'village',id:'north'});
assert.equal(A.selected(base,tiles),null);
const focused={...base,map:'route',x:3,y:3,events:{atlasWaypoint:{map:'route',id:'flowers'}}};
const routeTiles=Array.from({length:26},()=>Array.from({length:24},()=>1));
const nav=A.selected(focused,routeTiles);
assert.equal(nav.marker.name,'花の回り道');
assert.equal(nav.remaining,Math.abs(6-3)+Math.abs(8-3));
assert.equal(A.selected({...focused,map:'forest'},routeTiles),null,'Other map targets are not overlaid');
const oldSave={map:'route',x:3,y:3,events:{},visited:{}};
assert.equal(A.selected(oldSave,routeTiles),null,'Old saves do not require a waypoint');
const entries=[],ctx={
 beginPath(){entries.push('begin')},closePath(){},
 arc(){entries.push('arc')},fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));entries.push('rect')},
 roundRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));entries.push('round')},
 fillText(t){entries.push('text:'+t)},fill(){entries.push('fill')},stroke(){entries.push('stroke')},
 save(){entries.push('save')},restore(){entries.push('restore')},font:'',fillStyle:'',strokeStyle:'',lineWidth:0,textAlign:''
};
assert(A.draw(ctx,routeTiles,'route',focused,50)>1);
assert(entries.some(x=>x.includes('目的地')),'Map shows the selected destination');
entries.length=0;
assert.equal(A.drawCompass(ctx,focused,routeTiles,4),true);
assert(entries.some(x=>x.includes('あと')),'Compass gives actual BFS step count');
assert.equal(A.draw(null,routeTiles,'route',focused),0);
assert.equal(A.drawCompass(ctx,oldSave,routeTiles),false);
assert.equal(A.drawCompass(null,focused,routeTiles),false);
const before=JSON.stringify(routeTiles);
A.path(routeTiles,{x:3,y:3},{x:19,y:21});
assert.equal(JSON.stringify(routeTiles),before,'Atlas is strictly read-only to collision data');
console.log('PASS: region atlas, BFS obstacle navigation, old-save compatibility, locked markers and canvas compass');
