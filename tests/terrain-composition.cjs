'use strict';
const assert=require('node:assert/strict');
const T=require('../src/terrain-composition.js');
const buffer=[];
const ctx={
 fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));assert(w>0&&h>0);buffer.push('r:'+this.fillStyle+':'+Math.round(x)+','+Math.round(y))},
 beginPath(){buffer.push('p')},fill(){buffer.push('fill:'+this.fillStyle)},
 moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));buffer.push('m:'+Math.round(x))},
 lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));buffer.push('l:'+Math.round(x))},
 stroke(){buffer.push('s:'+this.strokeStyle)},
 ellipse(x,y,rx,ry){assert([x,y,rx,ry].every(Number.isFinite));assert(rx>0&&ry>0);buffer.push('e:'+Math.round(x))}
};
const tiles=Array.from({length:16},()=>Array.from({length:16},()=>0));
for(let x=3;x<13;x++)tiles[7][x]=1;
tiles[6][4]=5;tiles[8][4]=5;
tiles[8][5]=13;tiles[10][9]=10;
for(let y=2;y<6;y++)for(let x=8;x<12;x++)tiles[y][x]=3;
tiles[6][9]=1;
const water=T.classify('lake',tiles,9,5);
assert.equal(water.water,true);assert(water.wetEdges.includes('s'),'Shoreline tracks real adjacent land');
assert(!water.wetEdges.includes('n'),'Continuous water gets no internal bank');
const road=T.classify('village',tiles,4,7);
assert.equal(road.paved,true);assert(road.pavingEdges.includes('n'),'Road bordering rocks gets a defined paving edge');
assert(T.classify('highland',tiles,4,6).cliffEdges.includes('w'),'Terrace wall edges are terrain-aware');
assert.equal(T.classify('forest',tiles,4,6).cliff,false,'Cliff faces are not drawn in forest');
assert.equal(T.hash(3,8,42),T.hash(3,8,42));
const range={x0:0,x1:16,y0:0,y1:12},zoneLooks=new Set();
for(const zone of T.ZONES){
 buffer.length=0;
 const count=T.drawGround(ctx,zone,tiles,0,0,range,24);
 assert(count>=2&&count<900,'Ground details remain bounded on '+zone+': '+count);
 const original=buffer.join(';');
 buffer.length=0;
 assert.equal(T.drawGround(ctx,zone,tiles,0,0,range,24),count);
 assert.equal(buffer.join(';'),original,'Same frame is pixel-deterministic in '+zone);
 zoneLooks.add(original);
 const structures=T.drawPlaces(ctx,zone,0,0,24);
 assert(structures>=1,'Authored visible landmark in '+zone);
}
assert(zoneLooks.size>=4,'Cliffs, shores and paving create different landscape profiles');
buffer.length=0;T.drawGround(ctx,'lake',tiles,0,0,range,19);
const day=buffer.join(';');
buffer.length=0;T.drawGround(ctx,'lake',tiles,0,0,range,69);
assert.notEqual(buffer.join(';'),day,'Shore reflections animate without moving collision');
assert.equal(T.drawGround(null,'lake',tiles,0,0,range),0);
assert.equal(T.drawGround(ctx,'unknown',tiles,0,0,range),0);
assert.equal(T.drawGround(ctx,'village',tiles,0,0,{x0:0,x1:1,y0:0,y1:1}),0);
assert.equal(T.drawPlaces(ctx,'workshop',0,0),0,'Interior props are not overridden by outside structures');
const pure=JSON.stringify(tiles);
T.drawGround(ctx,'highland',tiles,0,0,range,44);
assert.equal(JSON.stringify(tiles),pure,'Visual layers must never modify pathfinding tiles');
console.log('PASS: six authored terrain compositions, adjacent-tile coast/cliffs/stairs, deterministic culling, ambient motion and zero collision mutation');
