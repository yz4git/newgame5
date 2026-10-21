'use strict';
const assert=require('node:assert/strict');
const Field=require('../src/field-sprites.js');
const output=[];
const canvas={
 save(){output.push('save')},restore(){output.push('restore')},
 beginPath(){output.push('path')},ellipse(x,y,rx,ry){assert(rx>0&&ry>0);output.push('ellipse '+[x,y,rx,ry].join(','))},
 fill(){output.push('fill '+this.fillStyle)},
 fillRect(x,y,w,h){assert(w>0&&h>0);output.push([x,y,w,h,this.fillStyle].join('|'))}
};
assert.equal(Field.DIRECTIONS.length,4);
assert.equal(Field.PHASES.length,8);
assert(Object.keys(Field.TYPES).length>=10);
for(const kind of Object.keys(Field.TYPES)){
 for(const direction of Field.DIRECTIONS){
  const frames=new Set();
  for(let frame=0;frame<8;frame++){
   output.length=0;
   const result=Field.draw(canvas,188,177,direction,frame,kind,null,false);
   assert.equal(result.dir,direction);
   assert.equal(result.kind,kind);
   assert(output.length>16,kind+' sprite has multiple layers');
   frames.add(output.join(';'));
  }
  assert(frames.size>=4,kind+' '+direction+' has multiple authored key poses');
 }
}
output.length=0;Field.draw(canvas,188,177,'down',1,'hero',null,false);const walk=output.join(';');
output.length=0;Field.draw(canvas,188,177,'down',1,'hero',null,true);
assert.notEqual(walk,output.join(';'),'Running uses a different gait');
const orientations=[];
for(const dir of Field.DIRECTIONS){output.length=0;Field.draw(canvas,188,177,dir,1,'hero');orientations.push(output.join(';'))}
assert.equal(new Set(orientations).size,4,'Front, back, left and right art must differ');
assert.equal(Field.draw(null,0,0),false);
// Key event NPCs now have original profession-specific coats, hats and equipment.
const professions=['hero','trainer','rival','townArchivist','workshop','heal','shop','prof','boss'];
const illustrations=professions.map(kind=>{
 output.length=0;
 const sprite=Field.draw(canvas,188,177,'down',1,kind);
 assert.equal(sprite.kind,kind);
 return output.join(';');
});
assert.equal(new Set(illustrations).size,professions.length,'Lead, rivals and specialist NPCs need distinct drawn outfits');
assert(Field.TYPES.townArchivist&&Field.TYPES.workshop&&Field.TYPES.rival,'New role palettes shipped');
console.log('PASS: 4 directions, 8-frame sprite cycles, profession silhouettes, running and distinct character clothing');
