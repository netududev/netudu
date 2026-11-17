import assert from 'node:assert/strict';
const R=new URL('../lib/',import.meta.url).href;
const Q=await import(R+'swipe/queue.ts');const SS=await import(R+'swipe/session.ts');const S=await import(R+'study.ts');
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
const TODAY='2026-11-16';
const q=(id,o={})=>({id,exam:'D',exam_type:'TYT',date:'2026-11-01',subject:'Matematik',topic:'Türev',question:'',my_answer:'',answer_key:'B',image_key:null,analysis:null,reviewed:0,created_at:'',mistake_type:'yanlış',review_stage:1,next_review:TODAY,review_log:[],...o});
const ids=l=>l.map(x=>x.id);
const opts={subject:'Tüm dersler',scope:'all',includeLearned:false};
const sess=(queue,current='cur',tiers={cur:'A'})=>({...SS.newSession({day:TODAY,subject:'Tüm dersler',scope:'all',includeLearned:false,queue,tiers}),current});

// Havuz
await t('havuz: tanınmayan dışarıda; öğrenilen yalnız includeLearned ile',()=>{
  const un=q('un',{topic:'Konu belirlenmedi',analysis:{classification:{needsReview:true}}});const learned=q('l',{review_stage:6,next_review:null});const ok=q('ok');
  assert.deepEqual(ids(Q.buildPool([un,learned,ok],TODAY,opts)),['ok']);
  assert.deepEqual(ids(Q.buildPool([un,learned,ok],TODAY,{...opts,includeLearned:true})),['ok','l']);
  assert.ok(S.reviewIntervals.length===6)});
await t('havuz: ders filtresi matchesSubject ile aynı sonucu verir',()=>{
  const rows=[q('m1'),q('f1',{subject:'Fizik'}),q('m2',{topic:'Limit'}),q('un',{topic:'Konu belirlenmedi',analysis:{classification:{needsReview:true}}})];
  for(const f of ['Matematik','Fizik','Tüm dersler','Kontrol bekleyenler'])assert.deepEqual(ids(Q.buildPool(rows,TODAY,{...opts,subject:f})).sort(),rows.filter(r=>S.matchesSubject(r,f)&&!S.isUnrecognized(r)).map(r=>r.id).sort(),f)});
await t('havuz: kapsam due yalnız A; all A+B',()=>{
  const rows=[q('a'),q('b',{next_review:'2026-11-20'})];
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,{...opts,scope:'due'})),['a']);
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,opts)),['a','b'])});
// Katman
await t('katman: vade bugün, dün → A; yarın → B; next_review boş → A; aşama 6 → C',()=>{
  assert.equal(Q.tierOf(q('x',{next_review:TODAY}),TODAY),'A');assert.equal(Q.tierOf(q('x',{next_review:'2026-11-15'}),TODAY),'A');
  assert.equal(Q.tierOf(q('x',{next_review:'2026-11-17'}),TODAY),'B');assert.equal(Q.tierOf(q('x',{next_review:null,review_stage:0}),TODAY),'A');
  assert.equal(Q.tierOf(q('x',{review_stage:6,next_review:null}),TODAY),'C');assert.equal(Q.tierOf(q('x',{review_stage:6,next_review:'2020-01-01'}),TODAY),'C')});
// Sıra
await t('sıra A: en eski vade önce (boş vade en eski), eşitlikte düşük aşama; aynı veri aynı sıra',()=>{
  const rows=[q('a',{next_review:'2026-11-10',review_stage:2}),q('b',{next_review:'2026-11-10',review_stage:1}),q('c',{next_review:'2026-11-05',review_stage:3}),q('d',{next_review:null,review_stage:0})];
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,opts)),['d','c','b','a']);assert.deepEqual(ids(Q.buildPool([...rows].reverse(),TODAY,opts)),['d','c','b','a'])});
await t('sıra B: en yakın vade önce; eşitlikte topicHistory sayısı fazla olan önce',()=>{
  const rows=[q('b1',{next_review:'2026-11-20',topic:'Limit'}),q('b2',{next_review:'2026-11-18',topic:'Limit'}),q('b3',{next_review:'2026-11-18',topic:'Türev'}),q('h1',{next_review:'2026-11-25',topic:'Türev'}),q('h2',{next_review:'2026-11-26',topic:'Türev'})];
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,opts)).slice(0,3),['b3','b2','b1'])});
await t('sıra C: en eski son tekrar önce',()=>{
  const L=d=>[{date:d,result:'doğru'}];const rows=[q('c1',{review_stage:6,next_review:null,review_log:L('2026-10-01')}),q('c2',{review_stage:6,next_review:null,review_log:[...L('2026-08-01'),...L('2026-10-20')]}),q('c3',{review_stage:6,next_review:null,review_log:L('2026-09-01')})];
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,{...opts,includeLearned:true})),['c3','c1','c2'])});
await t('sıra: A, B, C katman sırasıyla',()=>{
  const rows=[q('c',{review_stage:6,next_review:null}),q('b',{next_review:'2026-11-20'}),q('a')];
  assert.deepEqual(ids(Q.buildPool(rows,TODAY,{...opts,includeLearned:true})),['a','b','c'])});
// Karıştırma
await t('karıştırma: son iki karttaki konulardan farklı ilk soru; ilk 5 ile sınırlı; deterministik',()=>{
  const T=['Matematik|Türev','Matematik|Limit'];
  const a=[q('1'),q('2',{topic:'Limit'}),q('3',{topic:'İntegral'}),q('4')];assert.equal(Q.pickNext(a,T,{}).id,'3');assert.equal(Q.pickNext(a,T,{}).id,'3');
  const far=[q('1'),q('2'),q('3'),q('4'),q('5'),q('6',{topic:'İntegral'})];assert.equal(Q.pickNext(far,['Matematik|Türev'],{}).id,'1','6. soru pencere dışı');
  assert.equal(Q.pickNext(far.slice(0,5),['Matematik|Türev','Matematik|Türev'],{}).id,'1','hepsi aynı konu: takılmaz');
  assert.equal(Q.pickNext([],[],{}),null)});
await t('karıştırma: yalnız baş katmanın sorularına bakar',()=>{
  const queue=[q('a'),q('b',{topic:'Limit',next_review:'2026-11-20'})];assert.equal(Q.pickNext(queue,['Matematik|Türev'],{a:'A',b:'B'}).id,'a')});
await t('advance: sıradakini seçer, kuyruktan çıkarır, geçmişe yazar; silinmiş soru atlanır',()=>{
  const rows=[q('1'),q('2',{topic:'Limit'}),q('3')];const by=new Map(rows.map(r=>[r.id,r]));
  let s=SS.newSession({day:TODAY,subject:'Tüm dersler',scope:'all',includeLearned:false,queue:['1','gone','2','3']});
  s=Q.advance(s,by);assert.equal(s.current,'1');assert.deepEqual(s.queue,['2','3']);
  s=Q.advance(s,by);assert.equal(s.current,'2');assert.deepEqual(s.history,['1','2']);assert.deepEqual(s.queue,['3']);
  assert.equal(Q.advance(Q.advance(s,by),by).current,null)});
// Yeniden çıkma
const L=n=>Array.from({length:n},(_,i)=>'q'+i);
await t('yeniden çıkma: Bilemedim → 4 kart sonra; ikinci → 8 kart sonra; üçüncü → düşer, çalışılacaklara',()=>{
  const card=q('cur');let r=Q.applyResult(sess(L(10)),card,'bilemedim');assert.equal(r.session.queue.indexOf('cur'),4);
  let s=r.session;s={...s,queue:s.queue.filter(x=>x!=='cur')};r=Q.applyResult({...s,queue:L(10)},card,'bilemedim');assert.equal(r.session.queue.indexOf('cur'),8);
  r=Q.applyResult({...r.session,queue:L(10)},card,'bilemedim');assert.ok(!r.session.queue.includes('cur'));assert.deepEqual(r.session.struggle,['cur'])});
await t('yeniden çıkma: kuyrukta 4 kart yoksa sona; kısa kuyrukta ikinci de sona',()=>{
  const card=q('cur');assert.deepEqual(Q.applyResult(sess(L(2)),card,'bilemedim').session.queue,['q0','q1','cur']);
  assert.deepEqual(Q.applyResult(sess([]),card,'bilemedim').session.queue,['cur'])});
await t('yeniden çıkma: Atlandı sona bir kez; ikincide düşer; sonuç/yazma yok',()=>{
  const card=q('cur');let r=Q.applyResult(sess(L(6)),card,'atlandi');assert.equal(r.session.queue.at(-1),'cur');assert.equal(r.write,null);assert.equal(r.session.pending.length,0);
  r=Q.applyResult({...r.session,queue:L(3)},card,'atlandi');assert.ok(!r.session.queue.includes('cur'));assert.equal(Q.summary(r.session,[card],TODAY).atlandi,1)});
// Yazma kuralı
await t('yazma kuralı: A iki sonucu da; B ve C yalnız Bilemedim',()=>{
  assert.equal(Q.shouldWrite('A','bildim'),'doğru');assert.equal(Q.shouldWrite('A','bilemedim'),'yanlış');
  for(const k of ['B','C']){assert.equal(Q.shouldWrite(k,'bildim'),null);assert.equal(Q.shouldWrite(k,'bilemedim'),'yanlış')}
  assert.equal(Q.shouldWrite('A','atlandi'),null)});
await t('yazma kuralı: applyResult katmana göre bekleyen yazma üretir',()=>{
  const a=Q.applyResult(sess([]),q('cur'),'bildim');assert.deepEqual(a.write,{id:'cur',review:'doğru',tries:0});assert.deepEqual(a.session.pending,[a.write]);
  const b=Q.applyResult(sess([],'cur',{cur:'B'}),q('cur',{next_review:'2026-11-20'}),'bildim');assert.equal(b.write,null);assert.equal(b.session.pending.length,0);
  const c=Q.applyResult(sess([],'cur',{cur:'B'}),q('cur',{next_review:'2026-11-20'}),'bilemedim');assert.equal(c.write.review,'yanlış')});
await t('yazma kuralı: oturumdaki yalnız İLK sonuç yazılır (Bilemedim sonra Bildim → tek "yanlış")',()=>{
  const card=q('cur');let r=Q.applyResult(sess(L(10)),card,'bilemedim');
  r=Q.applyResult({...r.session,queue:L(10)},card,'bildim');assert.equal(r.write,null);assert.deepEqual(r.session.pending.map(p=>[p.id,p.review]),[['cur','yanlış']]);
  assert.equal(Q.summary(r.session,[card],TODAY).bilemedim,1)});
await t('yazma kuralı: önce atlayıp sonra işaretlenirse işaretleme ilk sonuçtur',()=>{
  const card=q('cur');let r=Q.applyResult(sess(L(5)),card,'atlandi');r=Q.applyResult({...r.session,queue:[]},card,'bildim');assert.equal(r.write.review,'doğru')});
// Geri alma
await t('geri alma: Sonucu değiştir yerel; kart terk edilince tek istek',()=>{
  const card=q('cur');let s=Q.markCurrent(sess([]),'bildim');s=Q.markCurrent(s,'bilemedim');assert.equal(s.pending.length,0,'işaretleme istek bırakmaz');
  const r=Q.leaveCard(s,card);assert.deepEqual(r.session.pending.map(p=>[p.id,p.review]),[['cur','yanlış']]);assert.equal(r.session.mark,null)});
await t('geri alma: işaretsiz terk = atlandı',()=>{const r=Q.leaveCard(sess(L(3)),q('cur'));assert.equal(r.write,null);assert.equal(r.session.queue.at(-1),'cur')});
// Donmuş katman (inceleme 1): sunucu upsert'i vadeyi kaydırsa da sıra değişmez
await t('startSession: katman oturum başında donar (s.tiers); karışık havuzda A/B/C kaydı vardır',()=>{
  const rows=[q('a'),q('b',{next_review:'2026-11-20'}),q('c',{review_stage:6,next_review:null})];
  const s=Q.startSession(rows,TODAY,{...opts,includeLearned:true});assert.deepEqual(s.tiers,{a:'A',b:'B',c:'C'})});
await t('Bilemedim + upsert simülasyonu: yeniden çıkma 4 kart sonra, son iki konudan farklı; upsert\'li ve upsert\'siz akış AYNI sırayı verir',()=>{
  const topics=['Türev','Limit','İntegral','Limit','Türev','Olasılık','Olasılık'];
  const run=upsert=>{
    let rows=topics.map((tp,i)=>q('q'+i,{topic:tp}));const map=()=>new Map(rows.map(r=>[r.id,r]));
    let s=Q.startSession(rows,TODAY,{subject:'Tüm dersler',scope:'due',includeLearned:false});const order=[];let q0n=0;
    s=Q.advance(s,map());
    while(s.current){const cur=map().get(s.current);order.push(cur.id);
      const out=cur.id==='q0'&&++q0n===1?'bilemedim':'bildim';
      const r=Q.leaveCard(Q.markCurrent(s,out),cur);s=r.session;
      if(upsert&&r.write){const sch=S.scheduleReview(cur.review_stage,r.write.review,TODAY);rows=rows.map(x=>x.id===cur.id?{...x,review_stage:sch.stage,next_review:sch.nextReview}:x)}
      s=Q.advance(s,map())}
    return order};
  const a=run(false),b=run(true);assert.deepEqual(b,a,'upsert sırayı değiştirmemeli');
  // ekleme konumu 4 (0 tabanlı indeks 4 = 5. sıra); gösterimde karıştırma kuralı öne/arkaya kaydırabilir; 4. kart q3 yerine q4 seçildiği ve q0 (Türev) son ikiyle (q4 Türev, q3 Limit) çakıştığı için q5'ten sonra gelir
  assert.deepEqual(a,['q0','q1','q2','q4','q3','q5','q0','q6']);
  const T=id=>topics[+id.slice(1)];const k=a.lastIndexOf('q0');assert.ok(![T(a[k-1]),T(a[k-2])].includes(T('q0')),'yeniden çıkan kart son iki konudan farklı');
  assert.equal(a.length,8);});
await t('reclassify: sonucu işlenmemiş kartlar satırlara göre yeniden sınıflanır; sonucu olan donuk kalır',()=>{
  const rows=new Map([q('a'),q('b'),q('c')].map(r=>[r.id,r]));rows.set('a',{...rows.get('a'),next_review:'2026-11-20'});
  const s={...sess(['a','b'],'c',{a:'A',b:'A',c:'A'}),results:{b:{first:'bilemedim',wrong:1,skips:0}}};
  const r=Q.reclassify(s,rows,TODAY);assert.deepEqual(r.tiers,{a:'B',b:'A',c:'A'})});
await t('reclassify: yalnız atlanmış kart (first yok) yeniden sınıflanır; ilk sonucu olan donuk kalır',()=>{
  const rows=new Map([q('a'),q('b')].map(r=>[r.id,{...r,next_review:'2026-11-20'}]));
  const s={...sess(['a','b'],'cur',{a:'A',b:'A',cur:'A'}),results:{a:{wrong:0,skips:1},b:{first:'doğru',wrong:0,skips:0}}};
  assert.deepEqual(Q.reclassify(s,rows,TODAY).tiers,{a:'B',b:'A',cur:'A'})});
// summary
await t('özet: sayılar, çalışılacaklar, sıradaki tekrar tarihi (next_review min, bugünden sonra)',()=>{
  const rows=[q('a',{next_review:'2026-11-19'}),q('b',{next_review:'2026-11-19'}),q('c',{next_review:'2026-11-24'})];
  let s=sess([]);for(const [id,o] of [['a','bildim'],['b','bilemedim'],['c','bildim']])s=Q.applyResult({...s,queue:[]},rows.find(r=>r.id===id),o).session;
  const m=Q.summary(s,rows,TODAY);assert.equal(m.bildim,2);assert.equal(m.bilemedim,1);assert.equal(m.atlandi,0);assert.equal(m.total,3);assert.deepEqual(m.nextReview,{date:'2026-11-19',count:2});
  assert.equal(Q.summary(sess([]),[],TODAY).nextReview,null)});
console.log(n+' test geçti');
