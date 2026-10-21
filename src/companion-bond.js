/* ASTRA TALES — party leader reactions and walk-driven finds.
 * No mutation: returns an action and a small persistent progress object.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraCompanion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MESSAGES={
 forest:['木の葉の香りを気持ちよさそうに吸い込んでいる。','森の奥から聞こえる音に耳をすませている。'],
 lake:['水面に映った自分の姿に興味津々だ。','波の音に合わせて軽く体を揺らしている。'],
 highland:['高原の風を受けて誇らしそうだ。','遠くの山々を見つめている。'],
 shrine:['古い石柱に静かに見入っている。','星の気配を感じているようだ。'],
 village:['街のにぎわいを楽しんでいる。','君の後ろを楽しそうに歩いている。']
};
function status(mon){const f=mon?.friendship??70;
 return f>=195?'すっかり心を通わせている':f>=135?'とても仲がいい':f>=85?'君を信頼している':'まだ少し緊張している';
}
function normalize(raw){
 const x=raw&&typeof raw==='object'?raw:{};
 return {lastPetStep:Number.isFinite(x.lastPetStep)?x.lastPetStep:-40,
  lastSearchStep:Number.isFinite(x.lastSearchStep)?x.lastSearchStep:-90,
  lastFindStep:Number.isFinite(x.lastFindStep)?x.lastFindStep:-140};
}
function visit(action,save,rng=Math.random){
 const mon=save?.party?.[0];if(!mon)return {ok:false,reason:'いま連れ歩いている仲間がいない。'};
 if(!['talk','pet','search'].includes(action))return {ok:false,reason:'その行動はできない。'};
 const steps=Math.max(0,Number(save.steps)||0),progress=normalize(save.events?.companion);
 const name=save.companionName||mon.id,area=save.map||'village',f=mon.friendship??70;
 const areaMessages=MESSAGES[area]||['周囲の景色をじっと観察している。','君の様子を気にかけているようだ。'];
 let text='',bond=0,reward=null;
 if(action==='talk'){
  const phrase=mon.hp<=mon.maxHp*.33?'少し疲れている。休ませてあげたほうがよさそう。':
   mon.status?'体調が気になるようだ。きちんと手当てしたい。':
   areaMessages[Math.floor(steps/13)%areaMessages.length];
  text=name+'は '+phrase+'\n'+status(mon);
 }else if(action==='pet'){
  if(steps-progress.lastPetStep<40)text=name+'は嬉しそうに寄り添っている。少し歩いてからまた話そう。';
  else{
   progress.lastPetStep=steps;bond=2;
   text=name+'は目を細めて喜んでいる！\nなつき度が少し上がった。';
  }
 }else{
  if(steps-progress.lastSearchStep<30||steps-progress.lastFindStep<90){
   text=name+'は地面の匂いを嗅いでいる。もう少し一緒に歩こう。';
  }else{
   progress.lastSearchStep=steps;
   if(rng()<.33){
    const pool=area==='forest'?['herb','potion']:area==='lake'?['orb','herb']:['orb','potion','ether'];
    reward={item:pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],count:1};
    progress.lastFindStep=steps;
    bond=1;
    text=name+'は道ばたで小さな落とし物を見つけた！';
   }else text=name+'は何かを探していたが、今日は見つからなかった。';
  }
 }
 return {ok:true,text,progress,bond,friendship:Math.min(255,f+bond),reward};
}
return Object.freeze({MESSAGES,status,normalize,visit});
});
