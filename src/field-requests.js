/* ASTRA TALES — optional village and regional research requests.
 * Independent, deterministic and save-compatible: no clock or gameplay mutation.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.AstraFieldRequests=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const REQUESTS=Object.freeze([
 {id:'flower',map:'village',npc:'花の世話人',title:'夜の花の便り',
  intro:'遠くの森には、夕暮れにだけ光る花があると聞いたの。咲く姿を見たら、どうか教えて。',
  objective:'月影の森で、時間帯によって変わる花を調べよう。',
  waiting:'あの花にはもう会えたかな？ 日が傾くころに森を歩いてみて。',
  ready:'月光の花を見つけたのね！ 本当に星の光を宿す花があるなんて。',
  after:['花のことを聞けて嬉しい。旅のお土産にした薬草、大切に使ってね。','あの花のお話は、町のみんなにも伝えるわ。ありがとう！'],
  choices:[{id:'supply',text:'☘ げんき草 ×2',item:'herb',count:2},{id:'coins',text:'✦ おこづかい 180G',money:180}]},
 {id:'forest',map:'forest',npc:'森の薬草師',title:'森の記憶の調査',
  intro:'この森に眠る古い石の記録を確かめたいんだ。もし光が戻ったら、ぜひ知らせておくれ。',
  objective:'月影の森の記憶石を調べ、森の変化を確かめよう。',
  waiting:'石の印にはきっと順番がある。あわてず、森の気配を感じてみて。',
  ready:'記憶石がつながり、蔦の道まで開いたのか！ これは貴重な記録だね。',
  after:['あの森の変化を忘れないでおくれ。私の薬も役立つはずさ。','これで森に訪れる調査員も助かるだろう。ありがとう。'],
  choices:[{id:'supply',text:'◆ PP回復 ×2',item:'ether',count:2},{id:'coins',text:'✚ キズぐすり ×3',item:'potion',count:3}]},
 {id:'lake',map:'lake',npc:'湖の散歩人',title:'小島の忘れ物',
  intro:'湖の水位が変わると、昔の小道が現れるって聞いたんだ。小島に何があるのか、確かめてみたい。',
  objective:'青凪の湖畔の仕掛けを調べ、現れた道の先へ進もう。',
  waiting:'湖の南側を散歩すると、少し変わった古い道具が見つかるかもね。',
  ready:'本当に小島まで行けたのか！ 水の下にそんな石箱が隠れていたなんて。',
  after:['新しい道の話を聞いて、湖がもっと好きになったよ。','あの小島はこれからも大切に守っていきたいね。'],
  choices:[{id:'supply',text:'◉ 星玉 ×4',item:'orb',count:4},{id:'coins',text:'✦ おこづかい 320G',money:320}]},
 {id:'highland',map:'highland',npc:'山の旅人',title:'高原に結ぶ星座',
  intro:'この高原には、鏡で星の光をつなぐ古い仕組みがあるらしい。完成した景色を教えてくれないか？',
  objective:'星見の高原で星図を手掛かりに、3つの星鏡を調べよう。',
  waiting:'あの星図、見るたびに気になるよ。鏡の向きを合わせれば何か起こるかもしれない。',
  ready:'空に星座が現れたって？ すごいな。君とこの旅の話ができてよかった。',
  after:['また星が綺麗な日に、この高原で会おう。','旅のお金が君の次の冒険の助けになれば嬉しいよ。'],
  choices:[{id:'supply',text:'◇ 速さのお守り ×1',item:'speedCharm',count:1},{id:'coins',text:'✦ おこづかい 500G',money:500}]}
]);
const BY_ID=new Map(REQUESTS.map(r=>[r.id,r]));
function states(raw){
 const data=raw&&typeof raw==='object'?raw:{},result={};
 for(const r of REQUESTS){
  const x=data[r.id]&&typeof data[r.id]==='object'?data[r.id]:{};
  const choice=r.choices.some(c=>c.id===x.choice)?x.choice:null;
  result[r.id]={accepted:!!(x.accepted||x.claimed),claimed:!!x.claimed,choice:!!x.claimed?choice:null};
 }
 return result;
}
function evidence(id,save){
 const ev=save?.events||{},r=ev.regionPuzzles||{},f=ev.forestSecrets||{};
 switch(id){
  case 'flower':return !!f.bloomClaimed;
  case 'forest':return !!f.gateOpen;
  case 'lake':return !!r.lake?.lowered&&!!r.lake?.cacheTaken;
  case 'highland':return !!r.highland?.solved;
  default:return false;
 }
}
function entry(id,save){
 const req=BY_ID.get(id);if(!req)return null;
 const record=states(save?.events?.fieldRequests)[id];
 const unlocked=(save?.story?.stage??12)>=12;
 const visited=!!save?.visited?.[req.map];
 const ready=evidence(id,save);
 const status=!unlocked?'locked':!visited?'unvisited':record.claimed?'complete':
  !record.accepted?'available':ready?'ready':'active';
 return {...req,accepted:record.accepted,claimed:record.claimed,choice:record.choice,ready,status,
  statusText:{locked:'準備中',unvisited:'未訪問',complete:'達成済み',available:'相談できる',ready:'報告できる',active:'調査中'}[status]};
}
function summary(save){return REQUESTS.map(r=>entry(r.id,save))}
function accept(id,save){
 const r=entry(id,save);
 if(!r||!['available','active','ready'].includes(r.status))return {ok:false,progress:states(save?.events?.fieldRequests)};
 const progress=states(save?.events?.fieldRequests);
 progress[id].accepted=true;
 return {ok:true,progress};
}
function claim(id,save,choice){
 const r=entry(id,save),progress=states(save?.events?.fieldRequests);
 if(!r||r.status!=='ready')return {ok:false,progress,reward:null};
 const selected=r.choices.find(c=>c.id===choice);
 if(!selected)return {ok:false,progress,reward:null};
 progress[id]={accepted:true,claimed:true,choice};
 return {ok:true,progress,reward:{item:selected.item||null,count:selected.count||0,money:selected.money||0},
  text:r.ready+'\nお礼に '+selected.text.replace(/^[^ ]+ /,'')+' を受け取った！'};
}
function afterText(id,save){
 const r=entry(id,save);if(!r||!r.claimed)return null;
 return r.after[r.choice==='coins'?1:0];
}
return Object.freeze({REQUESTS,states,evidence,entry,summary,accept,claim,afterText});
});
