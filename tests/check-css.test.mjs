// check-css saf mantığı: analyzeCss ve extractStylesheetHrefs
import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCss,extractStylesheetHrefs} from '../scripts/check-css.mjs';

const opts={required:['lp-sheet','tag-card','nv-flow'],forbidden:['--glow-a','ndDrift']};

test('analyzeCss: her şey tamamsa ok',()=>{
  const r=analyzeCss('.lp-sheet{} .tag-card{} .nv-flow{} .x{color:red}',opts);
  assert.equal(r.ok,true);assert.deepEqual(r.missing,[]);assert.deepEqual(r.forbiddenFound,[]);
});
test('analyzeCss: eksik gerekli sınıfları bildirir',()=>{
  const r=analyzeCss('.lp-sheet{}',opts);
  assert.equal(r.ok,false);assert.deepEqual(r.missing,['tag-card','nv-flow']);
});
test('analyzeCss: yasaklı dizeleri bildirir',()=>{
  const r=analyzeCss('.lp-sheet{} .tag-card{} .nv-flow{} a{background:var(--glow-a);animation:ndDrift 1s}',opts);
  assert.equal(r.ok,false);assert.deepEqual(r.forbiddenFound,['--glow-a','ndDrift']);assert.deepEqual(r.missing,[]);
});
test('analyzeCss: boş CSS hepsini eksik sayar',()=>{
  const r=analyzeCss('',opts);assert.equal(r.ok,false);assert.equal(r.missing.length,3);
});
test('extractStylesheetHrefs: link rel=stylesheet adreslerini mutlaklaştırır',()=>{
  const html='<head><link rel="stylesheet" href="/_next/a.css" data-x="1"><link href="b.css?v=2" rel="stylesheet"/><link rel="icon" href="/f.ico"><link rel=preload as=style href="/p.css"></head>';
  assert.deepEqual(extractStylesheetHrefs(html,'https://ex.com/dir/page'),['https://ex.com/_next/a.css','https://ex.com/dir/b.css?v=2']);
});
test('extractStylesheetHrefs: tekrarları eler, href yoksa atlar',()=>{
  const html='<link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="/a.css"><link rel="stylesheet">';
  assert.deepEqual(extractStylesheetHrefs(html,'https://ex.com/'),['https://ex.com/a.css']);
});
test('extractStylesheetHrefs: href içindeki &amp; çözülür',()=>{
  const html='<link rel="stylesheet" href="/a.css?x=1&amp;y=2">';
  assert.deepEqual(extractStylesheetHrefs(html,'https://ex.com/'),['https://ex.com/a.css?x=1&y=2']);
});
test('extractStylesheetHrefs: rel bölünür; preload stylesheet alınır, alternate stylesheet atlanır',()=>{
  const html='<link rel="preload stylesheet" href="/p.css"><link rel="alternate stylesheet" href="/alt.css"><link rel="stylesheet alternate" href="/alt2.css">';
  assert.deepEqual(extractStylesheetHrefs(html,'https://ex.com/'),['https://ex.com/p.css']);
});
test('analyzeCss: işaret sınıf adı .önekli aranır (yorum/değer içindeki ad sayılmaz)',()=>{
  const r=analyzeCss('a{content:"lp-sheet tag-card nv-flow"}',opts);
  assert.equal(r.ok,false);assert.deepEqual(r.missing,['lp-sheet','tag-card','nv-flow']);
});
