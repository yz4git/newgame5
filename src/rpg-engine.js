/* ASTRA RPG Engine: independently implemented, dependency-free systems.
 * Data-driven creature growth, combat, encounters, storage, evolution, and
 * save migration for the original ASTRA TALES browser RPG.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.AstraEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const NATURES=[
  {id:'steady',name:'おだやか',atk:1,def:1,spd:1},
  {id:'bold',name:'ゆうかん',atk:1.10,def:1,spd:.90},
  {id:'swift',name:'せっかち',atk:1,def:.90,spd:1.10},
  {id:'tough',name:'がんじょう',atk:.90,def:1.10,spd:1},
  {id:'sharp',name:'いじっぱり',atk:1.08,def:1,spd:.94}
];
const NEW_MOVES={
 'ほのおのうず':{p:62,type:'火',accuracy:92,category:'special',pp:15},
 'ソーラーブレード':{p:67,type:'草',accuracy:95,category:'physical',pp:12},
 'アクアリング':{effect:'heal',healRatio:.50,pp:10},
 'みずのはどう':{p:60,type:'水',accuracy:95,category:'special',pp:15},
 'リーフシールド':{effect:'guard',pp:14},
 'せいでんき':{p:58,type:'雷',accuracy:94,category:'special',pp:16,status:'まひ',statusChance:.24},
 'つむじかぜ':{p:63,type:'風',accuracy:95,category:'special',pp:15},
 'つきのしずく':{effect:'heal',healRatio:.40,pp:12},
 'いわくだき':{p:59,type:'岩',accuracy:94,category:'physical',pp:15},
 'よるのやいば':{p:63,type:'影',accuracy:94,category:'physical',pp:14},
 'せいなるひかり':{p:72,type:'光',accuracy:92,category:'special',pp:12},
 'しびれごな':{effect:'inflict',status:'まひ',accuracy:82,pp:15},
 'どくのつゆ':{effect:'inflict',status:'どく',accuracy:90,pp:14},
 'ねむりのこな':{effect:'inflict',status:'ねむり',accuracy:77,pp:10},
 'たいあたり':{p:35,type:'無',accuracy:99,category:'physical',pp:30},
 'ひっかく':{p:32,type:'無',accuracy:100,category:'physical',pp:30}
};
const LEARNSETS={
 flamio:[[1,'ひっかく'],[4,'ひのこ'],[8,'きあいだめ'],[12,'ほのおのうず']],
 leafin:[[1,'たいあたり'],[4,'はっぱカッター'],[8,'こうごうせい'],[12,'リーフシールド'],[16,'ソーラーブレード']],
 aquill:[[1,'たいあたり'],[4,'みずてっぽう'],[8,'あわガード'],[12,'みずのはどう'],[16,'アクアリング']],
 chiro:[[1,'たいあたり'],[4,'はっぱカッター'],[10,'リーフシールド'],[14,'しびれごな']],
 koro:[[1,'ひっかく'],[5,'たいあたり'],[11,'きあいだめ']],
 fugale:[[1,'かぜおこし'],[5,'ひっかく'],[11,'つむじかぜ']],
 puddlo:[[1,'たいあたり'],[4,'みずてっぽう'],[10,'みずのはどう']],
 sparkit:[[1,'ひっかく'],[4,'でんきショック'],[11,'せいでんき']],
 lumin:[[1,'かぜおこし'],[5,'ひかりのこな'],[12,'ねむりのこな']],
 crag:[[1,'たいあたり'],[5,'いわおとし'],[12,'いわくだき']],
 shade:[[1,'かぜおこし'],[5,'かげうち'],[12,'よるのやいば']],
 orchid:[[1,'はっぱカッター'],[5,'こうごうせい'],[12,'どくのつゆ']],
 glint:[[1,'かぜおこし'],[7,'ほしのひかり'],[13,'せいなるひかり']],
 flaro:[[1,'ひっかく'],[5,'ひのこ'],[12,'ほのおのうず'],[18,'きあいだめ']],
 leafaro:[[1,'たいあたり'],[5,'はっぱカッター'],[12,'リーフシールド'],[18,'ソーラーブレード']],
 aquaron:[[1,'たいあたり'],[5,'みずてっぽう'],[12,'みずのはどう'],[18,'アクアリング']]
};
const EVOLUTIONS={flamio:{to:'flaro',level:16},leafin:{to:'leafaro',level:16},aquill:{to:'aquaron',level:16}};
const RARITIES={flamio:1,leafin:1,aquill:1,chiro:1.25,koro:1.25,fugale:1.1,puddlo:1.15,sparkit:1.45,lumin:1.6,crag:1.5,shade:1.55,orchid:1.6,glint:2.2,flaro:1.8,leafaro:1.8,aquaron:1.8};
let uidSequence=1;
function uid(){return 'a'+Date.now().toString(36)+'-'+(uidSequence++).toString(36)}
function ivs(rng=Math.random){return {hp:Math.floor(rng()*32),atk:Math.floor(rng()*32),def:Math.floor(rng()*32),spd:Math.floor(rng()*32)}}
function xpNeed(level){return cap(Math.floor(13+level*8+level*level*.16),19,2000)}
function maxHpFor(s,lv,iv={hp:16}){return Math.floor(s.hp+lv*2.4+(iv.hp||0)*lv/120)}
function statsFor(m,s){
 const iv=m.iv||{atk:0,def:0,spd:0},nature=NATURES.find(n=>n.id===m.nature)||NATURES[0],ev=m.ev||{};
 return {
 atk:Math.floor((s.atk+m.level*1.3+(iv.atk||0)*m.level/130+(ev.atk||0)/40)*nature.atk),
 def:Math.floor((s.def+m.level*.8+10+(iv.def||0)*m.level/130+(ev.def||0)/40)*nature.def),
 spd:Math.floor((s.spd+m.level*.9+(iv.spd||0)*m.level/130+(ev.spd||0)/40)*nature.spd)
 };
}
function maxPP(name,moves){return moves[name]?.pp|| (moves[name]?.effect?12:(moves[name]?.p>=55?12:20))}
function availableMoves(id,level,species,moves,limit=4){
 const source=LEARNSETS[id]||[];
 const learned=source.filter(pair=>pair[0]<=level).map(pair=>pair[1]).filter(n=>moves[n]);
 const fallback=(species[id]?.moves||[]).filter(n=>moves[n]);
 return [...new Set(learned.length?learned:fallback)].slice(-limit);
}
function makeCreature(id,level,species,moves,rng=Math.random){
 const s=species[id];if(!s)throw Error('Unknown creature '+id);
 const iv=ivs(rng),nature=NATURES[Math.floor(rng()*NATURES.length)].id;
 const movelist=availableMoves(id,level,species,moves),hp=maxHpFor(s,level,iv);
 return {uid:uid(),id,level,hp,maxHp:hp,xp:0,status:'',statusTurns:0,focus:false,guard:false,iv,nature,ev:{hp:0,atk:0,def:0,spd:0},
 moves:movelist,pp:Object.fromEntries(movelist.map(n=>[n,maxPP(n,moves)])),friendship:70,metAt:'旅の途中',heldItem:null};
}
function normalize(mon,species,moves,rng=Math.random){
 if(!mon||!species[mon.id])return null;
 const base=makeCreature(mon.id,cap(Number(mon.level)||1,1,100),species,moves,rng);
 const out={...base,...mon};
 out.uid=mon.uid||base.uid;
 out.iv={...base.iv,...(mon.iv||{})};
 out.ev={...base.ev,...(mon.ev||{})};
 out.moves=(Array.isArray(mon.moves)&&mon.moves.length?mon.moves:species[mon.id].moves).filter(n=>moves[n]).slice(-4);
 if(!out.moves.length)out.moves=base.moves;
 out.pp=Object.fromEntries(out.moves.map(n=>[n,cap(Number(mon.pp?.[n]??maxPP(n,moves)),0,maxPP(n,moves))]));
 out.hp=cap(Number(out.hp)||0,0,Number(out.maxHp)||base.maxHp);
 out.xp=Math.max(0,Number(out.xp)||0);
 out.status=typeof out.status==='string'?out.status:'';
 out.statusTurns=Math.max(0,Number(out.statusTurns)||0);
 return out;
}
function gainXP(mon,amount,species,moves,rng=Math.random){
 let levels=[],learned=[],evolved=null;
 if(!mon||!species[mon.id])return {levels,learned,evolved};
 mon.xp+=Math.max(0,Math.floor(amount));
 for(let step=0;step<100&&mon.level<100&&mon.xp>=xpNeed(mon.level);step++){
  mon.xp-=xpNeed(mon.level);
  const oldMax=mon.maxHp;mon.level++;
  mon.maxHp=maxHpFor(species[mon.id],mon.level,mon.iv);
  mon.hp+=mon.maxHp-oldMax;
  mon.friendship=cap((mon.friendship||70)+1,0,255);
  levels.push(mon.level);
  const newMoves=(LEARNSETS[mon.id]||[]).filter(([lv])=>lv===mon.level);
  for(const [,name] of newMoves){if(mon.moves.includes(name))continue;const forgotten=mon.moves.length>=4?mon.moves.shift():null;
   if(forgotten)delete mon.pp[forgotten];
   mon.moves.push(name);mon.pp[name]=maxPP(name,moves);
   learned.push({name,forgotten});
  }
  const evo=EVOLUTIONS[mon.id];
  if(evo&&mon.level>=evo.level&&species[evo.to]){
   const from=mon.id;mon.id=evo.to;const hp=mon.hp,old=mon.maxHp;
   mon.maxHp=maxHpFor(species[mon.id],mon.level,mon.iv);
   mon.hp=cap(hp+mon.maxHp-old,0,mon.maxHp);
   evolved={from,to:mon.id};
   for(const name of species[mon.id].moves){
    if(mon.moves.includes(name))continue;
    if(mon.moves.length>=4){const forgotten=mon.moves.shift();delete mon.pp[forgotten];learned.push({name,forgotten})}
    mon.moves.push(name);mon.pp[name]=maxPP(name,moves);
   }
  }
 }
 return {levels,learned,evolved};
}
function calcDamage(attacker,target,name,species,moves,effectiveness,rng=Math.random){
 const m=moves[name];if(!m)return {text:'技を使えなかった！',damage:0};
 const source=species[attacker.id],dest=species[target.id];
 if(m.effect==='heal'){const old=attacker.hp;attacker.hp=cap(attacker.hp+Math.max(1,Math.floor(attacker.maxHp*(m.healRatio||.4))),0,attacker.maxHp);return {text:source.name+' はHPを '+(attacker.hp-old)+' 回復！',damage:0}}
 if(m.effect==='guard'){attacker.guard=true;return {text:source.name+' は身を守った！',damage:0}}
 if(m.effect==='focus'){attacker.focus=true;return {text:source.name+' は集中した！',damage:0}}
 if(rng()*100>(m.accuracy??95))return {text:source.name+' の '+name+'！ しかし外れた！',damage:0};
 if(m.effect==='inflict'){
  if(target.status)return {text:dest.name+' はすでに状態異常だ！',damage:0};
  target.status=m.status;target.statusTurns=m.status==='ねむり'?2+Math.floor(rng()*3):0;
  return {text:dest.name+' は '+m.status+' になった！',damage:0};
 }
 const stA=statsFor(attacker,source),stD=statsFor(target,dest);
 const level=Math.floor(attacker.level),power=m.p||30,type=m.type||'無';
 const category=m.category||(['火','水','草','雷','風','光','影'].includes(type)?'special':'physical');
 const multiplier=effectiveness(type,dest.type);
 const stab=type===source.type?1.3:1,critical=rng()<.0625?1.5:1;
 const attack=stA.atk*(category==='special'?1.08:1),defense=stD.def*(category==='special'?.92:1);
 const defenseFactor=attacker.status==='やけど'&&category==='physical'?.72:1;
 const base=Math.floor((Math.floor(2*level/5+2)*power*(attack/(defense+5)))/50)+2;
 const damage=Math.max(1,Math.floor(base*1.5*stab*multiplier*critical*(.85+rng()*.15)*defenseFactor*(attacker.focus?1.6:1)*(target.guard?.5:1)));
 target.hp=cap(target.hp-damage,0,target.maxHp);
 attacker.focus=false;target.guard=false;
 let msg=source.name+' の '+name+'！';
 if(critical>1)msg+=' 急所に当たった！';
 if(multiplier>1)msg+=' 効果は抜群！';
 else if(multiplier<1)msg+=' 効果はいまひとつ…';
 const statusChance=m.statusChance??(name==='ひのこ'?.13:name==='でんきショック'?.16:0);
 const ailment=m.status||(name==='ひのこ'?'やけど':name==='でんきショック'?'まひ':null);
 if(ailment&&target.hp>0&&!target.status&&rng()<statusChance){target.status=ailment;target.statusTurns=0;msg+=' '+dest.name+' は '+ailment+' した！'}
 return {text:msg,damage,critical:critical>1,efficacy:multiplier};
}
function afterTurn(mon){
 if(!mon||mon.hp<=0)return null;
 if(mon.status==='やけど'||mon.status==='どく'){
  const dmg=Math.max(1,Math.floor(mon.maxHp/(mon.status==='やけど'?16:10)));
  mon.hp=cap(mon.hp-dmg,0,mon.maxHp);
  return {damage:dmg,text:mon.status+' で '+dmg+' ダメージ！'};
 }
 return null;
}
function skipStatus(mon,rng=Math.random){
 if(mon.status==='まひ'&&rng()<.22)return 'まひ';
 if(mon.status==='ねむり'){
  if(mon.statusTurns>0){mon.statusTurns--;return 'ねむり'}
  mon.status='';mon.statusTurns=0;
 }
 return null;
}
function catchProbability(mon,species,modifier=1){
 const rarity=RARITIES[mon.id]||1,relative=(3*mon.maxHp-2*mon.hp)/(3*mon.maxHp);
 const statusBonus=mon.status==='ねむり'?1.6:mon.status?1.25:1;
 return cap((.18+relative*.66)*statusBonus*modifier/rarity,.03,.95);
}
function chooseEncounter(table,{phase=0,rng=Math.random}={}){
 if(!table?.length)return null;
 const options=table.map(([id,level],i)=>({id,level,weight:1+(i%2)*.2+(phase===2&&i===table.length-1?.35:0)}));
 const total=options.reduce((n,x)=>n+x.weight,0),roll=rng()*total;
 let sum=0;for(const item of options){sum+=item.weight;if(roll<=sum)return {id:item.id,level:item.level+Math.floor(rng()*3)}}
 const item=options[options.length-1];return {id:item.id,level:item.level};
}
function emptyBoxes(n=6){return Array.from({length:n},(_,i)=>({name:'BOX '+(i+1),members:[]}))}
function fixBoxes(boxes){const a=Array.isArray(boxes)?boxes:emptyBoxes();return a.slice(0,8).map((box,i)=>({name:String(box.name||'BOX '+(i+1)).slice(0,24),members:Array.isArray(box.members)?box.members.slice(0,30):[]}))}
function putInStorage(boxes,mon){for(const box of boxes){if(box.members.length<30){box.members.push(mon);return box.name}}return null}
function takeFromStorage(boxes,boxIndex,slot,party){
 if(party.length>=6)return {ok:false,reason:'パーティがいっぱい'};
 const box=boxes[boxIndex];if(!box||!box.members[slot])return {ok:false,reason:'星霊がいません'};
 party.push(box.members.splice(slot,1)[0]);return {ok:true};
}
function deposit(boxes,party,index){
 if(party.length<=1)return {ok:false,reason:'最後の1体は預けられません'};
 if(index<0||index>=party.length)return {ok:false,reason:'星霊がいません'};
 const remaining=party.filter((m,i)=>i!==index);
 if(!remaining.some(m=>m.hp>0))return {ok:false,reason:'戦える仲間を残してください'};
 const where=putInStorage(boxes,party[index]);if(!where)return {ok:false,reason:'ボックスがいっぱい'};
 party.splice(index,1);return {ok:true,box:where};
}
function migrateSave(save,species,moves,rng=Math.random){
 const next={...save,party:(save.party||[]).filter(m=>species[m.id]).map(m=>normalize(m,species,moves,rng)),
   boxes:fixBoxes(save.boxes),saveVersion:2};
 next.boxes.forEach(box=>{box.members=box.members.filter(m=>species[m.id]).map(m=>normalize(m,species,moves,rng))});
 if(!next.events||typeof next.events!=='object')next.events={};
 return next;
}
return Object.freeze({NATURES,NEW_MOVES,LEARNSETS,EVOLUTIONS,ivs,xpNeed,maxHpFor,statsFor,maxPP,availableMoves,makeCreature,normalize,gainXP,calcDamage,afterTurn,skipStatus,catchProbability,chooseEncounter,emptyBoxes,fixBoxes,putInStorage,takeFromStorage,deposit,migrateSave});
});
