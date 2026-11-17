// Ayarlar sekme mantığı (lib/settings-tabs.ts): sekme listesi, türetilmiş seçim (effect yok), Profil kirli durumu.
import test from 'node:test';
import assert from 'node:assert/strict';
import {settingsTabs,tabSections,resolveTab,isProfileDirty} from '../lib/settings-tabs.ts';
import {pageActions} from '../lib/shell.ts';
const p={name:'Ayşe',grade:'12',target:'Tıp',examYear:2027,examDate:'2027-06-19',motto:'',dailyGoal:0,school:''};

test('normal hesapta 4 sekme, geliştiricide 5 (Geliştirici sonda)',()=>{
  assert.deepEqual(settingsTabs(false).map(t=>t.label),['Profil','Üyelik','Veri','Hesap']);
  assert.deepEqual(settingsTabs(true).map(t=>t.label),['Profil','Üyelik','Veri','Hesap','Geliştirici']);
});
test('bölümler plandaki gibi dağılır ve 13 bölümün hiçbiri tekrar etmez',()=>{
  assert.deepEqual(tabSections('profile'),['profile','plan','appearance']);
  assert.deepEqual(tabSections('membership'),['membership','usage']);
  assert.deepEqual(tabSections('data'),['backup','export','report']);
  assert.deepEqual(tabSections('account'),['account','workspace']);
  assert.deepEqual(tabSections('developer'),['users','openai','supabase']);
  const all=settingsTabs(true).flatMap(t=>tabSections(t.id));
  assert.equal(new Set(all).size,all.length);assert.equal(all.length,13);
});
test('resolveTab: geçerli seçim korunur (başka girdi değişince sıfırlanmaz); geçersiz/yetkisiz Profil olur',()=>{
  assert.equal(resolveTab('data',false),'data');
  assert.equal(resolveTab('data',true),'data');
  assert.equal(resolveTab('developer',true),'developer');
  assert.equal(resolveTab('developer',false),'profile');
  assert.equal(resolveTab('yok',true),'profile');
  assert.equal(resolveTab(null,false),'profile');
  assert.equal(resolveTab(undefined,true),'profile');
});
test('isProfileDirty: aynı değerler temiz; alan değişince ya da sayı metne dönünce doğru karar',()=>{
  assert.equal(isProfileDirty({...p},p),false);
  assert.equal(isProfileDirty({...p,examYear:'2027'},p),false);
  assert.equal(isProfileDirty({...p,name:' Ayşe '},p),false);
  assert.equal(isProfileDirty({...p,name:'Ayşe Y'},p),true);
  assert.equal(isProfileDirty({...p,dailyGoal:50},p),true);
  assert.equal(isProfileDirty({...p,grade:'11'},p),true);
});
test('pageActions: Aylık rapor ay seçici + yazdır; Denemeler "Deneme ekle"; diğerleri değişmedi',()=>{
  assert.deepEqual(pageActions('report',{plan:false}),['month','print']);
  assert.deepEqual(pageActions('exams',{plan:false}),['add-exam']);
  assert.deepEqual(pageActions('notes',{plan:false}),[]);
  assert.deepEqual(pageActions('settings',{plan:false}),[]);
  assert.deepEqual(pageActions('home',{plan:true}),['edit-plan']);
});
