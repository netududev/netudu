// Defter filtre paneli saf mantığı: seçili filtre sayacı (rozet), ay seçenekleri, kontrol bekleyenler şeridi metni.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_SUBJECTS,ALL_EXAMS,ALL_STATUS,ALL_MISTAKES,ALL_MONTHS,emptyFilters,activeFilterCount,monthValues,pendingStripText,filtersButtonLabel} from '../lib/archive-filters';

test('hiç filtre seçilmemişse sayaç 0; her seçili filtre 1 sayılır',()=>{
  assert.equal(activeFilterCount(emptyFilters),0);
  assert.equal(activeFilterCount({...emptyFilters,subject:'Matematik'}),1);
  assert.equal(activeFilterCount({subject:'Matematik',examType:'TYT',status:'Öğrenildi',mistake:'Boş bıraktım',month:'2026-11'}),5);
});
test('"tümü" değerleri seçili sayılmaz (ay boş = Tüm aylar)',()=>{
  assert.equal(activeFilterCount({subject:ALL_SUBJECTS,examType:ALL_EXAMS,status:ALL_STATUS,mistake:ALL_MISTAKES,month:''}),0);
  assert.equal(ALL_MONTHS,'Tüm aylar');
});
test('Kontrol bekleyenler de ders filtresi olarak sayılır',()=>{
  assert.equal(activeFilterCount({...emptyFilters,subject:'Kontrol bekleyenler'}),1);
});
test('ay seçenekleri: sorulardaki tarihlerden benzersiz YYYY-AA, yeniden eskiye',()=>{
  assert.deepEqual(monthValues(['2026-09-03','2026-11-01','2026-11-14','2026-10-30']),['2026-11','2026-10','2026-09']);
  assert.deepEqual(monthValues([]),[]);
});
test('kontrol bekleyenler şeridi: yalnız sayı sıfırdan büyükken metin üretir',()=>{
  assert.equal(pendingStripText(0),null);
  assert.equal(pendingStripText(3),'3 soruyu yapay zekâ tanıyamadı');
});
test('Filtreler düğmesi erişilebilir adı seçili sayıyı söyler',()=>{
  assert.equal(filtersButtonLabel(0),'Filtreler');
  assert.equal(filtersButtonLabel(2),'Filtreler, 2 seçili');
});
