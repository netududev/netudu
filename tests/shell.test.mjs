// Kabuk (üst çubuk, kenar çubuğu, sayfa başlığı, alt çubuk) saf mantığı: lib/shell.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {headings,planNavEntries,bookNavEntries,settingsEntry,pageActions,topbarAddVariant,contentWidth,views} from '../lib/shell';

test('headings: her ekranın yalnız başlığı ve tek satır açıklaması var (büyük harfli eyebrow yok)',()=>{
  for(const v of views){
    const h=headings[v];
    assert.deepEqual(Object.keys(h).sort(),['description','title'],v);
    assert.ok(h.title.length>0&&h.description.length>0,v);
    assert.doesNotMatch(h.title+h.description,/^[A-ZÇĞİÖŞÜ ]{4,}$/,v);
  }
  assert.equal(headings.archive.title,'Yanlış defteri.');
});

test('kenar çubuğu gezinmesinde "Programı oluştur" yok',()=>{
  const labels=[...planNavEntries,...bookNavEntries,settingsEntry].map(e=>e.label);
  assert.ok(!labels.includes('Programı oluştur'));
  assert.deepEqual(planNavEntries.map(e=>e.id),['home','program','resources']);
  assert.deepEqual(bookNavEntries.map(e=>e.id),['archive','report','exams','notes']);
});

test('sayfa başlığı eylemleri: Programı düzenle yalnız Bugün + program varken',()=>{
  for(const v of views)for(const plan of [true,false])assert.ok(pageActions(v,{plan}).every(a=>['print','edit-plan'].includes(a)),v);
  assert.deepEqual(pageActions('home',{plan:true}),['edit-plan']);
  assert.deepEqual(pageActions('home',{plan:false}),[]);
  assert.deepEqual(pageActions('archive',{plan:true}),[],'Defter: Yazdır/PDF artık "Dışa aktar" menüsünde');
  assert.deepEqual(pageActions('report',{plan:false}),['print']);
  assert.deepEqual(pageActions('settings',{plan:true}),[]);
});

test('üst çubuk "Yanlış ekle": yalnız Defter\'te birincil; diğer tüm ekranlarda ikincil (ekran başına tek kobalt)',()=>{
  for(const v of views)assert.equal(topbarAddVariant(v,{rows:5,loading:false}),v==='archive'?'primary':'secondary',v);
});

test('üst çubuk "Yanlış ekle": Defter boşken ikincil (birincil boş durumdaki "İlk yanlışını ekle"); yüklenirken ya da satır varken birincil',()=>{
  assert.equal(topbarAddVariant('archive',{rows:0,loading:false}),'secondary');
  assert.equal(topbarAddVariant('archive',{rows:0,loading:true}),'primary');
  assert.equal(topbarAddVariant('archive',{rows:1,loading:false}),'primary');
  assert.equal(topbarAddVariant('home',{rows:0,loading:false}),'secondary');
});

test('içerik genişliği: yalnız Ayarlar okuma genişliği; Notlar (iki sütun) dahil diğerleri geniş',()=>{
  assert.equal(contentWidth('settings'),'reading');
  for(const v of ['home','program','resources','archive','report','exams','notes'])assert.equal(contentWidth(v),'wide',v);
});

test('giriş CSS: kahraman h1 clamp ölçeklemesini ezmez; üst çubuk hedefleri 44px',async()=>{
  const {readFileSync}=await import('node:fs');
  const css=readFileSync(new URL('../app/styles/80-kabuk-giris.css',import.meta.url),'utf8');
  assert.doesNotMatch(css,/\.lp-hero h1\{[^}]*font-size/);
  assert.match(css,/\.lp-link,\.lp-nav nav a,\.lp-logo\{[^}]*min-height:var\(--h-btn\)/);
  assert.match(css,/:is\(\.page-heading,\.error-banner\)/);
});
