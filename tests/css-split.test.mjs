// globals.css bölme testi: yapı (import listesi, başlık yorumları), analyzeCss ve ölü sınıf denetimi; sabit SHA-256 özeti yeni CSS parçalarıyla kırıldığı için kaldırıldı
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {analyzeCss} from '../scripts/check-css.mjs';

const appDir=join(dirname(fileURLToPath(import.meta.url)),'..','app');
const imports=()=>[...readFileSync(join(appDir,'globals.css'),'utf8').matchAll(/^@import\s+"([^"]+)";$/gm)].map(m=>m[1]);
const partImports=()=>imports().filter(p=>p.startsWith('./styles/'));

test('globals.css: ilk üç @import tailwind, animasyon ve vendor; gerisi styles/',()=>{
  const all=imports();
  assert.deepEqual(all.slice(0,3),['tailwindcss','tw-animate-css','../vendor/shadcn-tailwind-4.13.0.css']);
  assert.ok(all.length>3);
  const text=readFileSync(join(appDir,'globals.css'),'utf8').split('\n').filter(l=>l.trim());
  assert.ok(text.every(l=>l.startsWith('@import ')),'globals.css yalnız @import içermeli');
});

test('styles/: dizindeki tüm dosyalar numara sırasıyla @import edilmiş',()=>{
  const files=readdirSync(join(appDir,'styles')).filter(f=>f.endsWith('.css')).sort();
  assert.ok(files.every(f=>/^\d\d-.+\.css$/.test(f)),'ad öneki NN- olmalı');
  assert.deepEqual(partImports(),files.map(f=>'./styles/'+f));
});

test('styles/: her dosya tek satırlık açıklama yorumuyla başlar',()=>{
  assert.ok(partImports().length>0);
  for(const p of partImports()){
    const first=readFileSync(join(appDir,p),'utf8').split('\n')[0];
    assert.match(first,/^\/\*.*\*\/$/,p);
  }
});

test('styles/: birleşik CSS analyzeCss denetiminden geçer (gerekli sınıflar var, yasaklı dizeler yok)',()=>{
  const joined=partImports().map(p=>readFileSync(join(appDir,p),'utf8')).join('\n');
  const r=analyzeCss(joined);
  assert.equal(r.ok,true,JSON.stringify(r));
});

test('styles/: silinen ölü sınıflar geri gelmedi',()=>{
  const joined=partImports().map(p=>readFileSync(join(appDir,p),'utf8')).join('\n');
  for(const dead of ['dropzone','camera-button'])assert.ok(!new RegExp('\\.'+dead+'(?![\\w-])').test(joined),dead);
});

test('styles/90-defter-yukleme.css: @import edilmiş; araç çubuğu, kontrol şeridi ve pencere sınıfları var',()=>{
  assert.ok(partImports().includes('./styles/90-defter-yukleme.css'));
  const css=readFileSync(join(appDir,'styles','90-defter-yukleme.css'),'utf8');
  for(const c of ['pending-strip','filters-btn','filters-panel','dlg-bar','cap-info','tag-save','danger-confirm'])assert.match(css,new RegExp('\\.'+c+'(?![\\w-])'),c);
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/\/\*.*?\*\//g,'')),'renk jetonlardan gelir, düz hex yok');
});

test('90-defter-yukleme.css: 560px pencere kuralı .cap-dialog\'a bağlı; ortak .upload-dialog\'a sızmaz',()=>{
  const css=readFileSync(join(appDir,'styles','90-defter-yukleme.css'),'utf8');
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].replace(/@media[^{]*$/,'').trim(),body:m[2]}));
  const w560=rules.filter(r=>/560px/.test(r.body));
  assert.ok(w560.length>0,'560px kuralı bulunmalı');
  for(const r of w560){
    assert.match(r.sel,/(^|,)\s*\.cap-dialog\s*($|,)/,'560px kuralı .cap-dialog seçicisine bağlı olmalı');
    assert.ok(!/\.upload-dialog\s*(\{|,|$)/.test(r.sel),'560px kuralı doğrudan .upload-dialog\'a bağlanmamalı');
  }
  assert.ok(!/\.upload-dialog\{[^}]*560px/.test(css),'css içinde .upload-dialog{...560px} yok');
});

test('styles/95-program-kaynaklar.css: 98 ve 99 parçalarından önce @import edilmiş; sınıflar var; düz hex yok',()=>{
  assert.equal(partImports().at(-3),'./styles/95-program-kaynaklar.css');
  const css=readFileSync(join(appDir,'styles','95-program-kaynaklar.css'),'utf8');
  for(const c of ['td-columns','td-aside','day-tabs','wz-top','rc-progress','rc-more'])assert.match(css,new RegExp('\\.'+c+'(?![\\w-])'),c);
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/\/\*.*?\*\//g,'')),'renk jetonlardan gelir, düz hex yok');
  assert.match(css,/\.week-chips button\.on\{[^}]*var\(--fg\)/,'seçili hafta çipi kobalt dolgu değil');
});
