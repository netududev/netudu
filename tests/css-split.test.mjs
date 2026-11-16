// globals.css bölme testi: parçaların birleşimi orijinal tek dosyayla bayt bayt aynı mı
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const appDir=join(dirname(fileURLToPath(import.meta.url)),'..','app');
// Bölme adımında orijinal tek dosyanın (3183fde:app/globals.css) @import satırları çıkarılmış hâlinin özeti buydu (bayt eşitliği bu değerle kanıtlandı):
//   39a80afe3cabd91f1b65eccd63ee1ce85797ffbc8671d728931650983ed1be2e
// Ardından yalnız .dropzone ve .camera-button kuralları (hiçbir bileşende geçmeyen ölü kurallar) silindi; güncel beklenen özet:
const EXPECTED_SHA256='8ca411a5b59483f64e0ab5ab5bc75db1078965d2c55569f40c5fef67d6ddd429';
const sha=s=>createHash('sha256').update(s).digest('hex');
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

test('styles/: birleşim (başlık yorumları hariç) beklenen içerikle bayt bayt aynı (orijinal - ölü kurallar)',()=>{
  const joined=partImports().map(p=>readFileSync(join(appDir,p),'utf8').split('\n').slice(1).join('\n')).join('');
  assert.equal(sha(joined),EXPECTED_SHA256);
});
