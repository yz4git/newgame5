/* ASTRA TALES original creature-specific combat poses.
 * The attack poses vary by silhouette instead of reusing one whole-body lunge.
 */
(function(root,factory){const m=factory();if(typeof module!=='undefined'&&module.exports)module.exports=m;root.AstraCreatureMotion=m})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
const styles={
 fox:{idle:'flick',attack:'dash',rate:1.40,strength:1.18},
 deer:{idle:'sway',attack:'rear',rate:.69,strength:.92},
 otter:{idle:'bob',attack:'twirl',rate:1.06,strength:1.06},
 rabbit:{idle:'hop',attack:'pounce',rate:1.47,strength:1.27},
 mouse:{idle:'scurry',attack:'rush',rate:1.66,strength:1.08},
 bird:{idle:'hover',attack:'dive',rate:1.83,strength:1.30},
 frog:{idle:'squat',attack:'spring',rate:.76,strength:1.24},
 squirrel:{idle:'twitch',attack:'zigzag',rate:1.78,strength:1.16},
 moth:{idle:'flutter',attack:'glide',rate:1.29,strength:.98},
 beetle:{idle:'brace',attack:'ram',rate:.48,strength:1.05},
 bat:{idle:'flutter',attack:'swoop',rate:1.57,strength:1.24},
 flower:{idle:'bloom',attack:'pollen',rate:.63,strength:.82},
 dragon:{idle:'hover',attack:'surge',rate:.88,strength:1.44}
};
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const bell=x=>Math.sin(Math.PI*clamp(x));
function pose(mon,frame,attackProgress=null,back=false){
 const name=mon?.shape,style=styles[name]||styles.mouse;
 const t=(frame+(mon?.id?.length||0)*19)*.07*style.rate;
 const wave=Math.sin(t),double=Math.sin(t*2.4),slow=Math.sin(t*.55);
 const result={x:0,y:0,rotation:0,sx:1,sy:1,glow:0,burst:0,pose:style.idle,phase:0};
 switch(name){
 case 'fox':result.y=-Math.abs(wave)*1.5;result.rotation=slow*.018;result.sx=1+double*.012;break;
 case 'deer':result.y=slow*.8;result.rotation=slow*.027;result.sy=1+wave*.018;break;
 case 'otter':result.y=-Math.sin(t)*2;result.rotation=slow*.045;result.sx=1+wave*.012;break;
 case 'rabbit':result.y=-Math.pow(Math.max(0,wave),2)*6;result.sy=1-.05*Math.max(0,wave);break;
 case 'mouse':result.x=double*2.8;result.y=-Math.abs(double)*1.5;result.rotation=double*.02;break;
 case 'bird':result.y=-8-Math.sin(t)*5;result.rotation=slow*.055;result.sx=1+.035*double;break;
 case 'frog':result.sy=.97+Math.max(0,wave)*.065;result.y=Math.max(0,wave)*1.5;break;
 case 'squirrel':result.x=double*2;result.rotation=double*.045;result.y=-Math.abs(wave)*3;break;
 case 'moth':result.y=-8-wave*3;result.rotation=slow*.07;result.sx=1+Math.sin(t*3)*.04;break;
 case 'beetle':result.y=slow*.6;result.sy=1+wave*.009;result.rotation=slow*.012;break;
 case 'bat':result.y=-6-wave*4;result.rotation=slow*.08;result.sx=1+double*.05;break;
 case 'flower':result.sy=1+wave*.045;result.rotation=slow*.055;result.glow=.08+.06*(slow+1);break;
 case 'dragon':result.y=-8-wave*4;result.rotation=slow*.035;result.glow=.09+.04*wave;break;
 }
 if(attackProgress!==null && Number.isFinite(attackProgress)){
  const p=clamp(attackProgress),wind=ease(p/.26),strike=bell((p-.26)/.57);
  const end=ease((p-.79)/.21),strength=style.strength;
  result.phase=p;result.pose=style.attack;
  switch(name){
   case 'fox':case 'mouse':case 'beetle':
    result.x+=(back?1:-1)*strength*(strike*24-wind*3);
    result.rotation+=(back?-1:1)*strike*.12;
    result.sy=1-strike*.09;result.burst=strike;break;
   case 'deer':
    result.y-=strength*(wind*9+strike*5)*(1-end);
    result.rotation+=(back?-1:1)*(-.12*wind+.21*strike);result.sx=1+strike*.13;result.burst=strike;break;
   case 'otter':
    result.rotation+=(back?-1:1)*strike*.43;
    result.x+=(back?1:-1)*strike*14;
    result.y-=strike*7;result.burst=strike;break;
   case 'rabbit':case 'frog':
    result.y-=strike*(name==='rabbit'?25:31)*strength;
    result.sx=1+strike*.13;result.sy=1-strike*.16;
    result.x+=(back?1:-1)*strike*9;result.burst=strike;break;
   case 'bird':case 'bat':
    result.y-=wind*13+strike*18;
    result.x+=(back?1:-1)*strike*22;
    result.rotation+=(back?-1:1)*strike*.32;
    result.burst=strike;break;
   case 'squirrel':
    result.x+=(back?1:-1)*Math.sin(strike*Math.PI*3)*11;
    result.y-=strike*8;result.rotation+=Math.sin(p*25)*strike*.23;
    result.burst=strike;break;
   case 'moth':
    result.y-=strike*12;
    result.sx=1+strike*.26;
    result.rotation+=(back?-1:1)*strike*.17;result.burst=strike;break;
   case 'flower':
    result.sy=1+strike*.18;result.sx=1+strike*.18;
    result.glow=.2+.65*strike;result.burst=strike;break;
   case 'dragon':
    result.y-=wind*12+strike*13;
    result.sx=1+strike*.16;
    result.x+=(back?1:-1)*strike*19;
    result.rotation+=(back?-1:1)*strike*.14;
    result.glow=.35+.6*strike;result.burst=strike;break;
  }
 }
 for(const k of ['x','y','rotation','sx','sy','glow','burst'])if(!Number.isFinite(result[k]))throw Error('Nonfinite creature pose');
 return result;
}
/* Shape-aware recoil: a bird staggers in flight while a beetle braces,
 * rather than scaling and shaking every species by the same amount. */
function hurt(mon,progress,back=false,critical=false){
 const name=mon?.shape||'mouse',p=Number(progress);
 const base={x:0,y:0,rotation:0,sx:1,sy:1,intensity:0};
 if(!Number.isFinite(p)||p<.39||p>.74)return base;
 const t=(p-.39)/.35,peak=Math.sin(Math.PI*clamp(t))*(critical?1.24:1);
 const recoil=(back?-1:1)*peak;
 switch(name){
 case 'bird':case 'bat':case 'moth':
  base.x=recoil*13;base.y=peak*9;base.rotation=(back?1:-1)*peak*.13;
  base.sx=1-peak*.07;base.sy=1+peak*.08;break;
 case 'beetle':case 'frog':
  base.x=recoil*6;base.y=peak*5;
  base.sx=1+peak*.12;base.sy=1-peak*.15;break;
 case 'deer':case 'dragon':
  base.x=recoil*9;base.y=-peak*6;
  base.rotation=(back?1:-1)*peak*.09;
  base.sx=1-peak*.04;base.sy=1+peak*.08;break;
 case 'flower':
  base.x=recoil*5;base.y=peak*2;
  base.rotation=(back?1:-1)*peak*.18;
  base.sx=1+peak*.10;base.sy=1-peak*.10;break;
 case 'rabbit':
  base.x=recoil*8;base.y=peak*7;
  base.rotation=(back?1:-1)*peak*.06;
  base.sx=1+peak*.14;base.sy=1-peak*.19;break;
 case 'squirrel':
  base.x=recoil*15;base.y=-peak*3;
  base.rotation=(back?1:-1)*peak*.19;
  base.sx=1-peak*.13;base.sy=1+peak*.08;break;
 case 'otter':case 'fox':
  base.x=recoil*10;base.y=peak*3;
  base.rotation=(back?1:-1)*peak*.13;
  base.sx=1-peak*.1;base.sy=1+peak*.05;break;
 default:
  base.x=recoil*12;base.y=peak*4;
  base.rotation=(back?1:-1)*peak*.08;
  base.sx=1-peak*.10;base.sy=1+peak*.10;
 }
 base.intensity=peak;
 return base;
}
function dot(ctx,x,y,r,fill){ctx.beginPath();ctx.fillStyle=fill;ctx.ellipse(x,y,r,r,0,0,Math.PI*2);ctx.fill()}
function trail(ctx,mon,frame,shape){
 const p=shape.burst;
 if(p<=.09)return 0;
 const type=mon.shape,back=shape.x>=0,shift=back?-1:1;
 const col=mon.accent||'#fff0c0';
 // Per-species movements leave a different visual echo. No fullscreen flashes.
 if(type==='fox'){
  for(let i=0;i<7;i++){
   const x=shift*(24+i*7),y=-16+Math.sin(frame*.15+i)*8;
   dot(ctx,x,y,1.4+(i%3)*p,col);
  }
 }else if(type==='deer'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;dot(ctx,Math.cos(a)*(27+11*p),-27+Math.sin(a)*17,1.2+p,col)}
 }else if(type==='otter'||type==='frog'){
  for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9+frame*.07;
   dot(ctx,Math.cos(a)*(25+14*p),-15+Math.sin(a)*(18+14*p),1.5+(i%3),col);
  }
 }else if(type==='rabbit'||type==='mouse'){
  for(let i=0;i<5;i++)dot(ctx,shift*(30+i*12),11-i%2*4,2+(i%2)*p,'#d9d4b28d');
 }else if(type==='bird'||type==='bat'||type==='moth'){
  ctx.strokeStyle=col;ctx.lineWidth=2.5*p;ctx.beginPath();
  for(let i=0;i<4;i++){
   const x=shift*(25+i*10),y=-34+i*7;
   ctx.moveTo(x,y);ctx.lineTo(x+shift*19,y-9);
  }
  ctx.stroke();
 }else if(type==='squirrel'){
  ctx.strokeStyle=col;ctx.lineWidth=3*p;ctx.beginPath();
  for(let i=0;i<4;i++){const x=shift*(30+i*12);ctx.moveTo(x,-45+i*7);ctx.lineTo(x+shift*9,-55+i*7);ctx.lineTo(x+shift*18,-47+i*7)}
  ctx.stroke();
 }else if(type==='beetle'){
  for(let i=0;i<4;i++)dot(ctx,shift*(30+i*9),-10+i*4,2+i*.45,'#d9d7caaa');
 }else if(type==='flower'){
  for(let i=0;i<10;i++){
   const a=i*2.399+frame*.019;
   dot(ctx,Math.cos(a)*(30+15*p),-35+Math.sin(a)*(21+14*p),2+(i%3)*.4,col);
  }
 }else if(type==='dragon'){
  for(let i=0;i<11;i++){
   const a=i*2.4+frame*.024;
   dot(ctx,Math.cos(a)*(37+17*p),-40+Math.sin(a)*(30+11*p),2+(i%3),col);
  }
 }
 return 1;
}
return Object.freeze({STYLES:styles,pose,hurt,trail});
});
