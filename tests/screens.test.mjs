// screens.mjs saf mantığı: slugFromPath, parseArgs, outputName
import test from 'node:test';
import assert from 'node:assert/strict';
import {slugFromPath,outputName,parseArgs,uniqueSlugs} from '../scripts/screens.mjs';

test('slugFromPath: kök "ana", yol eğik çizgileri tireye döner',()=>{
  assert.equal(slugFromPath('/'),'ana');
  assert.equal(slugFromPath('/study'),'study');
  assert.equal(slugFromPath('/study/plan?x=1#a'),'study-plan');
});
test('outputName: <ad>-<genişlik>-<tema>.png',()=>{
  assert.equal(outputName('/study',390,'dark'),'study-390-dark.png');
});
test('parseArgs: konumsal, --cookie ve --paths',()=>{
  const a=parseArgs(['https://x.io','out','--cookie','a=b','--paths','/,/study']);
  assert.deepEqual(a,{base:'https://x.io',outDir:'out',cookie:'a=b',paths:['/','/study']});
});
test('parseArgs: varsayılan yol "/", eksik argüman hata',()=>{
  assert.deepEqual(parseArgs(['https://x.io','o']).paths,['/']);
  assert.throws(()=>parseArgs(['https://x.io']),/Kullanım/);
});
test('parseArgs: --cookie değerinde "=" yoksa anlaşılır hata',()=>{
  assert.throws(()=>parseArgs(['https://x.io','o','--cookie','abc']),/--cookie.*ad=değer/);
});
test('uniqueSlugs: "/" -> ana, gerçek "/ana" -> ana-2; çakışmayanlar aynı kalır',()=>{
  assert.deepEqual(uniqueSlugs(['/','/ana','/study','/study/']),['ana','ana-2','study','study-2']);
});
