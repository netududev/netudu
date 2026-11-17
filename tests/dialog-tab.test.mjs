// Soru penceresi sekme durumu: aynı soru (aynı id, yeni nesne) sekmeyi korur; farklı soru ya da kapanış sıfırlar.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TAB,syncTab,pickTab} from '../lib/dialog-tab';

const open=(id)=>syncTab({id:null,tab:DEFAULT_TAB},id);
test('soru açılınca sekme "Soru ve çözüm"dür',()=>{assert.deepEqual(open('a'),{id:'a',tab:'solution'})});
test('aynı id ile yeni nesne gelince (upsert sonrası) seçili sekme korunur',()=>{
  const st=pickTab(open('a'),'review');
  assert.equal(syncTab(st,'a').tab,'review');
  assert.equal(syncTab(st,'a'),st,'aynı durum nesnesi dönmeli (gereksiz yeniden çizim yok)');
});
test('farklı soru açılınca sekme sıfırlanır',()=>{assert.deepEqual(syncTab(pickTab(open('a'),'edit'),'b'),{id:'b',tab:'solution'})});
test('pencere kapanıp aynı soru yeniden açılınca sekme sıfırlanır',()=>{
  const closed=syncTab(pickTab(open('a'),'videos'),null);
  assert.equal(syncTab(closed,'a').tab,'solution');
});
