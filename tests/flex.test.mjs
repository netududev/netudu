import assert from 'node:assert/strict';
import test from 'node:test';
const R=new URL('../lib/',import.meta.url).href;
const F=await import(R+'plan/flex.ts');
const M=await import(R+'meb-topics.ts');
const {defaultFlexConfig,normalizeFlexConfig,buildPlan,extendPlan,regeneratePlan,tasksOn,tytShareFor}=F;
const today='2026-11-20';
const grades=['9','10','11','12','Mezun'];
test('9. sınıf: yalnız 9. sınıf konuları; 10: çoğunlukla 10, arada 9',()=>{
  const p9=buildPlan(defaultFlexConfig(today,'9'),today);assert.ok(p9.tasks.filter(t=>t.pool).every(t=>t.grade==='9'));
  const p10=buildPlan({...defaultFlexConfig(today,'10'),topicsPerWeek:10,dailyTasks:3},today);const g=p10.tasks.filter(t=>t.pool).map(t=>t.grade);
  assert.ok(g.includes('9')&&g.filter(x=>x==='10').length>g.filter(x=>x==='9').length*2);
});
test('12. sınıf: 15 Aralık\'a kadar TYT ağırlıklı, sonra AYT ağırlıklı',()=>{
  const c=defaultFlexConfig(today,'12');assert.ok(tytShareFor(c,'2026-11-20')>50);assert.ok(tytShareFor(c,'2027-01-10')<50);
  assert.ok(tytShareFor({...c,tytNet:50},'2026-11-20')>tytShareFor(c,'2026-11-20'),'düşük TYT neti TYT payını artırır');
});
test('günlük görev sınırı, dinlenme günü ve konu tekrarsızlığı',()=>{
  for(const g of grades){const cfg=defaultFlexConfig(today,g);const p=buildPlan(cfg,today);const by={};for(const t of p.tasks)by[t.date]=(by[t.date]||0)+1;
   assert.ok(Object.values(by).every(n=>n<=cfg.dailyTasks),g);const k=p.tasks.filter(t=>t.kind==='konu').map(t=>t.subject+t.topic);assert.equal(new Set(k).size,k.length,g);
   assert.equal(tasksOn(p,'2026-11-22').length,0,'Pazar dinlenme')}
});
test('eksik konu erken yerleşir; tekrar kapalıysa tekrar görevi yok; tekrarlar konudan sonra gelir',()=>{
  const wt=M.topicOptions('Matematik').filter(o=>o.grade==='9')[5].value;
  const pw=buildPlan(normalizeFlexConfig({...defaultFlexConfig(today,'9'),topicsPerWeek:6,weakTopics:[{subject:'Matematik',topic:wt}]},today),today);
  const hit=pw.tasks.find(t=>t.topic===wt&&t.pool);assert.ok(hit&&hit.date<='2026-12-04');assert.equal(hit.pool,'eksik');
  assert.equal(buildPlan({...defaultFlexConfig(today,'12'),review:{enabled:false,spacing:'normal'}},today).tasks.filter(t=>t.kind==='tekrar'&&t.from).length,0);
  const p=buildPlan(defaultFlexConfig(today,'12'),today);const rv=p.tasks.filter(t=>t.kind==='tekrar'&&t.from);assert.ok(rv.length>0);
  for(const r of rv)assert.ok(r.date>p.tasks.find(t=>t.id===r.from).date);
});
test('deneme günü hafif; aynı gün aynı dersten ikinci soru görevi yok',()=>{
  const p=buildPlan(defaultFlexConfig(today,'12'),today);const sat=tasksOn(p,'2026-11-21');assert.ok(sat.length<=2&&sat.some(t=>t.kind==='deneme'));
  for(const g of ['10','11','12','Mezun']){const m=new Map();for(const t of buildPlan(defaultFlexConfig(today,g),today).tasks.filter(t=>t.kind==='soru'))m.set(t.date+t.subject,(m.get(t.date+t.subject)||0)+1);assert.ok([...m.values()].every(n=>n===1),g)}
});
test('uzatma tekrarsızdır; yeniden üretim yapılan ve elle düzenlenen görevleri korur',()=>{
  const cy=buildPlan(defaultFlexConfig(today,'12'),today);const pe=extendPlan(cy,'2026-12-10');assert.ok(pe.horizon>cy.horizon);assert.equal(extendPlan(pe,'2026-12-10').tasks.length,pe.tasks.length);
  const mod={...cy,tasks:cy.tasks.map((t,i)=>i===0?{...t,done:true}:i===1?{...t,manual:true,title:'Benim'}:t)};
  const rg=regeneratePlan(mod,{...cy.config,topicsPerWeek:3},today);assert.ok(rg.tasks.some(t=>t.id===mod.tasks[0].id));assert.ok(rg.tasks.some(t=>t.id===mod.tasks[1].id&&t.title==='Benim'));
});
test('sınıf deneme neti kaydedilir ve sınırlanır',()=>{
  assert.equal(normalizeFlexConfig({grade:'10',gradeNet:55.5},today).gradeNet,55.5);assert.equal(normalizeFlexConfig({grade:'10',gradeNet:999},today).gradeNet,120);
  const lo=buildPlan({...defaultFlexConfig(today,'9'),gradeNet:20},today).tasks.find(t=>t.kind==='konu');assert.ok(lo.detail.includes('15 soru'));
});
test('normalizeFlexConfig: bozuk girişi sınırlar',()=>{
  const c=normalizeFlexConfig({grade:'12',track:'dil',days:['Pzt'],topicsPerWeek:99,dailyTasks:0,weakSubjects:['x','Matematik']},today);
  assert.equal(c.topicsPerWeek,21);assert.equal(c.dailyTasks,1);assert.deepEqual(c.weakSubjects,['Matematik']);
  for(const track of ['dil','sozel','ea','sayisal'])assert.ok(buildPlan({...defaultFlexConfig(today,'12'),track},today).tasks.length>0,track);
});
