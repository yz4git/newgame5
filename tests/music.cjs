'use strict';
const assert=require('node:assert/strict');
const M=require('../src/music.js');
assert.equal(Object.keys(M.MODES).length,12);
assert(M.MODES.battle.bpm>M.MODES.village.bpm);
assert(M.MODES.lake.bpm<M.MODES.route.bpm);
assert.equal(Math.round(M.hz(69)),440);
assert.equal(M.pitch(60,[0,2,4,7,9],5),72);
let notes=0,stopCount=0,outputs=0,disconnected=0;
const param={setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{},setTargetAtTime:()=>{},value:0};
const ctx={
 currentTime:10,state:'running',destination:{},
 createOscillator(){return {type:'sine',frequency:param,connect:()=>{},start(){notes++},stop(){stopCount++}}},
 createGain(){return {gain:{...param},connect(){outputs++},disconnect(){disconnected++}}}
};
const music=M.create(ctx);
assert.equal(music.track,null);
music.setTrack('village');music.tick();
assert(notes>=3,'Scheduler must produce melody, bass and harmony');
assert.equal(notes,stopCount,'Every voice receives a stop time');
let previous=notes;
ctx.currentTime+=.36;music.tick();
assert(notes>previous,'Music continues from a time based schedule');
music.setTrack('battle');
assert.equal(music.track,'battle');
ctx.currentTime+=.2;music.tick();
assert(notes>previous,'Battle theme runs');
music.setMuted(true);
previous=notes;ctx.currentTime+=.3;music.tick();
assert.equal(notes,previous,'Muted tracks schedule nothing');
music.setMuted(false);ctx.currentTime+=.1;music.tick();
assert(notes>previous,'Unmute resumes scheduler');
ctx.currentTime+=10;music.tick();
assert(notes<200,'Large frame jumps must not schedule unbounded oscillators');
music.stop();previous=notes;ctx.currentTime+=.4;music.tick();
assert.equal(notes,previous);
music.destroy();assert(disconnected>=1);
console.log('PASS: twelve unique themes, pitch synthesis, schedule pacing, battle switching, mute, wake and cleanup');
