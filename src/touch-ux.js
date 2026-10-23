/* ASTRA TALES — compact, independent UI usability rules.
 * Pure hit-testing and focus navigation; no gameplay or save-data mutation.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTouchUX=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BLOCKED=new Set([3,4,5,8,9,11]);
function layout(view,options){
 const long=options.length>=5;
 return view==='submenu'&&long?'list':'grid';
}
function columns(view,mode){return mode==='list'?1:2}
function focusIndex(options,preferred){
 if(!options.length)return -1;
 if(preferred){
  const same=options.findIndex(o=>!o.disabled&&o.text===preferred);
  if(same>=0)return same;
 }
 return options.findIndex(o=>!o.disabled);
}
function touchTile(clientX,clientY,rect,cam,tile=32,width=416,height=352){
 if(!rect||!rect.width||!rect.height||!cam)return null;
 const x=(clientX-rect.left)/rect.width*width,y=(clientY-rect.top)/rect.height*height;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>width||y>height)return null;
 return {x:Math.floor((x+cam.x)/tile),y:Math.floor((y+cam.y)/tile)};
}
function tapCommand(tile,hero,tiles,npcs=[]){
 if(!tile||!hero)return null;
 const dx=tile.x-hero.x,dy=tile.y-hero.y;
 if(dx===0&&dy===0)return {kind:'interact',direction:null};
 const cardinal=Math.abs(dx)>=Math.abs(dy)?
  (dx<0?'left':'right'):(dy<0?'up':'down');
 const near=Math.abs(dx)+Math.abs(dy)===1;
 if(near&&npcs.some(n=>n.x===tile.x&&n.y===tile.y))return {kind:'interact',direction:cardinal};
 const d=cardinal==='left'?[-1,0]:cardinal==='right'?[1,0]:cardinal==='up'?[0,-1]:[0,1];
 const x=hero.x+d[0],y=hero.y+d[1];
 if(near&&BLOCKED.has(tiles?.[y]?.[x]))return {kind:'interact',direction:cardinal};
 return {kind:'walk',direction:cardinal};
}
function cancelChoice(options){
 if(!Array.isArray(options))return -1;
 // Never dismiss a multi-choice narrative dialog by choosing its first action.
 for(let i=0;i<options.length;i++){
  if(options[i].disabled)continue;
  const name=options[i].text||'';
  if(/(もどる|戻る|やめる|キャンセル|あとで|待って|閉じる)/.test(name))return i;
 }
 if(options.length===1&&!options[0].disabled&&/^(▶|つづける|次へ|OK)/.test(options[0].text||''))return 0;
 return -1;
}
return Object.freeze({layout,columns,focusIndex,touchTile,tapCommand,cancelChoice});
});
