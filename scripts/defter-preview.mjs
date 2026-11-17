// Statik önizleme (PR 4: Yanlış defteri, Yanlış ekle, etiket ekranı, soru penceresi): GERÇEK app/styles/*.css + GERÇEK bileşenlerin react-dom/server çıktısı.
// Radix/shadcn kabukları düz karşılıklarla (scripts/preview/ui-stubs.tsx) değiştirilir; tailwind derlenmez (preflight yerine eşdeğer sıfırlama), yazı tipi Manrope değildir,
// pencereler (Dialog) konumlandırması elle taklittir. Ekrandaki veriler ÖRNEKTİR. Açılır menü içeriği hidden gelir; ölçüm/ekran görüntüsü için betik hidden'ı kaldırır.
// Çalıştırma: ND_ROOT=<bileşen/CSS kökü> SRC_ROOT=<bu çalışma dizini> MODE=onceki|sonraki OUT=<çıktı dizini> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/defter-preview.mjs
// MODE=onceki: ND_ROOT taban dalın (PR 4 öncesi) geçici --detach worktree'si; SRC_ROOT yine bu dizin (giriş dosyaları ve stub'lar).
import fs from 'node:fs';import {createRequire} from 'node:module';
const NM='/opt/npm-tools/node_modules';const require=createRequire(NM+'/x.cjs');const {chromium}=require('playwright');const esbuild=require('esbuild');
const MODE=process.env.MODE||'sonraki',W=process.env.ND_ROOT+'/',SRC=(process.env.SRC_ROOT||process.env.ND_ROOT)+'/',OUT=process.env.OUT;
const tmp=fs.mkdtempSync('/tmp/nd-defter-');const STUB=SRC+'scripts/preview/ui-stubs.tsx';
await esbuild.build({entryPoints:[SRC+'scripts/preview/'+(MODE==='onceki'?'defter-entry-onceki.tsx':'defter-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'error',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
 alias:{'@':W.replace(/\/$/,''),'sonner':STUB},plugins:[{name:'stubs',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:STUB}));b.onResolve({filter:/^recharts$/},()=>({path:STUB}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
const S=require(tmp+'/ssr.cjs');
const css=fs.readdirSync(W+'app/styles').sort().map(f=>fs.readFileSync(W+'app/styles/'+f,'utf8')).join('').replace(/@import[^;]*;/g,'').replace(/@theme inline\{[^\n]*\n/,'');
const reset='*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}button,input,select,textarea{font:inherit;color:inherit;background-color:transparent;border-radius:0}button{cursor:pointer}ol,ul{list-style:none;margin:0;padding:0}h1,h2,h3,h4,p,dl,dd,figure{margin:0}a{color:inherit;text-decoration:inherit}img,svg{display:block}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}hr{border:0;border-top:1px solid #8884;margin:4px 0}';
const frame='.sb-frame{display:flex;min-height:100vh}.app-sidebar{width:16rem;flex:none;position:sticky;top:0;height:100vh;align-self:flex-start}.sb-inner{display:flex;flex-direction:column;height:100%}.sb-inset{flex:1;min-width:0;display:flex;flex-direction:column}@media(max-width:767px){.app-sidebar{display:none}}'
 +'.dlg-frame{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#6b6b6b}@media(max-width:767px){.dlg-frame{padding:0;display:block;background:var(--surface)}}[data-slot=dialog-content]{position:relative;display:grid;gap:16px;width:100%;max-width:512px;padding:24px;border:1px solid var(--line);border-radius:24px;background:var(--surface);color:var(--fg)}.cap-dialog{display:flex!important}.question-dialog{max-width:860px}[data-slot=tabs]{display:grid;gap:12px}[role=tablist]{display:flex;gap:4px}[role=tab]{padding:8px 12px;border-radius:8px}[role=tab][aria-selected=true]{background:var(--inner2);font-weight:700}[data-slot=dropdown-menu-content]{display:block}[data-slot=dropdown-menu-content][hidden]{display:none}[data-slot=dropdown-menu-content]{position:absolute;z-index:5;right:0;background:var(--surface);min-width:176px}.defter-count,.dialog-actions{position:relative}.defter-count [data-slot=dropdown-menu-content]{top:calc(100% + 4px)}.dialog-actions [data-slot=dropdown-menu-content]{bottom:calc(100% + 4px)}[data-slot=dropdown-menu-content]{border:1px solid var(--line);border-radius:12px;padding:4px;box-shadow:0 8px 24px #0003}[data-slot=dropdown-menu-item]{display:flex;align-items:center;gap:8px;padding:6px 8px}';
const calm='*{animation:none!important;transition:none!important}[data-rv]{opacity:1!important;transform:none!important}';
const wrap=(html,dark)=>`<!doctype html><html lang="tr" data-theme="${dark?'dark':'light'}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${reset}</style><style>${css}</style><style>${frame}${calm}</style></head><body>${html}</body></html>`;
const sizes=[[1440,900],[390,844]];
const only=process.env.ONLY;const screens={
 'defter':()=>S.defter(),
 'defter-filtre':()=>S.defter({filtersOpen:true}),
 'defter-menu':()=>S.defter(),
 'defter-bos':()=>S.defter({rows:[]}),
 'defter-kontrol':()=>S.defter({rows:S.pendingRows}),
 'yukle-bos':()=>S.pick(0),
 'yukle-fotolu':()=>S.pick(5),
 'yukle-ai-kapali':()=>S.pick(3,false),
 'etiket':()=>S.tag(false),
 'soru':()=>S.soru(),
};
if(MODE==='onceki')delete screens['defter-menu'];
const b=await chromium.launch();const meas={};
for(const [name,mk] of Object.entries(screens)){if(only&&!name.includes(only))continue;
 for(const [w,h] of sizes)for(const dark of [false,true]){
  const th=dark?'koyu':'acik';const p=await b.newPage({viewport:{width:w,height:h}});await p.setContent(wrap(mk(),dark));
  if(name==='defter-menu')await p.evaluate(()=>document.querySelectorAll('[data-slot=dropdown-menu-content]').forEach(e=>e.removeAttribute('hidden')));
  if(name==='soru')await p.evaluate(()=>document.querySelectorAll('[data-slot=dropdown-menu-content]').forEach(e=>e.removeAttribute('hidden')));
  const file=`${name}-${w}-${th}-${MODE==='onceki'?'onceki':'sonraki'}.png`;
  await p.screenshot({path:OUT+'/'+file,fullPage:true});
  meas[`${name}-${w}-${th}`]=await p.evaluate(()=>{
   const vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('[hidden]')};
   const small=[...document.querySelectorAll('button,a,[role=tab],input:not([type=file]),.choice')].filter(e=>vis(e)&&!e.classList.contains('sr-only')&&e.getBoundingClientRect().height<43.5).map(e=>(e.getAttribute('aria-label')||e.textContent||e.className).trim().slice(0,26)+' '+Math.round(e.getBoundingClientRect().height));
   const cobalt=[...document.querySelectorAll('button,a')].filter(e=>vis(e)&&getComputedStyle(e).backgroundColor==='rgb(52, 84, 209)').map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,28));
   const r=s=>{const e=document.querySelector(s);if(!e||!vis(e))return null;const x=e.getBoundingClientRect();return {w:Math.round(x.width),h:Math.round(x.height),x:Math.round(x.x),y:Math.round(x.y)}};
   const overflow=[...document.querySelectorAll('.tag-card,.cap-btn,.cap-shot,.filters-panel,.pending-strip,.defter-row')].filter(e=>vis(e)&&e.getBoundingClientRect().right>document.documentElement.clientWidth+0.5).length;
   return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,kobalt:cobalt,kucukHedef:small,tasan:overflow,dialog:r('[data-slot=dialog-content]'),capBtn:r('.cap-btn'),capShot:r('.cap-shot'),filtersBtn:r('.filters-btn'),exportBtn:r('.export-btn'),strip:r('.pending-strip'),bar:r('.defter-bar'),satir1:[...document.querySelectorAll('.defter-row>*')].map(e=>Math.round(e.getBoundingClientRect().y))}});
  console.log(file,JSON.stringify(meas[`${name}-${w}-${th}`]).slice(0,420));await p.close()}}
fs.writeFileSync(OUT+`/olcum-${MODE}.json`,JSON.stringify(meas,null,1));await b.close();fs.rmSync(tmp,{recursive:true,force:true});
