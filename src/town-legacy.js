/* ASTRA TALES — evolving village and linked citizen story.
 * Progress derives from actual completed field reports. Only the archivist
 * acceptance / final hand-in is stored, so old saves remain compatible.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraTownLegacy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REPORTS=['flower','forest','lake','highland'];
const MILESTONES=Object.freeze([
 '静かな町','花と調査札','旅の掲示板','星の灯り','星の記録祭','星の記録が完成した町'
]);
function normalize(raw){
 const r=raw&&typeof raw==='object'?raw:{};
 return {accepted:!!(r.accepted||r.claimed),claimed:!!r.claimed};
}
function snapshot(save){
 const events=save?.events||{},requests=events.fieldRequests||{},legacy=normalize(events.townLegacy);
 const finished=REPORTS.filter(id=>requests[id]?.claimed);
 const count=finished.length,unlocked=(save?.story?.stage??12)>=12;
 const status=!unlocked?'locked':legacy.claimed?'complete':
  count<2&&!legacy.accepted?'hidden':!legacy.accepted?'available':
  count>=4?'ready':'active';
 const visible=unlocked&&count>=2;
 const tier=unlocked?Math.min(5,count+(legacy.claimed?1:0)):0;
 return {count,total:REPORTS.length,finished,missing:REPORTS.filter(id=>!finished.includes(id)),
  unlocked,visible,tier,tierName:MILESTONES[tier],accepted:legacy.accepted,claimed:legacy.claimed,
  status,statusText:{locked:'旅の準備中',hidden:'まだ見ぬ物語',available:'新しい調査',active:'資料を集めよう',ready:'報告できる',complete:'調査完了'}[status]};
}
function accept(save){
 const p=snapshot(save),state=normalize(save?.events?.townLegacy);
 if(p.status!=='available')return {ok:false,progress:state};
 return {ok:true,progress:{accepted:true,claimed:false}};
}
function complete(save){
 const p=snapshot(save),state=normalize(save?.events?.townLegacy);
 if(p.status!=='ready')return {ok:false,progress:state,reward:null};
 return {ok:true,progress:{accepted:true,claimed:true},
  reward:{item:'guardCharm',count:1,money:600},
  text:'4つの土地の記録がひとつにつながった！\n町の星の記録祭が完成した。\n守りのお守りと600Gを受け取った！'};
}
function archivistText(save){
 const p=snapshot(save);
 switch(p.status){
  case 'locked':return '旅の始まりを見守る町の記録係。';
  case 'hidden':return '広場で新しい記録が生まれるのを待っている。';
  case 'available':return '森や湖の調査が届き始めたよ。4つの地域を結ぶ星の記録を完成させない？';
  case 'active':return '記録が '+p.count+'/4 集まったよ。各地の調査を終えたら、また広場へ持ってきてね。';
  case 'ready':return '4つの記録がそろった！ 一緒に町の星の記録祭を完成させよう！';
  default:return '旅の思い出が町の灯りになったね。あなたがまた帰ってくるのを待っているよ。';
 }
}
function citizenText(key,save){
 const p=snapshot(save);
 if(!p.unlocked||p.count===0)return null;
 if(key==='traveler'){
  if(p.claimed)return 'この町の星の記録祭を見た？ 旅人が持ち帰った物語がいっぱいだよ。';
  if(p.count>=3)return '広場に星の灯りが増えてきたね。各地の調査が町にも届いているんだ。';
  return '広場に小さな調査札が増えたね。旅で見つけたことが町に伝わっているんだ。';
 }
 if(key==='sign'){
  return p.count>=4?'ミナモリの町 ー 星の記録祭の町／北：そよかぜの小道':
   'ミナモリの町 ー 旅人の調査記録が集まる広場／北：そよかぜの小道';
 }
 if(key==='flower'&&p.count>=3)return 'あなたの便りのおかげで、広場に星の花飾りが増えたのよ。';
 return null;
}
return Object.freeze({REPORTS,MILESTONES,normalize,snapshot,accept,complete,archivistText,citizenText});
});
