/* ASTRA TALES — Workshop recipes and post-festival archive.
 * Pure operations return a new bag/ledger; callers commit once and then save.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTownWorkshop=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RECIPES=Object.freeze([
 {id:'restore',tier:2,title:'星玉と薬の精製',inputs:{orb:1,potion:1},money:0,output:{ether:1}},
 {id:'medicine',tier:2,title:'薬草の濃縮',inputs:{potion:2},money:0,output:{herb:1}},
 {id:'power',tier:3,title:'力の星飾り',inputs:{orb:2},money:50,output:{powerCharm:1}},
 {id:'speed',tier:4,title:'疾風の星飾り',inputs:{orb:1,ether:1},money:0,output:{speedCharm:1}},
 {id:'guard',tier:5,title:'守護の星飾り',inputs:{herb:1},money:80,output:{guardCharm:1}}
]);
const BY_ID=new Map(RECIPES.map(r=>[r.id,r]));
const PANELS=Object.freeze(['forest','lake','highland']);
const NAMES=Object.freeze({orb:'星玉',potion:'キズぐすり',herb:'げんき草',
 ether:'PP回復',powerCharm:'力のお守り',speedCharm:'速さのお守り',guardCharm:'守りのお守り'});
function townTier(save){
 const raw=save?.events?.fieldRequests||{};
 const count=['flower','forest','lake','highland'].filter(k=>raw[k]?.claimed).length;
 return (save?.story?.stage??12)>=12?Math.min(5,count+(save?.events?.townLegacy?.claimed?1:0)):0;
}
function available(save){
 return RECIPES.filter(r=>r.tier<=townTier(save));
}
function canCraft(id,save){
 const recipe=BY_ID.get(id),tier=townTier(save);
 if(!recipe)return {ok:false,reason:'レシピが見つからない。'};
 if(tier<recipe.tier)return {ok:false,reason:'町の調査記録が足りない。'};
 const bag=save?.bag||{};
 if(Object.entries(recipe.inputs).some(([k,n])=>(Number(bag[k])||0)<n))
  return {ok:false,reason:'必要な道具が足りない。'};
 if((Number(save?.money)||0)<recipe.money)return {ok:false,reason:'所持金が足りない。'};
 return {ok:true,recipe};
}
function craft(id,save){
 const check=canCraft(id,save);
 if(!check.ok)return {...check,bag:null,money:null};
 const bag={...(save?.bag||{})},r=check.recipe;
 for(const [k,n] of Object.entries(r.inputs))bag[k]-=n;
 for(const [k,n] of Object.entries(r.output))bag[k]=(bag[k]||0)+n;
 return {ok:true,bag,money:save.money-r.money,recipe:r,
  text:r.title+'に成功！ '+Object.entries(r.output).map(([k,v])=>NAMES[k]+' ×'+v).join('')+'を手に入れた。'};
}
function recipeText(r){
 const inputs=Object.entries(r.inputs).map(([k,n])=>NAMES[k]+'×'+n);
 if(r.money)inputs.push(r.money+'G');
 return inputs.join(' + ')+' → '+Object.entries(r.output).map(([k,n])=>NAMES[k]+'×'+n).join(' + ');
}
function archiveState(save){
 const old=save?.events?.townWorkshop?.archive||{},panels=old.panels&&typeof old.panels==='object'?old.panels:{};
 const valid={};for(const id of PANELS)valid[id]=!!panels[id];
 return {panels:valid,claimed:!!old.claimed};
}
function archiveUnlocked(save){return !!save?.events?.townLegacy?.claimed&&(save?.story?.stage??12)>=12}
function readPanel(id,save){
 const data=archiveState(save);
 if(!archiveUnlocked(save)||!PANELS.includes(id))return {ok:false,state:data};
 data.panels[id]=true;
 const number=PANELS.filter(k=>data.panels[k]).length;
 const message={
  forest:'森の記憶は、旅人の勇気を記していた。',
  lake:'湖の底には、星の光を映す古い技術が残されていた。',
  highland:'星鏡の道は、遠い土地と心をつなぐために作られた。'
 }[id];
 return {ok:true,state:data,text:message+'\n記録の復元：'+number+'/3'};
}
function archiveReward(save){
 const data=archiveState(save);
 if(!archiveUnlocked(save)||data.claimed||PANELS.some(id=>!data.panels[id]))
  return {ok:false,state:data,reward:null};
 data.claimed=true;
 return {ok:true,state:data,reward:{bag:{ether:3,powerCharm:1},money:300},
  text:'すべての調査記録を復元した！\n奥の結晶から、PP回復3個・力のお守り1個・300Gを受け取った！'};
}
return Object.freeze({RECIPES,PANELS,NAMES,townTier,available,canCraft,craft,recipeText,
 archiveState,archiveUnlocked,readPanel,archiveReward});
});
