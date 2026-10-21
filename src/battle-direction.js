/* ASTRA TALES — battle shot staging, impact timing, and readable feedback.
 * Original Canvas 2D direction; no engine state mutation, ROM sprites or textures.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraBattleDirection=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DURATION=760;
const SHAPE_SCALE=Object.freeze({
 dragon:.83,deer:.97,fox:1.07,otter:1.08,rabbit:1.08,mouse:1.15,
 bird:1.05,frog:1.04,squirrel:1.06,moth:1.02,beetle:.98,bat:1.06,flower:1.04
});
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function scale(shape){return SHAPE_SCALE[shape]||1}
function scene({action=null,elapsed=0,frame=0,allyShape='mouse',enemyShape='mouse',isPhysical=false}={}){
 const p=action?clamp(elapsed/DURATION,0,1):1;
 const active=!!action&&p<1,fromAlly=action?.who==='you';
 const hit=active&&(action.damage||0)>0&&p>=.39&&p<=.72;
 const windup=active?ease(p/.24):0;
 const release=active?Math.sin(Math.PI*clamp((p-.23)/.58,0,1)):0;
 const carry=isPhysical?23:9;
 const nudge=release*carry;
 const recoil=hit?Math.sin(Math.PI*clamp((p-.39)/.33,0,1))*6:0;
 const beat=Math.sin(frame*.045)*.8;
 const ally={
   x:105+(fromAlly?nudge:0)+(!fromAlly&&hit?-recoil:0),
   y:326+(fromAlly?Math.sin(p*Math.PI)*-3:0)+beat,
   scale:1.36*scale(allyShape)
 };
 const enemy={
   x:307+(!fromAlly?-nudge:0)+(fromAlly&&hit?recoil:0),
   y:190+(!fromAlly?Math.sin(p*Math.PI)*-3:0)-beat,
   scale:1.01*scale(enemyShape)
 };
 return {progress:p,active,fromAlly,hit,windup,release,ally,enemy,
   target:fromAlly?'enemy':'ally',damage:action?.damage||0,
   critical:!!action?.critical,efficacy:action?.efficacy||1,
   miss:!!action?.miss,move:action?.name||'',duration:DURATION};
}
function hpFraction(mon,action,side,p){
 if(!mon?.maxHp)return 0;
 if(!action||action.target!==side||!Number.isFinite(action.previousHp))return clamp((mon.hp||0)/mon.maxHp,0,1);
 const f=ease((p-.43)/.34),start=clamp(action.previousHp,0,mon.maxHp),end=clamp(mon.hp||0,0,mon.maxHp);
 return clamp((start+(end-start)*f)/mon.maxHp,0,1);
}
function hpNumber(mon,action,side,p){
 return Math.round(hpFraction(mon,action,side,p)*(mon?.maxHp||0));
}
function drawGround(c,shot,frame=0){
 if(!c||!shot)return 0;
 const pads=[{at:shot.enemy,radius:82,color:'#eff6de'},{at:shot.ally,radius:101,color:'#e8f1d0'}];
 c.save();
 for(const {at,radius,color} of pads){
  const bob=Math.sin(frame*.029)*1.2;
  c.beginPath();c.ellipse(at.x,at.y+7,radius*.61,10+bob,0,0,Math.PI*2);
  c.fillStyle='#20333a23';c.fill();
  c.beginPath();c.ellipse(at.x,at.y+5,radius*.52,5,0,0,Math.PI*2);
  c.strokeStyle='#f4f1dc75';c.lineWidth=1.5;c.stroke();
  if(shot.hit&&at===pads[(shot.fromAlly?0:1)].at){
   const r=14+shot.release*29;
   c.beginPath();c.ellipse(at.x,at.y-35,r,r*.55,0,0,Math.PI*2);
   c.strokeStyle=color;c.lineWidth=1.5;c.stroke();
  }
 }
 c.restore();
 return 2;
}
function drawFeedback(c,shot,frame=0){
 if(!c||!shot?.active)return false;
 const p=shot.progress;
 if(p<.42||p>.97)return false;
 const alpha=ease((p-.42)/.12)*(1-ease((p-.82)/.15));
 if(alpha<=0)return false;
 const isEnemy=shot.target==='enemy';
 const x=isEnemy?shot.enemy.x+30:shot.ally.x+53;
 const y=isEnemy?shot.enemy.y-75:shot.ally.y-117;
 let label='';
 if(shot.miss)label='MISS';
 else if(shot.damage>0)label=(shot.critical?'✦ ':'−')+shot.damage;
 else return false;
 c.save();c.globalAlpha=alpha;
 c.font='bold 16px system-ui,sans-serif';c.textAlign='center';
 const width=Math.min(110,Math.max(49,label.length*11+21));
 const baseline=y-(p-.42)*26;
 c.fillStyle='#1c3c4dde';c.beginPath();c.roundRect(x-width/2,baseline-16,width,24,8);c.fill();
 c.fillStyle=shot.critical?'#fff0a0':shot.efficacy>1?'#d8f4bb':shot.miss?'#f4decc':'#f8f2df';
 c.fillText(label,x,baseline+1);c.restore();
 return true;
}
return Object.freeze({DURATION,SHAPE_SCALE,scale,scene,hpFraction,hpNumber,drawGround,drawFeedback});
});
