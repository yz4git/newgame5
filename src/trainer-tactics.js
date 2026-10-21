/* ASTRA TALES — selective, readable opponent tactics.
 * Predicts only from visible stats and known move data, never hidden input.
 * The final choice is stochastic so repeat fights retain some variation.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTactics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const cap=(n,a,b)=>Math.min(b,Math.max(a,n));
const stage=n=>n>=0?(2+n)/2:2/(2-n);
function estimate(attacker,defender,move,species,moves,typeEffect,weather='clear'){
 const m=moves[move],a=species[attacker?.id],d=species[defender?.id];
 if(!m?.p||!a||!d)return 0;
 const special=m.category==='special'||(!m.category&&['火','水','草','雷','風','光','影'].includes(m.type));
 const bonus=Math.max(.1,Number(typeEffect(m.type,d.type))||1);
 const damageBonus=m.type===a.type?1.5:1;
 const weatherBonus=weather==='rain'?(m.type==='水'?1.5:m.type==='火'?.5:1):
  weather==='sun'?(m.type==='火'?1.5:m.type==='水'?.5:1):weather==='wind'&&m.type==='風'?1.25:1;
 const attack=(special?(a.spAtk||a.atk):(a.atk))+(attacker.level*1.1);
 const defense=(special?(d.spDef||d.def):d.def)+(defender.level*.8)+10;
 const up=stage(cap(attacker.stages?.[special?'spAtk':'atk']||0,-6,6));
 const down=stage(cap(defender.stages?.[special?'spDef':'def']||0,-6,6));
 const base=(2*attacker.level/5+2)*m.p*(attack*up/(defense*down+5))/50+2;
 const accuracy=cap((m.accuracy??95)/100,0,1);
 return Math.max(1,base*damageBonus*bonus*weatherBonus*accuracy*(attacker.status==='やけど'&&!special?.5:1));
}
function evaluate(move,ctx){
 const {attacker:a,defender:d,moves,species,effectiveness,weather='clear',turn=1}=ctx;
 const m=moves[move];if(!m)return -100;
 const ability=species[a.id]?.type;
 const ratio=a.hp/Math.max(1,a.maxHp),opp=d.hp/Math.max(1,d.maxHp);
 const here=a.stages||{},there=d.stages||{};
 const power=estimate(a,d,move,species,moves,effectiveness,weather);
 let score=0;
 if(m.p){
  const damageFraction=Math.min(1.2,power/Math.max(1,d.hp));
  score=24+damageFraction*62+(m.type===ability?5:0);
  if(power>=d.hp)score+=27;
  if(m.priority>0&&opp<.3)score+=9;
  if(m.status&&d.status)score-=7;
  if(m.status&&!d.status)score+=opp>.4?14:2;
 }else if(m.effect==='heal'){
  const heal=m.healRatio||.4;
  score=ratio>=.9?-65:ratio<=.3?124:ratio<=.5?100:ratio<=.67?77:36;
  if(heal<.45)score-=6;
 }else if(m.effect==='inflict'){
  score=d.status?-100:opp>.65?83:opp>.4?65:26;
  if(m.status==='ねむり')score+=8;
 }else if(m.effect==='stage'){
  const self=m.scope!=='target',who=self?here:there;
  const v=who[m.stat]||0,adjust=m.stages||0;
  if((adjust>0&&v>=6)||(adjust<0&&v<=-6))return -100;
  score=turn<=2?69:turn<=4?45:12;
  if(!self&&m.stat==='accuracy')score+=10;
  if(!self&&adjust<0)score+=5;
  if(ratio<.45)score-=45;
  if(m.stat==='spd'&&(here.spd||0)>=2)score-=38;
 }else if(m.effect==='weather'){
  score=weather===m.weather?-110:turn<=3?58:19;
  if(m.weather==='rain'&&ability==='水'||m.weather==='sun'&&ability==='火')score+=22;
  if(ratio<.4)score-=25;
 }else if(m.effect==='guard')score=a.guard?-95:ratio<=.35?53:15;
 else if(m.effect==='focus')score=a.focus?-90:ratio>.65&&turn<4?51:12;
 else score=8;
 return score*cap((m.accuracy??100)/100,.5,1);
}
function ranked(ctx){
 const list=(ctx.attacker?.moves||ctx.species[ctx.attacker?.id]?.moves||[]).filter(n=>
  ctx.moves[n]&&(ctx.attacker.pp?.[n]??1)>0);
 return list.map(name=>({name,score:evaluate(name,ctx)})).sort((a,b)=>b.score-a.score);
}
function choose(ctx){
 const rows=ranked(ctx);if(!rows.length)return 'わるあがき';
 const rng=ctx.rng||Math.random,skill=ctx.skill||'wild';
 if(skill==='wild')return rows[Math.min(rows.length-1,Math.floor(rng()*rows.length))].name;
 // Intermediate trainers sometimes pick suboptimal-but-viable tactics.
 const randomness={rookie:23,veteran:9,elite:3}[skill]??23;
 const picked=rows.map(x=>({...x,score:x.score+(rng()-.5)*2*randomness})).sort((a,b)=>b.score-a.score)[0];
 return picked.name;
}
return Object.freeze({estimate,evaluate,ranked,choose});
});
