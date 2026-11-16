// Program gün sekmesi (mobil) ve Kaynaklar'daki tek kobalt kaynak: saf mantık
import test from 'node:test';
import assert from 'node:assert/strict';
const L=new URL('../lib/plan/',import.meta.url).href;
const W=await import(L+'week-view.ts');const V=await import(L+'resource-view.ts');
const week=['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22'];

test('dayIndexFor: seçim yoksa bugünün gün sırası; hafta bugünü içermiyorsa 0',()=>{
  assert.equal(W.dayIndexFor(week,'2026-11-19',null,3),3);
  assert.equal(W.dayIndexFor(week,'2026-12-30',null,3),0);
});
test('dayIndexFor: aynı haftadaki seçim korunur; başka haftaya geçince sıfırlanır (kimlik = hafta)',()=>{
  assert.equal(W.dayIndexFor(week,'2026-11-19',{week:3,idx:5},3),5);
  assert.equal(W.dayIndexFor(week,'2026-11-19',{week:2,idx:5},3),3);
});
test('dayIndexFor: aralık dışı seçim yok sayılır',()=>{
  assert.equal(W.dayIndexFor(week,'2026-11-16',{week:1,idx:9},1),0);
  assert.equal(W.dayIndexFor(week,'2026-11-16',{week:1,idx:-1},1),0);
  assert.equal(W.dayIndexFor([],'2026-11-16',null,1),0);
});
const r=(id,kind,done,total)=>({id,kind,done,total});
test('leadResourceId: ekrandaki sırada (önce kitaplar, sonra listeler) ilk bitmemiş kaynak',()=>{
  assert.equal(V.leadResourceId([r('p1','playlist',1,10),r('b1','book',3,5)]),'b1');
  assert.equal(V.leadResourceId([r('b0','book',5,5),r('p1','playlist',1,10),r('b1','book',3,5)]),'b1');
  assert.equal(V.leadResourceId([r('b0','book',5,5),r('p1','playlist',1,10)]),'p1');
});
test('leadResourceId: hepsi bitti ya da liste boşsa null',()=>{
  assert.equal(V.leadResourceId([r('b0','book',5,5)]),null);
  assert.equal(V.leadResourceId([]),null);
});
