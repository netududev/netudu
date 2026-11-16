// Kabuk (üst çubuk, kenar çubuğu, sayfa başlığı, alt çubuk) saf mantığı: lib/shell.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {headings,planNavEntries,bookNavEntries,sidebarNavLabels,pageActions,topbarAddVariant,contentWidth,mobileBarItems,views} from '../lib/shell';

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
  for(const plan of [true,false])assert.ok(!sidebarNavLabels(plan).includes('Programı oluştur'),'plan='+plan);
  assert.deepEqual(planNavEntries.map(e=>e.id),['home','program','resources']);
  assert.deepEqual(bookNavEntries.map(e=>e.id),['archive','report','exams','notes']);
});

test('sayfa başlığı eylemleri: "Yanlış ekle" hiçbir ekranda yok; Programı düzenle yalnız Bugün + program varken',()=>{
  for(const v of views)for(const plan of [true,false])assert.ok(!pageActions(v,{plan}).includes('add-wrong'),v);
  assert.deepEqual(pageActions('home',{plan:true}),['edit-plan']);
  assert.deepEqual(pageActions('home',{plan:false}),[]);
  assert.deepEqual(pageActions('archive',{plan:true}),['print']);
  assert.deepEqual(pageActions('report',{plan:false}),['print']);
  assert.deepEqual(pageActions('settings',{plan:true}),[]);
});

test('üst çubuk "Yanlış ekle": tek birincil; program yokken Bugün\'de boş durumun birincili öne çıkar',()=>{
  assert.equal(topbarAddVariant('home',false),'secondary');
  assert.equal(topbarAddVariant('home',true),'primary');
  assert.equal(topbarAddVariant('resources',false),'secondary');
  assert.equal(topbarAddVariant('notes',true),'secondary');
  assert.equal(topbarAddVariant('archive',false),'primary');
  assert.equal(topbarAddVariant('settings',true),'primary');
});

test('içerik genişliği: yalnız Ayarlar okuma genişliği; Notlar (iki sütun) dahil diğerleri geniş',()=>{
  assert.equal(contentWidth('settings'),'reading');
  for(const v of ['home','program','resources','archive','report','exams','notes'])assert.equal(contentWidth(v),'wide',v);
});

test('mobil alt çubuk: Bugün, Program, +, Defter, Daha fazla',()=>{
  assert.deepEqual(mobileBarItems.map(i=>i.label),['Bugün','Program','Yanlış ekle','Defter','Daha fazla']);
  assert.equal(mobileBarItems[2].id,'add');
});
