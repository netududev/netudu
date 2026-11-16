// Statik önizleme (kabuk + giriş sayfası): GERÇEK app/styles/*.css + GERÇEK bileşenlerin react-dom/server çıktısı.
// Radix/shadcn kabukları düz karşılıklarla (scripts/preview/ui-stubs.tsx) değiştirilir; Next/React çalıştırılmaz, tailwind derlenmez
// (preflight yerine eşdeğer sıfırlama eklenir). Yazı tipi bu makinede Manrope değil, yedek yazı tipidir. Ekrandaki veriler ÖRNEKTİR.
// Çalıştırma: ND_ROOT=<çalışma dizini> MODE=onceki|sonraki OUT=<çıktı dizini> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/shell-preview.mjs
// MODE=onceki: kabuk için docs/proof/feat-kabuk-ve-giris/before-frame.tsx (taban kabuğunun kopyası); CSS ND_ROOT'un app/styles'ı (onceki için taban CSS'i içeren dizini ND_ROOT verin).
import fs from 'node:fs';import {createRequire} from 'node:module';
const NM='/opt/npm-tools/node_modules';const require=createRequire(NM+'/x.cjs');const {chromium}=require('playwright');const esbuild=require('esbuild');
const W=process.env.ND_ROOT+'/',MODE=process.env.MODE||'sonraki',OUT=process.env.OUT||W+'docs/proof/feat-kabuk-ve-giris';
const SRC=process.env.SRC_ROOT?process.env.SRC_ROOT+'/':W; // bileşen/stub kaynağı (before-frame.tsx ve entry)
const tmp=fs.mkdtempSync('/tmp/nd-shell-');const STUB=SRC+'scripts/preview/ui-stubs.tsx';
await esbuild.build({entryPoints:[SRC+'scripts/preview/shell-entry.tsx'],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'error',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
 alias:{'@':W.replace(/\/$/,''),'sonner':STUB},plugins:[{name:'stubs',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner)$/},()=>({path:STUB}));b.onResolve({filter:/^@\/docs\/proof\//},a=>({path:SRC+a.path.slice(2)+'.tsx'}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
const S=require(tmp+'/ssr.cjs');
const parts=fs.readdirSync(W+'app/styles').sort().map(f=>fs.readFileSync(W+'app/styles/'+f,'utf8')).join('');
const css=parts.replace(/@import[^;]*;/g,'').replace(/@theme inline\{[^\n]*\n/,'');
const reset='*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}button,input,select,textarea{font:inherit;color:inherit;background-color:transparent;border-radius:0}button{cursor:pointer}ol,ul{list-style:none;margin:0;padding:0}h1,h2,h3,h4,p,dl,dd,figure{margin:0}a{color:inherit;text-decoration:inherit}img,svg{display:block}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}';
// tailwind yerine: sabit 16rem kenar çubuğu (>=768px), içerik alanı kalan genişlik; mobilde kenar çubuğu kapalı (Sheet)
const frame='.sb-frame{display:flex;min-height:100vh}.app-sidebar{width:16rem;flex:none;position:sticky;top:0;height:100vh;align-self:flex-start}.sb-inner{display:flex;flex-direction:column;height:100%}.sb-inset{flex:1;min-width:0;display:flex;flex-direction:column}@media(max-width:767px){.app-sidebar{display:none}}';
const calm='*{animation:none!important;transition:none!important}.lp-hero h1,.lp-lead,.lp-cta,.lp-visual,.lp-float{opacity:1!important;transform:none}.lp-sheet{transform:rotate(-4deg)!important}body{min-height:100vh}[data-rv]{opacity:1!important;transform:none!important}';
const wrap=(html,dark)=>`<!doctype html><html lang="tr" data-theme="${dark?'dark':'light'}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${reset}</style><style>${css}</style><style>${frame}${calm}</style></head><body>${html}</body></html>`;
const mk=MODE==='onceki'?S.oldShell:S.shell;
const sizes=[[1440,900],[390,844]];
const shots=[];
for(const [w,h] of sizes)for(const dark of [false,true]){
 const th=dark?'koyu':'acik';
 shots.push([`landing-${w}-${th}`,w,h,S.landing(),dark,true]);
 shots.push([`defter-${w}-${th}`,w,h,mk('archive'),dark,false]);
 shots.push([`bugun-bos-${w}-${th}`,w,h,mk('home'),dark,false]);
}
shots.push(['ayarlar-1568-acik',1568,900,mk('settings'),false,false],['notlar-1568-acik',1568,900,mk('notes'),false,false],['defter-1568-acik',1568,900,mk('archive'),false,false]);
const only=process.env.ONLY;const meas={};
const b=await chromium.launch();
for(const [name,w,h,html,dark,full] of shots){if(only&&!name.includes(only))continue;const p=await b.newPage({viewport:{width:w,height:h}});await p.setContent(wrap(html,dark));
 await p.screenshot({path:`${OUT}/${name}-${MODE}.png`,fullPage:full});
 meas[name]=await p.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),right:Math.round(b.right)}};
  const vis=e=>{const b=e.getBoundingClientRect(),cs=getComputedStyle(e);return b.width>0&&b.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
  const cobalt=[...document.querySelectorAll('button,a')].filter(e=>vis(e)&&getComputedStyle(e).backgroundColor==='rgb(52, 84, 209)'&&e.getBoundingClientRect().top<innerHeight&&!e.classList.contains('lesson-count')).map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,30)+'['+e.className+']');
  const grad=[...document.querySelectorAll('*')].flatMap(e=>['::before','::after'].map(ps=>[e,ps])).filter(([e,ps])=>{const c=getComputedStyle(e,ps);return c.content!=='none'&&/gradient/.test(c.backgroundImage)&&!/rgba\(255, 255, 255/.test(c.backgroundImage)}).map(([e,ps])=>e.className+ps);
  const gap=(()=>{const t=document.querySelector('.target-card'),p=document.querySelector('.app-sidebar .profile');return t&&p&&vis(t)?Math.round(p.getBoundingClientRect().top-t.getBoundingClientRect().bottom):null})();
  return {sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,workspace:r('.workspace'),view:r('.view'),topbar:r('.topbar'),trigger:r('.topbar [data-slot=sidebar-trigger]'),add:vis(document.querySelector('.topbar-add')||document.body)&&document.querySelector('.topbar-add')?r('.topbar-add'):null,crumb:!!document.querySelector('.crumb'),eyebrowInHeading:!!document.querySelector('.page-heading .eyebrow'),statusBtns:document.querySelectorAll('.topbar .status').length,navHasCreate:[...document.querySelectorAll('.app-sidebar [data-slot=sidebar-menu-button]')].some(e=>/Programı oluştur/.test(e.textContent)),targetToProfileGap:gap,cobaltAboveFold:cobalt,coloredGradientPseudos:grad,h1:r('h1'),fab:r('.mobile-bar .fab'),heroH1Font:document.querySelector('.lp-hero h1')?getComputedStyle(document.querySelector('.lp-hero h1')).fontSize:null,hero:r('.lp-hero'),copy:r('.lp-hero-copy'),visual:r('.lp-visual')}});
 console.log(name,MODE,JSON.stringify(meas[name]).slice(0,600));await p.close()}
fs.writeFileSync(`${OUT}/olcum-${MODE}.json`,JSON.stringify(meas,null,1));
await b.close();fs.rmSync(tmp,{recursive:true,force:true});
