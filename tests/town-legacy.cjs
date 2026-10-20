'use strict';
const assert=require('node:assert/strict'), T=require('../src/town-legacy.js');
const base={story:{stage:12},visited:{village:true},events:{}};
assert.equal(T.REPORTS.length,4);
assert.equal(T.snapshot(base).tier,0);
assert.equal(T.snapshot(base).status,'hidden');
assert.equal(T.snapshot({story:{stage:3},events:{fieldRequests:{flower:{claimed:true},forest:{claimed:true}}}}).tier,0);
assert.equal(T.snapshot({story:{stage:3},events:{fieldRequests:{flower:{claimed:true},forest:{claimed:true}}}}).visible,false);
assert.equal(T.accept(base).ok,false,'Archivist project must not start before two reports');
assert.equal(T.complete(base).ok,false);
assert.equal(T.citizenText('traveler',base),null);
for(let count=0;count<=4;count++){
 const fieldRequests=Object.fromEntries(T.REPORTS.slice(0,count).map(id=>[id,{accepted:true,claimed:true,choice:'supply'}]));
 const progress={...base,events:{fieldRequests}};
 const s=T.snapshot(progress);
 assert.equal(s.count,count);
 assert.equal(s.tier,count);
 assert.equal(s.visible,count>=2);
 assert.equal(s.status,count>=2?'available':'hidden');
 assert.equal(T.accept(progress).ok,count>=2);
 assert.equal(T.complete(progress).ok,false,'Cannot skip the archivist acceptance');
 if(count>=2){
  const accepted=T.accept(progress);
  const next={...progress,events:{...progress.events,townLegacy:accepted.progress}};
  assert.equal(T.snapshot(next).status,count===4?'ready':'active');
  assert.equal(T.accept(next).ok,false);
  assert.equal(T.complete(next).ok,count===4);
  if(count===4){
   const claimed=T.complete(next);
   assert.equal(claimed.reward.item,'guardCharm');
   assert.equal(claimed.reward.count,1);
   assert.equal(claimed.reward.money,600);
   const restored=JSON.parse(JSON.stringify({...next,events:{...next.events,townLegacy:claimed.progress}}));
   assert.equal(T.snapshot(restored).status,'complete');
   assert.equal(T.snapshot(restored).tier,5);
   assert.equal(T.complete(restored).ok,false,'Cannot collect reward twice even after reload');
   assert.match(T.archivistText(restored),/灯り/);
   assert.match(T.citizenText('sign',restored),/記録祭/);
  }
 }
}
assert.equal(T.normalize(null).accepted,false);
assert.equal(T.normalize({claimed:true}).accepted,true);
const one={...base,events:{fieldRequests:{flower:{claimed:true}}}};
assert.match(T.citizenText('traveler',one),/調査札/);
assert.equal(T.citizenText('unrelated',one),null);
console.log('PASS: tiered town scenery, chained archivist unlock, status gates, dialogue and exactly-once finale rewards');
