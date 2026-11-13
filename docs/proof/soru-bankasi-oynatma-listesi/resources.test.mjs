import assert from 'node:assert/strict';
const R=(process.env.ND_ROOT||'/home/claude/netudu/.claude/worktrees/soru-bankasi-oynatma-listesi')+'/lib/plan/';
const S=await import(R+'scheduler.ts');const X=await import(R+'resources.ts');const P=await import(R+'playlist.ts');
const {buildDay,normalizePlanConfig,defaultPlanConfig,addDays,dayKeyOf}=S;
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
const T0='2026-11-02'; // Pazartesi
const ALL=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const book=(o={})=>X.makeResource({kind:'book',name:'345 TYT Matematik',subject:'Matematik',unit:'test',total:40,done:12,perDay:3,days:ALL,...o},'b1');
const LID='PLabcdefghij12345';
const vids=Array.from({length:20},(_,i)=>({id:('v'+String(i).padStart(10,'0')),title:'Ders '+(i+1)}));
const list=(o={})=>X.makeResource({kind:'playlist',name:'Matematik kampı',subject:'Matematik',total:20,done:0,perDay:2,days:ALL,listId:LID,items:vids,...o},'p1');
const mk=(resources,over={})=>({config:{...defaultPlanConfig(T0,'12'),resources,...over},done:{},offDays:{}});
const study=d=>d.items.filter(i=>i.type==='study'),res=d=>d.items.filter(i=>i.type==='resource');

// ---- URL ayrıştırma
await t('URL: playlist, watch+list, youtu.be, m., music., şemasız',()=>{
 assert.deepEqual(X.parsePlaylistUrl('https://www.youtube.com/playlist?list='+LID),{listId:LID});
 assert.deepEqual(X.parsePlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list='+LID),{listId:LID,videoId:'dQw4w9WgXcQ'});
 assert.deepEqual(X.parsePlaylistUrl('https://youtu.be/dQw4w9WgXcQ?list='+LID),{listId:LID,videoId:'dQw4w9WgXcQ'});
 assert.equal(X.parsePlaylistUrl('https://m.youtube.com/playlist?list='+LID).listId,LID);
 assert.equal(X.parsePlaylistUrl('https://music.youtube.com/playlist?list='+LID).listId,LID);
 assert.equal(X.parsePlaylistUrl('  youtube.com/playlist?list='+LID+'  ').listId,LID)});
await t('URL: reddedilenler (alan adı, kimlik, yol, şema, kimlik bilgisi, tür)',()=>{
 for(const bad of ['https://youtube.com.evil.com/playlist?list='+LID,'https://notyoutube.com/playlist?list='+LID,'https://evil.com/?u=youtube.com&list='+LID,
  'https://www.youtube.com/playlist','https://www.youtube.com/playlist?list=short','https://www.youtube.com/playlist?list=PL abc!@#$%^&*()','https://www.youtube.com/playlist?list='+'A'.repeat(65),
  'https://www.youtube.com/channel/x?list='+LID,'javascript:alert(1)','ftp://youtube.com/playlist?list='+LID,'https://user:pw@www.youtube.com/playlist?list='+LID,'','   ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'])assert.equal(X.parsePlaylistUrl(bad),null,bad);
 for(const v of [null,undefined,5,{},[]])assert.equal(X.parsePlaylistUrl(v),null);assert.equal(X.parsePlaylistUrl('https://www.youtube.com/playlist?list='+LID+'&x='+'a'.repeat(400)),null)});
await t('URL: v bozuksa videoId yok ama liste geçerli',()=>{assert.deepEqual(X.parsePlaylistUrl('https://www.youtube.com/watch?v=<x>&list='+LID),{listId:LID})});
await t('devam bağlantısı: videoId varsa v+list, yoksa list+index',()=>{
 assert.equal(X.continueUrl(list(),3),'https://www.youtube.com/watch?v='+vids[2].id+'&list='+LID);
 assert.equal(X.continueUrl(list({items:[]}),7),'https://www.youtube.com/watch?list='+LID+'&index=7');
 assert.equal(X.continueUrl(book(),1),'')});

// ---- bugünkü aralık
await t('bugünkü aralık: Test 13–15, etiket',()=>{const u=X.unitsFor(book(),T0,T0);assert.deepEqual(u.units,[13,14,15]);assert.equal(u.done,false);assert.equal(X.spanLabel(book(),u.units),'Test 13–15')});
await t('aralık toplamı aşmaz; bitince null; sayfa etiketi',()=>{const b=book({done:38});assert.deepEqual(X.unitsFor(b,T0,T0).units,[39,40]);assert.equal(X.unitsFor(book({done:40}),T0,T0),null);
 assert.equal(X.spanLabel(book({unit:'sayfa'}),[41,42,43,44,60]).slice(0,5),'Sayfa');assert.equal(X.spanLabel(book(),[7]),'Test 7')});
await t('geçmiş gün ve seçili olmayan gün: null',()=>{const b=book({days:['Pzt','Çar']});assert.equal(X.unitsFor(b,'2026-11-01',T0),null);assert.equal(X.unitsFor(b,'2026-11-03',T0),null);assert.ok(X.unitsFor(b,'2026-11-04',T0))});
await t('gelecek gün: done + perDay × aradaki seçili gün',()=>{const b=book({days:['Pzt','Çar','Cum']});
 assert.deepEqual(X.unitsFor(b,'2026-11-04',T0).units,[16,17,18]);assert.deepEqual(X.unitsFor(b,'2026-11-06',T0).units,[19,20,21]);assert.deepEqual(X.unitsFor(b,'2026-11-09',T0).units,[22,23,24]);
 assert.deepEqual(X.unitsFor(book(),'2026-11-05',T0).units,[22,23,24])});
await t('gelecek gün: bugün seçili değilse bugünün payı sayılmaz',()=>{const b=book({days:['Sal','Çar']});assert.equal(X.unitsFor(b,T0,T0),null);assert.deepEqual(X.unitsFor(b,'2026-11-03',T0).units,[13,14,15]);assert.deepEqual(X.unitsFor(b,'2026-11-04',T0).units,[16,17,18])});
await t('gelecek: son aralık kısalır, sonrası null',()=>{const b=book({done:36,perDay:3});assert.deepEqual(X.unitsFor(b,'2026-11-03',T0).units,[40]);assert.equal(X.unitsFor(b,'2026-11-04',T0),null)});
await t('selectedBetween == kaba kuvvet',()=>{const sets=[['Pzt'],['Pzt','Çar','Cum'],ALL,['Cmt','Paz'],[]];for(const days of sets)for(let a=0;a<9;a++)for(let len=0;len<40;len++){const from=addDays(T0,a),to=addDays(from,len);let c=0;for(let i=0;i<len;i++)if(days.includes(dayKeyOf(addDays(from,i))))c++;assert.equal(X.selectedBetween(days,from,to),c,days+' '+a+' '+len)}assert.equal(X.selectedBetween(ALL,T0,addDays(T0,-3)),0)});

// ---- "bitirdim" ve bugünün kotasının kaymaması
await t('Bugünkünü bitirdim: done artar, bugünün aralığı aynı kalır ve tamamlandı görünür, yarın sıradaki',()=>{const b=book();const c=X.completeToday(b,T0);assert.equal(c.done,15);
 const u=X.unitsFor(c,T0,T0);assert.deepEqual(u.units,[13,14,15]);assert.equal(u.done,true);assert.deepEqual(X.unitsFor(c,addDays(T0,1),T0).units,[16,17,18]);assert.deepEqual(X.upcoming(c),[16,17,18]);
 assert.equal(X.completeToday(c,T0),c,'ikinci basış değişmez')});
await t('günlük kayıt ertesi gün sıfırlanır',()=>{const c=X.completeToday(book(),T0);assert.deepEqual(X.unitsFor(c,'2026-11-03','2026-11-03').units,[16,17,18])});
await t('−1 düzeltme: kayıttan da düşer, kota aynı',()=>{let c=X.completeToday(book(),T0);c=X.applyProgress(c,{mode:'delta',delta:-1},T0);assert.equal(c.done,14);const u=X.unitsFor(c,T0,T0);assert.deepEqual(u.units,[13,14,15]);assert.equal(u.done,false)});
await t('son kısa aralığı bitirince kaynak biter',()=>{const c=X.completeToday(book({done:38}),T0);assert.equal(c.done,40);assert.ok(X.isFinished(c));assert.deepEqual(X.unitsFor(c,T0,T0).units,[39,40]);assert.equal(X.unitsFor(c,addDays(T0,1),T0),null);assert.equal(X.resumeIndex(c),null)});
await t('Geri al (undo-today): kitapta ve listede bugünkü işi açar (log), yarına dokunmaz',()=>{const c=X.undoToday(X.completeToday(book(),T0),T0);assert.equal(c.done,12);assert.equal(c.log,undefined);assert.equal(X.unitsFor(c,T0,T0).done,false);
 const l=X.undoToday(X.completeToday(list(),T0),T0);assert.deepEqual(l.watched,[]);assert.equal(X.undoToday(book(),T0).done,12);const k=X.undoToday(X.completeToday(X.applyProgress(list(),{mode:'toggle',index:9},T0),T0),T0);assert.deepEqual(k.watched,[],'tur 2: bugün işaretlenen her video (kota dışı dahil) geri alınır')});
await t('oynatma listesi: bugünkünü bitirdim 2 videoyu izlendi yapar',()=>{const c=X.completeToday(list(),T0);assert.deepEqual(c.watched,[1,2]);assert.equal(c.done,2);assert.deepEqual(X.unitsFor(c,T0,T0).units,[1,2]);assert.deepEqual(X.unitsFor(c,addDays(T0,1),T0).units,[3,4])});

// ---- sınırlar
await t('delta ve set sınırları 0..total',()=>{const b=book();assert.equal(X.applyProgress(b,{mode:'delta',delta:999},T0).done,40);assert.equal(X.applyProgress(b,{mode:'delta',delta:-999},T0).done,0);
 assert.equal(X.applyProgress(b,{mode:'set',position:-5},T0).done,0);assert.equal(X.applyProgress(b,{mode:'set',position:5000},T0).done,40);assert.equal(X.applyProgress(b,{mode:'set',position:7.9},T0).done,7);
 const l=list();assert.equal(X.applyProgress(l,{mode:'delta',delta:999},T0).done,20);assert.equal(X.applyProgress(l,{mode:'delta',delta:-9},T0).done,0);assert.equal(X.applyProgress(l,{mode:'set',position:99},T0).watched.length,20)});
await t('set konum: günlük kaydı sıfırlar (konum belirleme ≠ bugünün işi)',()=>{const c=X.applyProgress(X.completeToday(book(),T0),{mode:'set',position:30},T0);assert.equal(c.log,undefined);assert.deepEqual(X.unitsFor(c,T0,T0).units,[31,32,33])});
await t('toggle yalnız listede; sınır dışı hata',()=>{assert.throws(()=>X.applyProgress(book(),{mode:'toggle',index:1},T0));assert.throws(()=>X.applyProgress(list(),{mode:'toggle',index:21},T0));assert.throws(()=>X.applyProgress(list(),{mode:'toggle',index:0},T0))});
await t('watched → kaldığın yer (sırasız işaret)',()=>{let l=list();for(const i of [1,2,4])l=X.applyProgress(l,{mode:'toggle',index:i},T0);assert.deepEqual(l.watched,[1,2,4]);assert.equal(l.done,3);assert.equal(X.resumeIndex(l),3);assert.deepEqual(X.upcoming(l,3),[3,5,6]);
 l=X.applyProgress(l,{mode:'toggle',index:2},T0);assert.deepEqual(l.watched,[1,4]);assert.equal(X.resumeIndex(l),2);assert.equal(X.spanLabel(l,[2,3,5,6,8]),'Video 2, 3, 5 +2')});
await t('liste −1: en yüksek izlenen geri alınır',()=>{let l=X.applyProgress(list(),{mode:'set',position:5},T0);l=X.applyProgress(l,{mode:'delta',delta:-2},T0);assert.deepEqual(l.watched,[1,2,3])});
await t('yüzde ve sayaç',()=>{assert.equal(X.percentOf(book()),30);assert.equal(X.percentOf(X.applyProgress(list(),{mode:'set',position:5},T0)),25)});

// ---- bitiş tahmini (kaba kuvvet)
await t('bitiş tahmini == gün gün simülasyon',()=>{const sets=[ALL,['Pzt','Çar','Cum'],['Cmt'],['Cmt','Paz']];
 for(const days of sets)for(const per of [1,3,7])for(const done of [0,12,39,40])for(const off of [0,1,2,3,4,5,6]){const today=addDays(T0,off);const b=book({days,perDay:per,done});const left=40-done;const est=X.finishEstimate(b,today);
  if(left<=0){assert.equal(est.finished,true);continue}
  let d=today,slots=Math.ceil(left/per);const u=X.unitsFor(b,today,today);if(u&&u.done)d=addDays(today,1);let got=null;for(let g=0;g<4000;g++){if(days.includes(dayKeyOf(d))){slots--;if(slots===0){got=d;break}}d=addDays(d,1)}
  assert.equal(est.date,got,JSON.stringify({days,per,done,off}))}});
await t('bitiş tahmini: bugünkü işi yapıldıysa yarından sayılır; seçili gün yoksa null',()=>{const b=book({done:37,perDay:3,days:['Pzt','Sal']});assert.equal(X.finishEstimate(b,T0).date,T0);assert.equal(X.finishEstimate(X.completeToday(b,T0),T0).finished,true);
 assert.equal(X.finishEstimate({...book(),days:[]},T0).date,null)});

// ---- normalleştirme
await t('normalizeResources: eski kayıt / çöp girdi',()=>{assert.deepEqual(X.normalizeResources(undefined),[]);assert.deepEqual(X.normalizeResources('x'),[]);assert.deepEqual(X.normalizeResources([null,5,'a',{},{kind:'book'},{kind:'book',name:'a',total:0},{kind:'x',name:'a',total:3}]),[]);
 const c=normalizePlanConfig({school:{enabled:false}},T0);assert.deepEqual(c.resources,[]);assert.deepEqual(normalizePlanConfig(defaultPlanConfig(T0)).resources,[])});
await t('normalizeResources: sınırlama ve tutarlılık',()=>{const [a]=X.normalizeResources([{kind:'book',name:'  K  ',total:99999,done:99999,perDay:0,minPerUnit:'x',days:[],unit:'zzz',log:{date:'2026-11-02',units:[1,2,99999]}}]);
 assert.equal(a.total,2000);assert.equal(a.done,2000);assert.equal(a.perDay,1);assert.equal(a.minPerUnit,25);assert.deepEqual(a.days,ALL);assert.equal(a.unit,'test');assert.equal(a.name,'K');assert.deepEqual(a.log.units,[1,2]);
 const many=Array.from({length:50},(_,i)=>({kind:'book',name:'k'+i,total:5}));assert.equal(X.normalizeResources(many).length,30);
 const ids=X.normalizeResources([{id:'a',kind:'book',name:'x',total:3},{id:'a',kind:'book',name:'y',total:3}]).map(r=>r.id);assert.equal(new Set(ids).size,2)});
await t('normalizeResources: oynatma listesi (listId zorunlu, done=watched, öğeler ≤300)',()=>{assert.deepEqual(X.normalizeResources([{kind:'playlist',name:'p',total:5}]),[]);assert.deepEqual(X.normalizeResources([{kind:'playlist',name:'p',total:5,listId:'../x'}]),[]);
 const [p]=X.normalizeResources([{kind:'playlist',name:'p',total:5,listId:LID,done:4,watched:[3,1,1,9,2],items:[{id:'bad',title:'x'},...Array.from({length:400},(_,i)=>({id:'v'+String(i).padStart(10,'0'),title:'t'.repeat(500)}))]}]);
 assert.deepEqual(p.watched,[1,2,3]);assert.equal(p.done,3);assert.equal(p.items.length,300);assert.equal(p.items[0].title.length,200);assert.equal(p.unit,'video')});
await t('makeResource: başlangıç noktası ve varsayılan süreler',()=>{assert.equal(book().minPerUnit,25);assert.equal(book({unit:'sayfa',minPerUnit:undefined}).minPerUnit,6);assert.equal(list().minPerUnit,40);assert.deepEqual(list({done:3}).watched,[1,2,3]);assert.equal(book({done:99}).done,40)});

// ---- buildDay entegrasyonu
await t('kaynaksız: öğe ve ders bloğu değişmez',()=>{const a=buildDay(mk([]),T0,T0),b=buildDay({config:{...defaultPlanConfig(T0,'12')},done:{},offDays:{}},T0,T0);assert.deepEqual(a.items,b.items);assert.equal(res(a).length,0);assert.deepEqual(a.resources,[])});
await t('kaynaklı: ders blokları aynen korunur, kaynak blokları eklenir ve çakışmaz',()=>{const base=buildDay(mk([]),T0,T0);const d=buildDay(mk([book(),list()]),T0,T0);
 assert.deepEqual(study(d),study(base));assert.equal(res(d).length,2);const school=d.items.find(i=>i.type==='school');
 const all=d.items.filter(i=>i.type!=='off').sort((a,b)=>a.startMin-b.startMin);for(let i=1;i<all.length;i++)assert.ok(all[i].startMin>=all[i-1].endMin,`çakışma: ${all[i-1].title} / ${all[i].title}`);
 for(const r of res(d)){assert.ok(r.startMin>=school.endMin,'okuldan önce');assert.equal(r.type,'resource')}
 const rb=res(d)[0];assert.equal(rb.tag,'Soru bankası');assert.equal(rb.title,'Soru bankası: 345 TYT Matematik — Test 13–15');assert.equal(rb.endMin-rb.startMin,75);
 const rp=res(d)[1];assert.equal(rp.tag,'Video');assert.equal(rp.title,'Oynatma listesi: Matematik kampı — Video 1–2');assert.equal(rp.endMin-rp.startMin,80);assert.equal(d.resources.length,2)});
await t('süre alt/üst sınırı 15..240',()=>{assert.equal(X.taskMinutes(book({minPerUnit:1,perDay:1}),1),15);assert.equal(X.taskMinutes(book({minPerUnit:600}),3),240);assert.equal(X.taskMinutes(book(),3),75)});
await t('gelecek gün: kalan iş tahmini; geçmiş gün: kaynak yok; seçili olmayan gün: yok',()=>{const p=mk([book({days:['Pzt','Çar','Cum']})]);assert.ok(res(buildDay(p,'2026-11-04',T0))[0].title.endsWith('Test 16–18'));assert.equal(res(buildDay(p,'2026-11-01',T0)).length,0);assert.equal(res(buildDay(p,'2026-11-03',T0)).length,0)});
await t('hafta sonu (okul yok): sabaha yerleşir; okul günü akşama',()=>{const p=mk([book()]);const sat=buildDay(p,'2026-11-07',T0);assert.ok(res(sat)[0].startMin>=study(sat)[study(sat).length-1].endMin,'ders bloklarından sonra');assert.ok(res(sat)[0].startMin<16*60,'okul olmadığı için akşama itilmez' );const mon=buildDay(p,T0,T0);assert.ok(res(mon)[0].startMin>=16*60)});
await t('dinlenme günü (kaydırılmış): kaynak yok',()=>{const p=mk([book()]);p.offDays={'0':{date:T0,topic:'x'}};const d=buildDay(p,T0,T0);assert.equal(res(d).length,0);assert.ok(d.isOff)});
await t('program başlamadan önceki bugün: kaynak yine görünür (kaynak sayacı takvimden bağımsız)',()=>{const p=mk([book()],{startDate:'2026-12-01'});assert.equal(res(buildDay(p,T0,T0)).length,1);assert.equal(study(buildDay(p,T0,T0)).length,0)});
await t('program bittikten sonra: kaynak görünür',()=>{const p=mk([book()],{startDate:'2025-01-01'});const d=buildDay(p,T0,T0);assert.equal(res(d).length,1);assert.equal(d.finished,true)});
await t('bitmiş kaynak: bugünün (tamamlanan) bloğu görünür, ertesi gün yok',()=>{const c=X.completeToday(book({done:38}),T0);const p=mk([c]);assert.equal(res(buildDay(p,T0,T0)).length,1);assert.match(res(buildDay(p,T0,T0))[0].detail,/tamamlandı/);assert.equal(res(buildDay(p,addDays(T0,1),T0)).length,0)});
await t('gün çok doluyken çökmez, uyarı verir, sonlu zamanlar',()=>{const p=mk([book({perDay:20,minPerUnit:60}),list({perDay:5,minPerUnit:60})],{fixedBlocks:[{id:'f',title:'Her şey',days:['Pzt'],start:'08:00',end:'23:00'}]});const d=buildDay(p,T0,T0);assert.equal(d.resources.length,2);assert.ok(d.warnings.some(w=>w.includes('kaynak blokları')));for(const i of d.items){assert.ok(Number.isFinite(i.startMin)&&i.startMin>=0&&i.endMin<=1440)}});
await t('bozuk kaynak verisi buildDay\'i çökertmez',()=>{const p={config:{...defaultPlanConfig(T0),resources:[{kind:'book',name:'x',total:'a'},{kind:'playlist',name:'y',total:3,listId:'x'},{kind:'book',name:'ok',total:10,perDay:2}]},done:{},offDays:{}};const d=buildDay(p,T0,T0);assert.equal(res(d).length,1)});
await t('haftalık/aylık: 60 gün boyunca çakışma yok ve tüm kaynaklar sonlu',()=>{const p=mk([book(),list(),book({id:'x',name:'Fizik',unit:'sayfa',total:300,done:40,perDay:20,minPerUnit:6})]);for(let i=0;i<60;i++){const d=buildDay(p,addDays(T0,i),T0);const all=d.items.filter(x=>x.type!=='off').sort((a,b)=>a.startMin-b.startMin);for(let j=1;j<all.length;j++)if(d.warnings.every(w=>!w.includes('Gün çok dolu')))assert.ok(all[j].startMin>=all[j-1].endMin,i+' '+all[j-1].title+' | '+all[j].title)}});

// ---- oynatma listesi API eşlemesi (sahte fetch)
const page=(ids,next,total)=>({ok:true,status:200,json:async()=>({items:ids.map(id=>({snippet:{title:'T '+id,resourceId:{videoId:id}}})),...(next?{nextPageToken:next}:{}),pageInfo:{totalResults:total}})});
await t('loadPlaylist: sayfalama, 300 sınırı, toplam',async()=>{const mkid=i=>'a'+String(i).padStart(10,'0');let calls=[];const f=async(u)=>{calls.push(u);const tok=new URL(u).searchParams.get('pageToken');const pg=tok?Number(tok):0;return page(Array.from({length:50},(_,i)=>mkid(pg*50+i)),String(pg+1),420)};
 const r=await P.loadPlaylist(LID,'KEY',f);assert.equal(r.items.length,300);assert.equal(r.total,420);assert.equal(calls.length,6);assert.ok(calls[0].includes('playlistId='+LID));assert.equal(r.items[0].title,'T a0000000000')});
await t('loadPlaylist: tek sayfa; geçersiz videoId atlanır; hatalar Türkçe',async()=>{const r=await P.loadPlaylist(LID,'K',async()=>page(['abcdefghijk','zz'],'',2));assert.equal(r.items.length,1);assert.equal(r.total,2);
 await assert.rejects(P.loadPlaylist(LID,'K',async()=>({ok:false,status:404})),e=>e.status===404&&/bulunamadı/.test(e.message));await assert.rejects(P.loadPlaylist(LID,'K',async()=>({ok:false,status:403})),e=>/elle/.test(e.message)&&!/K\b/.test(e.message.replace(/Klan|Kab/g,'')));
 await assert.rejects(P.loadPlaylist(LID,'K',async()=>{throw new Error('net')}),e=>e.status===502);await assert.rejects(P.loadPlaylist('x','K',async()=>page([])),e=>e.status===400);await assert.rejects(P.loadPlaylist(LID,'K',async()=>page([],'',0)),e=>e.status===404)});
// ---- tur 2: geri al, dinlenme günü, dolu gün, başlık sınırı
await t('geri al: kota üstü +1 sonrası bugünün tüm log birimlerini geri alır (16→12), log sıfırlanır',()=>{let b=X.completeToday(book(),T0);b=X.applyProgress(b,{mode:'delta',delta:1},T0);assert.equal(b.done,16);const u=X.undoToday(b,T0);assert.equal(u.done,12);assert.equal(u.log,undefined);assert.deepEqual(X.unitsFor(u,T0,T0).units,[13,14,15]);assert.equal(X.unitsFor(u,T0,T0).done,false)});
await t('geri al: listede kota üstü işaretli videolar da kalkar; log yoksa değişmez',()=>{let l=X.completeToday(list(),T0);l=X.applyProgress(l,{mode:'toggle',index:9},T0);assert.deepEqual(l.watched,[1,2,9]);const u=X.undoToday(l,T0);assert.deepEqual(u.watched,[]);assert.equal(u.done,0);assert.equal(u.log,undefined);
 const b=book();assert.equal(X.undoToday(b,T0),b);const s=X.applyProgress(X.completeToday(book(),T0),{mode:'set',position:30},T0);assert.equal(X.undoToday(s,T0),s)});
await t('dinlenme günü: bugünün kotası 0; gelecek tahmin bugünün kotasını tamamlanmış saymaz',()=>{const b=book();assert.equal(X.unitsFor(b,T0,T0,true),null);const tm=addDays(T0,1);
 assert.deepEqual(X.unitsFor(b,tm,T0,false).units,[16,17,18]);assert.deepEqual(X.unitsFor(b,tm,T0,true).units,[13,14,15]);assert.deepEqual(X.resourceTasksForDay([b],T0,T0,true),[]);assert.equal(X.resourceTasksForDay([b],tm,T0,true)[0].label,'Test 13–15');
 const e0=X.finishEstimate(b,T0),e1=X.finishEstimate(b,T0,true);assert.equal(e1.date,addDays(e0.date,1))});
await t('buildDay: bugün dinlenme günüyse yarının payı bugünün kotası olur (tutarlı)',()=>{const p=mk([book()]);p.offDays={'0':{date:T0,topic:'x'}};const t0=buildDay(p,T0,T0);assert.equal(res(t0).length,0);assert.equal(t0.resources.length,0);
 const t1=buildDay(p,addDays(T0,1),T0);assert.ok(res(t1)[0].title.endsWith('Test 13–15'),res(t1)[0]?.title)});
await t('çok dolu gün: sığmayan ve 15 dk altı kaynak bloğu çizelgeye girmez, görev listesinde "boş saat yok" notuyla kalır',()=>{
 const p=mk([book({perDay:20,minPerUnit:60}),list({perDay:5,minPerUnit:60})],{fixedBlocks:[{id:'f',title:'Her şey',days:['Pzt'],start:'08:00',end:'23:55'}]});const d=buildDay(p,T0,T0);
 assert.equal(d.resources.length,2);for(const i of res(d))assert.ok(i.fitted||i.endMin-i.startMin>=15,i.title+' '+(i.endMin-i.startMin));
 const dropped=d.resources.filter(r=>!res(d).some(i=>i.title.includes(r.name)));assert.ok(dropped.length>0,'en az bir blok elenmeli');for(const r of dropped){assert.equal(r.start,undefined);assert.match(r.note,/boş saat yok/i)}
 assert.ok(d.warnings.some(w=>w.includes('kaynak blokları')))});
await t('rahat gün: hiçbir kaynak notu/eleme yok',()=>{const d=buildDay(mk([book(),list()]),'2026-11-07',T0);assert.equal(res(d).length,2);for(const r of d.resources)assert.equal(r.note,undefined)});
await t('toplam başlık sınırı: tüm kaynaklarda en çok 1500 öğe (normalize ilk gelenleri tutar)',()=>{assert.equal(X.LIMITS.itemsTotal,1500);const mkp=(i)=>({kind:'playlist',name:'p'+i,total:300,listId:LID,items:Array.from({length:300},(_,k)=>({id:'v'+String(k).padStart(10,'0'),title:'t'}))});
 const out=X.normalizeResources(Array.from({length:7},(_,i)=>mkp(i)));assert.equal(out.length,7);assert.equal(X.itemsTotal(out),1500);assert.equal(out[5].items.length,0);assert.equal(out[4].items.length,300);assert.equal(X.itemsTotal([]),0)});
console.log(`\n${n} test geçti`+(process.exitCode?' — BAŞARISIZ VAR':''));
