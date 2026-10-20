/* Optional field request compatibility and single-claim contract. */
'use strict';
const assert=require('node:assert/strict');
const F=require('../src/field-requests.js');
assert.equal(F.REQUESTS.length,4);
const old={story:{stage:12},visited:{village:true,forest:true,lake:true,highland:true},events:{}};
assert(F.summary(old).every(r=>r.status==='available'));
assert.deepEqual(Object.keys(F.states(null)).sort(),F.REQUESTS.map(r=>r.id).sort());
assert.equal(F.entry('missing',old),null);
assert.equal(F.claim('missing',old,'supply').ok,false);
assert.equal(F.claim('lake',old,'coins').ok,false,'Cannot claim before acceptance');
assert.equal(F.accept('missing',old).ok,false);
for(const r of F.REQUESTS){
 const early={story:{stage:10},visited:{[r.map]:true},events:{}};
 assert.equal(F.entry(r.id,early).status,'locked');
 assert.equal(F.accept(r.id,early).ok,false);
 const undiscovered={story:{stage:12},visited:{},events:{}};
 assert.equal(F.entry(r.id,undiscovered).status,'unvisited');
 assert.equal(F.accept(r.id,undiscovered).ok,false);
 const accepted=F.accept(r.id,old);
 assert(accepted.ok);
 const begin={...old,events:{fieldRequests:accepted.progress}};
 assert.equal(F.entry(r.id,begin).status,'active');
 assert.equal(F.claim(r.id,begin,'coins').ok,false,'No reward before discovery');
 const loaded=JSON.parse(JSON.stringify(begin));
 assert.equal(F.entry(r.id,loaded).status,'active','Acceptance survives JSON serialization');
 assert.equal(F.accept(r.id,begin).ok,true,'Accepting twice is safe');
}
const discoveries={
 flower:{forestSecrets:{bloomClaimed:true}},
 forest:{forestSecrets:{gateOpen:true}},
 lake:{regionPuzzles:{lake:{lowered:true,cacheTaken:true}}},
 highland:{regionPuzzles:{highland:{solved:true}}}
};
for(const r of F.REQUESTS){
 for(const ch of r.choices){
  const accepted=F.accept(r.id,old).progress;
  const save={...old,events:{...discoveries[r.id],fieldRequests:accepted}};
  assert.equal(F.entry(r.id,save).status,'ready',r.id);
  assert.equal(F.claim(r.id,save,'bad-choice').ok,false);
  const result=F.claim(r.id,save,ch.id);
  assert(result.ok,'Claim valid '+r.id+' '+ch.id);
  assert.match(result.text,/お礼に/);
  if(ch.money)assert.equal(result.reward.money,ch.money);
  else {assert.equal(result.reward.item,ch.item);assert.equal(result.reward.count,ch.count)}
  const claimed={...save,events:{...save.events,fieldRequests:result.progress}};
  assert.equal(F.entry(r.id,claimed).status,'complete');
  assert(F.afterText(r.id,claimed));
  assert.equal(F.claim(r.id,claimed,ch.id).ok,false,'No duplicate reward '+r.id);
  assert.equal(F.claim(r.id,JSON.parse(JSON.stringify(claimed)),ch.id).ok,false,'Save reload does not reissue '+r.id);
 }
}
const lakePartial={...old,events:{regionPuzzles:{lake:{lowered:true,cacheTaken:false}},
 fieldRequests:F.accept('lake',old).progress}};
assert.equal(F.entry('lake',lakePartial).status,'active','Opening gate is insufficient for lake report');
lakePartial.events.regionPuzzles.lake.cacheTaken=true;
assert.equal(F.entry('lake',lakePartial).status,'ready');
assert(F.entry('flower',old).intro.includes('夕暮れ'));
console.log('PASS: four NPC research requests, all branch rewards, old saves, chapter locks, progress and exactly-once claims');
