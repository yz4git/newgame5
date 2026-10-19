'use strict';
const assert=require('node:assert/strict'), E=require('../src/exploration-journal.js');
assert.equal(E.REGIONS.length,4);
const all=E.summary(null);
assert.equal(all.length,4);assert(all.every(x=>!x.visited&&x.done===0));
const full={visited:{forest:true,lake:true,shrine:true,highland:true},
 events:{forestSecrets:{sequence:3,gateOpen:true,bloomClaimed:true},
 regionPuzzles:{lake:{lowered:true,cacheTaken:true},shrine:{progress:3,open:true,cacheTaken:true},
 highland:{angles:[1,0,3],solved:true}}},
 collected:{'forest/蔦の奥の忘れ物':true}
};
const rows=E.summary(full);
assert(rows.every(x=>x.complete),rows.map(x=>x.id+':'+x.done).join(','));
assert.equal(rows.reduce((a,r)=>a+r.total,0),15,'Every optional clue and reward is counted');
const emptyHints=E.hint('lake',{},2);
assert.match(emptyHints,/まだ訪れていない/,'Unknown map does not spoil locations');
assert.notEqual(E.hint('lake',full,0),E.hint('lake',full,1));
assert.match(E.hint('lake',full,2),/10,14/,'Specific coordinates appear only when requested');
assert.doesNotMatch(E.hint('lake',full,0),/\(10,14\)|10,14/);
assert.match(E.hint('shrine',full,2),/月/);
assert.equal(E.hint('missing',full,0),null);
const partial={visited:{highland:true,shrine:true},events:{regionPuzzles:{highland:{angles:[1,2,3]},shrine:{progress:1}}}};
assert.equal(E.progress('highland',partial).done,2);
assert.equal(E.progress('shrine',partial).done,1);
assert.equal(E.progress('lake',partial).status,'未訪問');
assert.equal(E.progress('forest',full).done,5);
// Reconstruct the illustrated atlas from old saves; no new save keys are required.
for(const row of E.summary(full)){
 const found=E.milestones(row.id,full);
 assert.equal(found.length,row.total,'Each atlas checkpoint mirrors the progress model: '+row.id);
 assert(found.every(m=>m.done),'All checkpoints unlock after completion: '+row.id);
 assert.match(E.nextLead(row.id,full),/完成/);
}
assert.equal(E.milestones('missing',full),null);
assert.equal(E.nextLead('missing',full),null);
assert.equal(E.milestones('lake',{}).filter(m=>m.done).length,0);
assert.match(E.nextLead('lake',{}),/訪れると/);
const halfLake={visited:{lake:true},events:{regionPuzzles:{lake:{lowered:true,cacheTaken:false}}}};
assert.deepEqual(E.milestones('lake',halfLake).map(m=>m.done),[true,false]);
assert.match(E.nextLead('lake',halfLake),/景色が変わった/);
assert.doesNotMatch(E.nextLead('lake',halfLake),/\d+,\d+/,'Gentle leads never leak answer coordinates');
assert.doesNotMatch(E.nextLead('lake',{visited:{lake:true}}),/10,14/);
const halfForest={visited:{forest:true},events:{forestSecrets:{sequence:3}}};
assert.equal(E.milestones('forest',halfForest).filter(m=>m.done).length,3);
assert.match(E.nextLead('forest',halfForest),/変化した森/);
const halfShrine={visited:{shrine:true},events:{regionPuzzles:{shrine:{progress:2}}}};
assert.equal(E.milestones('shrine',halfShrine).filter(m=>m.done).length,2);
const halfHighland={visited:{highland:true},events:{regionPuzzles:{highland:{angles:[1,2,3]}}}};
assert.equal(E.milestones('highland',halfHighland).filter(m=>m.done).length,2);
const npcs=[{x:3,y:3,name:'謎の石',kind:'secretRune'},{x:7,y:7,name:'旅人',kind:'talk'},{x:4,y:2,name:'閉じた祭壇',kind:'regionalPuzzle'}];
assert.deepEqual(E.nearby('forest',3,2,npcs),{x:3,y:3,name:'謎の石',distance:1,direct:true});
assert.equal(E.nearby('forest',10,11,npcs),null);
assert.equal(E.nearby('forest',3,2,npcs,n=>n.kind!=='secretRune')?.name,'閉じた祭壇');
assert.equal(E.nearby('forest',3,3,npcs,n=>false),null,'Invisible secrets never appear as field interaction indicators');
console.log('PASS: four-region illustrated exploration atlas, checkpoints, safe leads, optional clues and nearby prompts');
