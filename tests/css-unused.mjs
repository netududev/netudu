// Kullanılmayan CSS sınıf seçicilerini listeler (npm test'e dahil değil): node tests/css-unused.mjs
// Kaynak (app/ ve components/ içindeki .ts/.tsx/.mjs/.js/.json) içinde sınıf adı HİÇ geçmiyorsa aday sayılır.
// Şüpheli: sınıf adı bir önekin devamıysa ('x-'+...) kaynakta öneki geçen adlar "dinamik olabilir" işaretlenir.
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,extname} from 'node:path';

const root=join(import.meta.dirname,'..');
const walk=d=>readdirSync(d).flatMap(n=>{const p=join(d,n);return statSync(p).isDirectory()?walk(p):[p]});
const src=['app','components'].flatMap(d=>walk(join(root,d))).filter(p=>['.ts','.tsx','.mjs','.js','.json'].includes(extname(p))).map(p=>readFileSync(p,'utf8')).join('\n');
const css=walk(join(root,'app')).filter(p=>p.endsWith('.css')).map(p=>readFileSync(p,'utf8')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g,'').replace(/url\([^)]*\)/g,'').replace(/"[^"]*"|'[^']*'/g,'""');
const classes=[...new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m=>m[1]))].filter(c=>!/^\d/.test(c));
const used=c=>src.includes(c);
const unused=classes.filter(c=>!used(c));
// dinamik: kaynakta adın bir öneki (en az 3 harf, '-' ile biten) geçiyorsa şüpheli
const prefixes=[...new Set(unused.map(c=>c.includes('-')?c.slice(0,c.lastIndexOf('-')+1):null).filter(Boolean))];
const dyn=c=>{for(let i=c.indexOf('-');i>=0;i=c.indexOf('-',i+1)){const p=c.slice(0,i+1);if(p.length>=3&&src.includes(p))return true;}return false;};
const safe=unused.filter(c=>!dyn(c)),suspect=unused.filter(dyn);
console.log(JSON.stringify({toplamSinif:classes.length,kullanilmayan:unused.length,guvenli:safe,supheli:suspect},null,1));
