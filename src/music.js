/* ASTRA Music: lightweight original procedural soundtrack for mobile Web Audio.
 * Scheduled only from the foreground animation loop; never requires a server. */
(function(root,factory){const m=factory();if(typeof module!=='undefined'&&module.exports)module.exports=m;root.AstraMusic=m})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MODES={
 title:{bpm:94,root:60,scale:[0,2,4,7,9],notes:[0,2,4,6,4,2,3,null,0,4,7,6,4,2,1,null],bass:[0,3,4,3],wave:'sine'},
 village:{bpm:112,root:62,scale:[0,2,4,7,9],notes:[0,2,4,2,5,4,2,0,3,4,5,7,6,4,2,null],bass:[0,4,3,0],wave:'triangle'},
 home:{bpm:91,root:60,scale:[0,2,4,7,9],notes:[0,null,2,3,4,null,3,2,1,null,2,4,3,2,0,null],bass:[0,3,4,0],wave:'sine'},
 lab:{bpm:106,root:65,scale:[0,2,3,7,9],notes:[0,2,4,2,5,4,2,null,0,1,3,4,6,3,2,0],bass:[0,4,3,1],wave:'triangle'},
 route:{bpm:128,root:62,scale:[0,2,4,7,9],notes:[0,2,4,5,4,2,3,4,5,7,6,4,2,0,1,null],bass:[0,4,3,4],wave:'triangle'},
 forest:{bpm:103,root:57,scale:[0,3,5,7,10],notes:[0,null,2,4,5,3,2,null,1,3,5,6,5,4,2,null],bass:[0,3,4,2],wave:'sine'},
 lake:{bpm:86,root:60,scale:[0,2,5,7,9],notes:[4,null,2,3,1,null,0,2,3,null,4,6,5,3,2,null],bass:[0,4,3,4],wave:'sine'},
 shrine:{bpm:97,root:53,scale:[0,2,3,7,8],notes:[0,null,4,5,7,5,4,null,3,2,0,null,4,3,2,0],bass:[0,3,4,2],wave:'triangle'},
 highland:{bpm:117,root:64,scale:[0,2,4,7,11],notes:[0,4,5,7,5,4,2,0,4,6,7,9,7,6,5,2],bass:[0,4,3,0],wave:'triangle'},
 battle:{bpm:144,root:57,scale:[0,2,3,5,7,8,10],notes:[0,0,3,4,5,4,3,2,4,6,7,6,5,4,3,2],bass:[0,4,3,4],wave:'square'},
 rival:{bpm:158,root:55,scale:[0,1,3,5,7,8,10],notes:[0,4,5,4,6,5,3,4,0,2,4,6,7,5,4,2],bass:[0,3,4,3],wave:'sawtooth'},
 boss:{bpm:154,root:52,scale:[0,1,3,5,7,8,10],notes:[0,0,4,5,7,5,4,2,3,3,6,7,8,6,4,2],bass:[0,4,3,2],wave:'sawtooth'}
};
function pitch(root,scale,degree){
 const oct=Math.floor(degree/scale.length),i=((degree%scale.length)+scale.length)%scale.length;
 return root+scale[i]+oct*12;
}
function hz(midi){return 440*Math.pow(2,(midi-69)/12)}
function create(context){
 if(!context||typeof context.createOscillator!=='function'||typeof context.createGain!=='function')throw Error('AudioContext required');
 let active=true,current=null,next=0,step=0,scheduled=0;
 const master=context.createGain();master.gain.value=.24;master.connect(context.destination);
 function note(midi,time,length,type,level){
  if(!Number.isFinite(midi))return;
  const osc=context.createOscillator(),envelope=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(hz(midi),time);
  const gain=level;
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.linearRampToValueAtTime(gain,time+.016);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.038,length));
  osc.connect(envelope);envelope.connect(master);
  osc.start(time);osc.stop(time+Math.max(.05,length)+.035);
  scheduled++;
 }
 function playStep(t,configuration){
  const eight=60/configuration.bpm/2;
  const idx=step%configuration.notes.length;
  const degree=configuration.notes[idx];
  if(degree!==null){
   const p=pitch(configuration.root,configuration.scale,degree+configuration.scale.length);
   note(p,t,eight*.87,configuration.wave,.095);
   if(idx%4===2)note(p+12,t,eight*.46,'sine',.019);
  }
  if(step%2===0){
   const progression=configuration.bass[Math.floor(step/4)%configuration.bass.length];
   note(pitch(configuration.root,configuration.scale,progression-configuration.scale.length),t,eight*1.72,'triangle',.072);
  }
  if(step%4===0){
   const chord=configuration.bass[Math.floor(step/4)%configuration.bass.length];
   note(pitch(configuration.root,configuration.scale,chord),t,eight*3.1,'sine',.026);
   note(pitch(configuration.root,configuration.scale,chord+2),t,eight*2.7,'sine',.020);
  }
  if(configuration.bpm>124&&step%2===1)
   note(configuration.root-24,t,eight*.10,'square',.012);
 }
 return {
  get track(){return current},
  get count(){return scheduled},
  setTrack(name){
   const id=MODES[name]?name:'route';
   if(current===id)return;
   current=id;next=context.currentTime+.035;step=0;
  },
  tick(){
   if(!active||!current||context.state==='suspended')return;
   if(next<context.currentTime-.5){next=context.currentTime+.02;step=0}
   const conf=MODES[current],duration=60/conf.bpm/2;
   let loops=0;
   while(next<context.currentTime+.15&&loops++<8){playStep(next,conf);next+=duration;step++}
  },
  setMuted(muted){active=!muted;master.gain.setTargetAtTime(muted?0:.24,context.currentTime,.035);if(!muted)next=context.currentTime+.03},
  stop(){current=null;master.gain.setTargetAtTime(0,context.currentTime,.03)},
  destroy(){active=false;current=null;master.disconnect()}
 };
}
return Object.freeze({MODES,pitch,hz,create});
});
