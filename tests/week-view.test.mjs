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
const TODAY='2026-11-16';
const r=(id,kind,done,total,extra={})=>({id,kind,name:id,subject:'',unit:kind==='book'?'test':'video',total,done,perDay:2,minPerUnit:10,days:['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'],...(kind==='playlist'?{watched:Array.from({length:done},(_,i)=>i+1)}:{}),...extra});
test('leadResourceId: ekrandaki sırada (önce kitaplar, sonra listeler) bugün işi bekleyen ilk kaynak',()=>{
  assert.equal(V.leadResourceId([r('p1','playlist',1,10),r('b1','book',3,9)],TODAY),'b1');
  assert.equal(V.leadResourceId([r('b0','book',5,5),r('p1','playlist',1,10),r('b1','book',3,9)],TODAY),'b1');
  assert.equal(V.leadResourceId([r('b0','book',5,5),r('p1','playlist',1,10)],TODAY),'p1');
});
test('leadResourceId: bugünkü payı tamamlanan kitap lead olmaz; iş bekleyen sonraki kaynak olur',()=>{
  const b1=r('b1','book',5,9,{log:{date:TODAY,units:[4,5]}});
  assert.equal(V.leadResourceId([b1,r('b2','book',0,9)],TODAY),'b2');
  assert.equal(V.leadResourceId([b1,r('p1','playlist',0,10)],TODAY),'p1');
});
test('leadResourceId: bugün işi kalmadıysa ilk bitmemiş kaynak (kobalt kaybolmaz)',()=>{
  const b1=r('b1','book',5,9,{log:{date:TODAY,units:[4,5]}});
  assert.equal(V.leadResourceId([b1],TODAY),'b1');
  assert.equal(V.leadResourceId([b1,r('b2','book',1,9,{days:['Sal']})],TODAY),'b1');
  assert.equal(V.leadResourceId([r('b1','book',1,9),r('b2','book',1,9)],TODAY,true),'b1');
});
test('leadResourceId: oynatma listesi bitişi watched ile; hepsi bitti ya da liste boşsa null',()=>{
  assert.equal(V.leadResourceId([r('p0','playlist',10,10)],TODAY),null);
  assert.equal(V.leadResourceId([r('p0','playlist',10,10),r('b1','book',9,9)],TODAY),null);
  assert.equal(V.leadResourceId([r('p1','playlist',0,10,{done:10})],TODAY),'p1');
  assert.equal(V.leadResourceId([],TODAY),null);
});
