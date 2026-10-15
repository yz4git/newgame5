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
 'ひっかく':{p:32,type:'無',accuracy:100,category:'physical',pp:30},
 'わるあがき':{p:46,type:'無',accuracy:100,category:'physical',pp:1,recoilRatio:.12},
 'いばる':{effect:'stage',stat:'atk',stages:1,scope:'self',pp:15},
 'からにこもる':{effect:'stage',stat:'def',stages:1,scope:'self',pp:20},
 'すなかけ':{effect:'stage',stat:'accuracy',stages:-1,scope:'target',accuracy:95,pp:15},
 'おいかぜ':{effect:'stage',stat:'spd',stages:2,scope:'self',pp:12},
 'あまごい':{effect:'weather',weather:'rain',turns:5,pp:5},
 'にほんばれ':{effect:'weather',weather:'sun',turns:5,pp:5},
 'ほしのまもり':{effect:'stage',stat:'def',stages:2,scope:'self',pp:8},
 'しっぽをふる':{effect:'stage',stat:'def',stages:-1,scope:'target',accuracy:100,pp:25}
};
// HGSS-style responsibilities, original names, types and simplified balance rules.
const ABILITIES={
 flamio:'もうか',flaro:'もうか',leafin:'しんりょく',leafaro:'しんりょく',
 aquill:'げきりゅう',aquaron:'げきりゅう',chiro:'ようりょくそ',
 koro:'するどいめ',fugale:'はやてのつばさ',puddlo:'すいすい',
 sparkit:'せいでんき',lumin:'りんぷん',crag:'がんじょう',
 shade:'ふゆう',orchid:'さいせいりょく',glint:'プレッシャー'
};
const WEATHERS={
 clear:{name:'晴れ',icon:'☀'},
 rain:{name:'雨',icon:'☂'},
 sun:{name:'強い日差し',icon:'☀'},
 wind:{name:'強風',icon:'≋'},
 sand:{name:'砂あらし',icon:'◌'}
};
const WEATHER_BY_MAP={lake:'rain',highland:'wind',shrine:'clear',forest:'clear',route:'clear',village:'clear'};
const STAGES=['atk','def','spd','accuracy'];
const stageFactor=stage=>stage>=0?(2+stage)/2:2/(2-stage);
function abilityFor(mon){return mon.ability||ABILITIES[mon.id]||'なし'}
function ensureBattleStats(mon){
 if(!mon.stages)mon.stages={atk:0,def:0,spd:0,accuracy:0};
 for(const k of STAGES)mon.stages[k]=cap(Math.trunc(Number(mon.stages[k])||0),-6,6);
 return mon.stages;
}
function changeStage(mon,stat,amount){
 const stats=ensureBattleStats(mon),before=stats[stat]||0;
 stats[stat]=cap(before+amount,-6,6);
 return stats[stat]-before;
}
function battleEnter(mon,opponent,weather){
 ensureBattleStats(mon);
 const ability=abilityFor(mon);
 if(ability==='いかく'&&opponent){changeStage(opponent,'atk',-1);return mon.id+' の威嚇で相手の攻撃が下がった！'}
 if(ability==='プレッシャー')return 'プレッシャーを感じる！';
 if(ability==='すいすい'&&weather==='rain')return '雨で素早く動けそうだ！';
 return '';
}
function battleLeave(mon){
 if(!mon)return '';
 const a=abilityFor(mon);let msg='';
 if(a==='さいせいりょく'&&mon.hp>0){
  const amount=Math.max(1,Math.floor(mon.maxHp/3));mon.hp=cap(mon.hp+amount,0,mon.maxHp);
  msg='再生力でHPが回復した！';
 }
 mon.stages=null;mon.guard=false;mon.focus=false;
 return msg;
}
function weatherFor(map){return WEATHER_BY_MAP[map]||'clear'}
function weatherInfo(name){return WEATHERS[name]||WEATHERS.clear}
function speedFor(mon,species,weather){
 const base=statsFor(mon,species[mon.id]).spd;
 const ability=abilityFor(mon);
 return Math.floor(base*stageFactor(ensureBattleStats(mon).spd)*(mon.status==='まひ'?.5:1)*(ability==='すいすい'&&weather==='rain'?2:1)*(ability==='ようりょくそ'&&weather==='sun'?2:1));
}
function weatherHit(mon,species,weather){
 if(weather!=='sand'||!mon||mon.hp<=0||species[mon.id]?.type==='岩')return null;
 const amount=Math.max(1,Math.floor(mon.maxHp/16));
 mon.hp=cap(mon.hp-amount,0,mon.maxHp);
 return {damage:amount,text:'砂あらしで '+amount+' ダメージ！'};
}
function tickWeather(battle){
 if(!battle||battle.weather==='clear')return '';
 if(battle.weatherTurns===null)return '';
 battle.weatherTurns=Math.max(0,(battle.weatherTurns||0)-1);
 if(battle.weatherTurns===0){battle.weather='clear';return '天候が元に戻った！'}
 return '';
}
const LEARNSETS={
 flamio:[[1,'ひっかく'],[4,'ひのこ'],[8,'きあいだめ'],[12,'ほのおのうず'],[15,'にほんばれ']],
 leafin:[[1,'たいあたり'],[4,'はっぱカッター'],[8,'こうごうせい'],[12,'リーフシールド'],[14,'しっぽをふる'],[16,'ソーラーブレード']],
 aquill:[[1,'たいあたり'],[4,'みずてっぽう'],[8,'あわガード'],[12,'みずのはどう'],[14,'あまごい'],[16,'アクアリング']],
 chiro:[[1,'たいあたり'],[4,'はっぱカッター'],[10,'リーフシールド'],[14,'しびれごな']],
 koro:[[1,'ひっかく'],[5,'たいあたり'],[8,'すなかけ'],[11,'きあいだめ']],
 fugale:[[1,'かぜおこし'],[5,'ひっかく'],[11,'つむじかぜ'],[15,'おいかぜ']],
 puddlo:[[1,'たいあたり'],[4,'みずてっぽう'],[10,'みずのはどう']],
 sparkit:[[1,'ひっかく'],[4,'でんきショック'],[11,'せいでんき']],
 lumin:[[1,'かぜおこし'],[5,'ひかりのこな'],[12,'ねむりのこな']],
 crag:[[1,'たいあたり'],[5,'いわおとし'],[9,'からにこもる'],[12,'いわくだき']],
 shade:[[1,'かぜおこし'],[5,'かげうち'],[12,'よるのやいば']],
 orchid:[[1,'はっぱカッター'],[5,'こうごうせい'],[12,'どくのつゆ']],
 glint:[[1,'かぜおこし'],[7,'ほしのひかり'],[13,'せいなるひかり'],[15,'ほしのまもり']],
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
 atk:Math.floor((s.atk+m.level*1.3+(iv.atk||0)*m.level/130+(ev.atk||0)/40)*nature.atk*(m.heldItem==='powerCharm'?1.15:1)),
 def:Math.floor((s.def+m.level*.8+10+(iv.def||0)*m.level/130+(ev.def||0)/40)*nature.def*(m.heldItem==='guardCharm'?1.15:1)),
 spd:Math.floor((s.spd+m.level*.9+(iv.spd||0)*m.level/130+(ev.spd||0)/40)*nature.spd*(m.heldItem==='speedCharm'?1.15:1))
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
 moves:movelist,pp:Object.fromEntries(movelist.map(n=>[n,maxPP(n,moves)])),friendship:70,metAt:'旅の途中',heldItem:null,ability:ABILITIES[id]||'なし',stages:null};
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
 out.ability=out.ability||ABILITIES[out.id]||'なし';out.stages=null;
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
function gainEffort(mon,opponent,species){
 if(!mon||!opponent||!species[opponent.id])return;
 mon.ev=mon.ev||{hp:0,atk:0,def:0,spd:0};
 const s=species[opponent.id],key=Object.entries({atk:s.atk,def:s.def,spd:s.spd,hp:s.hp/3}).sort((a,b)=>b[1]-a[1])[0][0];
 const total=Object.values(mon.ev).reduce((a,b)=>a+(Number(b)||0),0);
 if(total>=510)return;
 mon.ev[key]=cap((mon.ev[key]||0)+1,0,252);
}
function calcDamage(attacker,target,name,species,moves,effectiveness,rng=Math.random,context={}){
 const m=moves[name];if(!m)return {text:'技を使えなかった！',damage:0};
 const source=species[attacker.id],dest=species[target.id];
 if(m.effect==='heal'){const old=attacker.hp;attacker.hp=cap(attacker.hp+Math.max(1,Math.floor(attacker.maxHp*(m.healRatio||.4))),0,attacker.maxHp);return {text:source.name+' はHPを '+(attacker.hp-old)+' 回復！',damage:0}}
 if(m.effect==='guard'){attacker.guard=true;return {text:source.name+' は身を守った！',damage:0}}
 if(m.effect==='focus'){attacker.focus=true;return {text:source.name+' は集中した！',damage:0}}
 if(m.effect==='weather'){
  context.weather=m.weather;context.weatherTurns=m.turns||5;
  return {text:source.name+' は '+name+'！ 天候が '+weatherInfo(m.weather).name+' に変わった！',damage:0,weather:m.weather,weatherTurns:context.weatherTurns};
 }
 const accuracyStage=ensureBattleStats(attacker).accuracy;
 const accuracyBonus=abilityFor(attacker)==='するどいめ'?Math.max(1,stageFactor(accuracyStage)):stageFactor(accuracyStage);
 if(rng()*100>(m.accuracy??95)*accuracyBonus)return {text:source.name+' の '+name+'！ しかし外れた！',damage:0,miss:true};
 if(m.effect==='stage'){
   const recipient=m.scope==='target'?target:attacker;
   const delta=changeStage(recipient,m.stat,m.stages||0);
   return {text:(m.scope==='target'?dest:source).name+' の '+m.stat+' が '+(delta>0?'上がった！':delta<0?'下がった！':'これ以上変わらない！'),damage:0,stageChange:delta};
 }
 if(m.effect==='inflict'){
  if(target.status)return {text:dest.name+' はすでに状態異常だ！',damage:0};
  target.status=m.status;target.statusTurns=m.status==='ねむり'?2+Math.floor(rng()*3):0;
  return {text:dest.name+' は '+m.status+' になった！',damage:0};
 }
 const stA=statsFor(attacker,source),stD=statsFor(target,dest);
 const level=Math.floor(attacker.level),power=m.p||30,type=m.type||'無';
 const category=m.category||(['火','水','草','雷','風','光','影'].includes(type)?'special':'physical');
 const multiplier=m.recoilRatio?1:effectiveness(type,dest.type);
 const stab=!m.recoilRatio&&type===source.type?1.3:1,critical=rng()<.0625?1.5:1;
 const stageA=ensureBattleStats(attacker),stageD=ensureBattleStats(target);
 const attack=stA.atk*(category==='special'?1.08:1)*stageFactor(stageA.atk);
 const defense=stD.def*(category==='special'?.92:1)*stageFactor(stageD.def);
 const ability=abilityFor(attacker),targetAbility=abilityFor(target);
 const boost=(attacker.hp<=attacker.maxHp/3&&(
   (ability==='もうか'&&type==='火')||(ability==='しんりょく'&&type==='草')||(ability==='げきりゅう'&&type==='水')
 ))?1.5:1;
 const weather=context.weather||'clear';
 const weatherBoost=weather==='rain'?(type==='水'?1.5:type==='火'?.70:1)
 :weather==='sun'?(type==='火'?1.5:type==='水'?.70:1)
 :weather==='wind'&&type==='風'?1.25:1;
 const defenseFactor=attacker.status==='やけど'&&category==='physical'?.72:1;
 const base=Math.floor((Math.floor(2*level/5+2)*power*(attack/(defense+5)))/50)+2;
 const damage=Math.max(1,Math.floor(base*1.5*stab*multiplier*critical*(.85+rng()*.15)*defenseFactor*boost*weatherBoost*(attacker.focus?1.6:1)*(target.guard?.5:1)));
 const actual=targetAbility==='がんじょう'&&target.hp===target.maxHp&&damage>=target.hp?target.hp-1:damage;
 target.hp=cap(target.hp-actual,0,target.maxHp);
 attacker.focus=false;target.guard=false;
 let msg=source.name+' の '+name+'！';
 if(critical>1)msg+=' 急所に当たった！';
 if(multiplier>1)msg+=' 効果は抜群！';
 else if(multiplier<1)msg+=' 効果はいまひとつ…';
 const statusChance=m.statusChance??(name==='ひのこ'?.13:name==='でんきショック'?.16:0);
 const ailment=m.status||(name==='ひのこ'?'やけど':name==='でんきショック'?'まひ':null);
 if(ailment&&target.hp>0&&!target.status&&targetAbility!=='りんぷん'&&rng()<statusChance){target.status=ailment;target.statusTurns=0;msg+=' '+dest.name+' は '+ailment+' した！'}
if(targetAbility==='がんじょう'&&actual<damage)msg+=' がんじょうで耐えた！';
if(targetAbility==='せいでんき'&&category==='physical'&&target.hp>0&&!attacker.status&&rng()<.22){
 attacker.status='まひ';msg+=' '+source.name+' はせいでんきでまひした！'
}
let recoil=0;
if(m.recoilRatio){recoil=Math.max(1,Math.floor(attacker.maxHp*m.recoilRatio));attacker.hp=cap(attacker.hp-recoil,0,attacker.maxHp);msg+=' 反動で '+recoil+' ダメージ！'}
return {text:msg,damage:actual,critical:critical>1,efficacy:multiplier,recoil};
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
 if(mon.status==='まひ'&&rng()<.25)return 'まひ';
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
// Declarative event conditions; UI decides presentation while the engine handles state.
function eventCondition(rule,state){
 if(!rule)return true;
 const flags=state.events||{},party=state.party||[];
 if(rule.all)return rule.all.every(r=>eventCondition(r,state));
 if(rule.any)return rule.any.some(r=>eventCondition(r,state));
 if(rule.not)return !eventCondition(rule.not,state);
 if(rule.flag)return !!flags[rule.flag];
 if(rule.notFlag)return !flags[rule.notFlag];
 if(rule.quest)return state.quest===rule.quest;
 if(rule.badge!==undefined)return !!state.badge===!!rule.badge;
 if(rule.map)return state.map===rule.map;
 if(rule.visited)return !!state.visited?.[rule.visited];
 if(rule.item)return (state.bag?.[rule.item]||0)>=(rule.count||1);
 if(rule.caughtAtLeast!==undefined)return Object.keys(state.caught||{}).length>=rule.caughtAtLeast;
 if(rule.trainersAtLeast!==undefined)return Object.keys(state.defeated||{}).length>=rule.trainersAtLeast;
 if(rule.moneyAtLeast!==undefined)return (state.money||0)>=rule.moneyAtLeast;
 if(rule.partyAtLeast!==undefined)return party.length>=rule.partyAtLeast;
 return true;
}
function runEvent(script,state){
 const out={messages:[],choices:null,warp:null,battle:null};
 const events=state.events||(state.events={});
 const execute=steps=>{
  for(const step of steps||[]){
   if(step.when&&!events[step.when])continue;
   if(step.unless&&events[step.unless])continue;
   if(!eventCondition(step.condition,state))continue;
   if(step.op==='branch'){
    if(execute(eventCondition(step.test,state)?step.then:step.else))return true;
    continue;
   }
   switch(step.op){
    case 'message':out.messages.push(String(step.text||''));break;
    case 'flag':events[step.key]=step.value!==false;break;
    case 'clearFlag':delete events[step.key];break;
    case 'item':{
     const count=Math.max(1,Math.floor(step.count||1));
     state.bag=state.bag||{};state.bag[step.id]=(state.bag[step.id]||0)+count;
     out.messages.push(step.text||step.id+' を '+count+'個手に入れた！');
     break;
    }
    case 'takeItem':{
     const count=Math.max(1,Math.floor(step.count||1));
     if((state.bag?.[step.id]||0)>=count){state.bag[step.id]-=count;if(step.text)out.messages.push(step.text)}
     break;
    }
    case 'money':state.money=Math.max(0,(state.money||0)+(step.amount||0));if(step.text)out.messages.push(step.text);break;
    case 'quest':state.quest=step.value;break;
    case 'badge':state.badge=!!step.value;break;
    case 'heal':for(const m of state.party||[]){m.hp=m.maxHp;m.status='';m.statusTurns=0;if(step.moves)for(const name of m.moves||[])m.pp[name]=step.moves[name]?.pp||m.pp[name]||20}if(step.text)out.messages.push(step.text);break;
    case 'choice':out.choices=(step.options||[]).filter(x=>eventCondition(x.condition,state)).map(x=>({text:x.text,steps:x.steps||[]}));return true;
    case 'warp':out.warp=step.destination;return true;
    case 'battle':out.battle=step.party;return true;
   }
  }
  return false;
 };
 execute(script);
 return out;
}
function applyEvent(script,state){return runEvent(script,state).messages}
function migrateSave(save,species,moves,rng=Math.random){
 const next={...save,party:(save.party||[]).filter(m=>species[m.id]).map(m=>normalize(m,species,moves,rng)),
   boxes:fixBoxes(save.boxes),saveVersion:2};
 next.boxes.forEach(box=>{box.members=box.members.filter(m=>species[m.id]).map(m=>normalize(m,species,moves,rng))});
 if(!next.events||typeof next.events!=='object')next.events={};
 return next;
}
return Object.freeze({NATURES,NEW_MOVES,LEARNSETS,EVOLUTIONS,ABILITIES,WEATHERS,WEATHER_BY_MAP,STAGES,stageFactor,abilityFor,ensureBattleStats,changeStage,battleEnter,battleLeave,weatherFor,weatherInfo,speedFor,weatherHit,tickWeather,ivs,xpNeed,maxHpFor,statsFor,maxPP,availableMoves,makeCreature,normalize,gainXP,gainEffort,applyEvent,runEvent,eventCondition,calcDamage,afterTurn,skipStatus,catchProbability,chooseEncounter,emptyBoxes,fixBoxes,putInStorage,takeFromStorage,deposit,migrateSave});
});
