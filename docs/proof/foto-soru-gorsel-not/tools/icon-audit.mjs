const W=(process.env.ND_ROOT||process.cwd())+'/';
const {GLYPHS}=await import(W+'components/icons/glyphs.ts');
import fs from 'fs';
import {createRequire} from 'module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
// 1) içe aktarma/dışa aktarma
const idx=fs.readFileSync(W+'components/icons/index.tsx','utf8');
const exported=new Set([...idx.matchAll(/export const (\w+) = createIcon\("(\w+)"\)/g)].map(m=>m[1]));
const bad=[...idx.matchAll(/createIcon\("(\w+)"\)/g)].filter(m=>!(m[1] in GLYPHS)).map(m=>m[1]);
const used=new Set();
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','.next','.git','.claude','docs'].includes(e.name))continue;const p=d+'/'+e.name;if(e.isDirectory())walk(p);else if(/\.(tsx?|mjs)$/.test(e.name)){const s=fs.readFileSync(p,'utf8');for(const m of s.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](?:@\/components\/icons|\.\.?\/[^'"]*icons)['"]/g))m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach(n=>used.add(n))}}};
walk(W+'app');walk(W+'components');if(fs.existsSync(W+'lib'))walk(W+'lib');
const missing=[...used].filter(n=>!exported.has(n)&&!/^(type\s)/.test(n)&&!['Icon','IconProps','GlyphName'].includes(n));
console.log('dışa aktarılan:',exported.size,'| içe aktarılan ad:',used.size,'| EKSİK:',JSON.stringify(missing),'| bilinmeyen glif:',JSON.stringify(bad));
// 2) XML + ink + sınır
const b=await chromium.launch();const p=await b.newPage();
const res=await p.evaluate((G)=>{const out={xml:[],ink:{},edge:[]};
 for(const [n,i] of Object.entries(G)){
  const d=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${i}</svg>`,'image/svg+xml');
  if(d.querySelector('parsererror'))out.xml.push(n);
  out.ink[n]=(i.match(/nd-ink/g)||[]).length;
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('stroke-width','1.75');s.innerHTML=i;document.body.appendChild(s);
  const bb=s.getBBox();const h=.875;const m=Math.min(bb.x-h,bb.y-h,24-(bb.x+bb.width+h),24-(bb.y+bb.height+h));
  if(m<1-1e-6)out.edge.push([n,+m.toFixed(2)]);s.remove();}
 return out},GLYPHS);
await b.close();
console.log('geçerli XML dışı:',JSON.stringify(res.xml),'| glif sayısı:',Object.keys(GLYPHS).length);
console.log('ink>1:',JSON.stringify(Object.entries(res.ink).filter(([,v])=>v>1)),'| ink=1:',Object.values(res.ink).filter(v=>v===1).length,'| ink=0:',Object.values(res.ink).filter(v=>v===0).length);
console.log('güvenli kenar <1 (stroke dahil):',JSON.stringify(res.edge));
// ink.json yazılmaz (çalışma ağacını kirletmesin)
