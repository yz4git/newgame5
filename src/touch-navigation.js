/* ASTRA TALES — minimal directional and menu selection math.
 * Keeps pointer geometry and all selection rules independently testable.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTouchNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function direction(clientX,clientY,rect){
 if(!rect||!rect.width||!rect.height)return null;
 const dx=(clientX-(rect.left+rect.width/2))/(rect.width/2);
 const dy=(clientY-(rect.top+rect.height/2))/(rect.height/2);
 if(Math.max(Math.abs(dx),Math.abs(dy))<.20)return null;
 if(Math.abs(dx)>Math.abs(dy)*1.05)return dx>0?'right':'left';
 if(Math.abs(dy)>Math.abs(dx)*1.05)return dy>0?'down':'up';
 return Math.abs(dx)>=Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
}
function first(items){
 return items.findIndex(x=>!x.disabled);
}
function next(items,index,dir,columns=2){
 if(!items?.length)return -1;
 const current=Number.isInteger(index)&&index>=0&&index<items.length&&!items[index]?.disabled?index:first(items);
 if(current<0)return -1;
 const cols=Math.max(1,columns),x=current%cols,y=Math.floor(current/cols),count=items.length;
 const delta=dir==='left'?[-1,0]:dir==='right'?[1,0]:dir==='up'?[0,-1]:dir==='down'?[0,1]:null;
 if(!delta)return current;
 const valid=[];
 for(let i=0;i<count;i++){
  if(items[i].disabled||i===current)continue;
  const cx=i%cols,cy=Math.floor(i/cols),dx=cx-x,dy=cy-y;
  if(delta[0]&&dx*delta[0]<=0)continue;
  if(delta[1]&&dy*delta[1]<=0)continue;
  const orth=delta[0]?Math.abs(dy):Math.abs(dx);
  const distance=delta[0]?Math.abs(dx):Math.abs(dy);
  valid.push({i,score:orth*12+distance});
 }
 valid.sort((a,b)=>a.score-b.score||a.i-b.i);
 return valid.length?valid[0].i:current;
}
return Object.freeze({direction,first,next});
});
