// Konu videosu otomatik yükleme akışı tarayıcıda (Playwright). Bileşen mantığı (anahtar, hata durumu, StrictMode) küçük bir koşum bileşeninde
// GERÇEK yardımcılarla (lib/video-call.ts, lib/solve-result.ts) çalışır; QuestionDialog'un kendisi (useStudy/Dialog bağımlılıkları) yüklenmez.
// esbuild/playwright/tarayıcı bulunamazsa test BAŞARISIZ olur (sessiz atlama yok).
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {join,dirname,delimiter,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync('/opt/pw-browsers'))process.env.PLAYWRIGHT_BROWSERS_PATH='/opt/pw-browsers';
const up=[];for(let d=resolve(root);;d=dirname(d)){up.push(join(d,'node_modules'));if(dirname(d)===d)break}
const dirs=[...new Set([...(process.env.NODE_PATH||'').split(delimiter).filter(Boolean),'/opt/npm-tools/node_modules',...up])];
let NM=null,esbuild=null,chromium=null;
for(const d of dirs){try{const r=createRequire(join(d,'x.cjs'));esbuild=r('esbuild');chromium=r('playwright').chromium;r.resolve('react-dom/client');NM=d;break}catch{}}
let js='',browser=null;
const entry=`
import React,{useEffect,useRef,useState,StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {shouldAutoLoad,autoKey,emptyVideosMessage} from './lib/video-call.ts';
import {buildCombined} from './lib/solve-result.ts';
const log=window.LOG={req:[]};
const A0={readable:true,subject:'Matematik',topic:'Türev',transcription:'x',answer:'A',steps:['1'],pitfall:'',note:'',confidence:'yüksek',answerKeyMatch:null,errorType:''};
function AutoVideos({onLoad}){useEffect(()=>{onLoad()},[]);return null}
function Dlg({mode,solvedTopic}){
 const [row,setRow]=useState({id:'q1',subject:'Matematik',topic:'Türev',analysis:null});const [busy,setBusy]=useState(false);const [show,setShow]=useState(true);
 const autoTried=useRef(new Set()),autoFailed=useRef(new Set());const a=row.analysis;const vids=a?.videos||[];const key=autoKey(row,Array.isArray(a?.steps));
 window.toggle=()=>setShow(s=>!s);
 window.solve=()=>{const t=solvedTopic;const c=buildCombined(A0,'Matematik',t,'',null,a,row);setRow({...row,topic:t,analysis:c})};
 async function videos(){setBusy(true);try{log.req.push(row.topic);await new Promise(r=>setTimeout(r,30));if(mode==='fail')throw new Error('ağ');autoFailed.current.delete(key);
  const na={...(a||{}),videos:mode==='empty'?[]:[{url:'u'}],videoNotice:''};setRow(r=>({...r,analysis:na}))}catch{autoFailed.current.add(key)}finally{setBusy(false)}}
 if(!show)return <div>closed</div>;
 return <div>{shouldAutoLoad({count:vids.length,notice:a?.videoNotice,busy,tried:autoTried.current.has(key)})&&<AutoVideos onLoad={()=>{if(!autoTried.current.has(key)){autoTried.current.add(key);void videos()}}}/>}
  <p id="m">{vids.length?'has:'+vids.length:emptyVideosMessage({busy,notice:a?.videoNotice,tried:autoTried.current.has(key),failed:autoFailed.current.has(key)})}</p></div>}
window.start=(mode,strict,solvedTopic)=>{const t=<Dlg mode={mode} solvedTopic={solvedTopic}/>;createRoot(document.getElementById('root')).render(strict?<StrictMode>{t}</StrictMode>:t)};
`;
before(async()=>{
  assert.ok(NM&&esbuild&&chromium,'esbuild/playwright/react-dom bulunamadı; aranan yollar: '+dirs.join(', '));
  const r=await esbuild.build({stdin:{contents:entry,resolveDir:root,loader:'jsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'transform',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM]});
  js=r.outputFiles[0].text;browser=await chromium.launch();
});
after(async()=>{if(browser)await browser.close()});
async function run(mode,strict,solvedTopic,steps){const p=await browser.newPage();await p.setContent('<div id=root></div>');await p.addScriptTag({content:js});
  await p.evaluate(([m,s,t])=>window.start(m,s,t),[mode,strict,solvedTopic]);await p.waitForTimeout(300);
  for(const st of steps){await p.evaluate(st);await p.waitForTimeout(300)}
  const out=await p.evaluate(()=>({req:[...window.LOG.req],m:document.getElementById('m').textContent}));await p.close();return out}
const reopenAfterSolve=['window.toggle()','window.solve()','window.toggle()'];
test('regresyon: video sekmesi çözümden önce açıldı, aynı konuyla çözüldü -> videolar korunur, ikinci istek yok',async()=>{
  const o=await run('ok',false,'Türev',reopenAfterSolve);assert.deepEqual(o.req,['Türev']);assert.equal(o.m,'has:1')});
test('regresyon: çözümde konu değişti -> videolar temizlenir ve yeni konu için yeniden yüklenir',async()=>{
  const o=await run('ok',false,'Limit',reopenAfterSolve);assert.deepEqual(o.req,['Türev','Limit']);assert.equal(o.m,'has:1')});
test('çözüm sonrası videolar boş kaldıysa (ilk deneme boş döndü) otomatik yükleme yeniden denenir',async()=>{
  const o=await run('empty',false,'Türev',reopenAfterSolve);assert.equal(o.req.length,2)});
test('ağ hatası: "Video bulunamadı" değil "Videolar yüklenemedi" gösterilir, döngü yok',async()=>{
  const o=await run('fail',false,'Türev',['window.toggle()','window.toggle()']);assert.equal(o.req.length,1);assert.match(o.m,/Videolar yüklenemedi/);assert.doesNotMatch(o.m,/bulunamadı/)});
test('boş sonuç: "Video bulunamadı" gösterilir',async()=>{
  const o=await run('empty',false,'Türev',[]);assert.match(o.m,/Video bulunamadı/)});
test('StrictMode çift effect: tek istek',async()=>{
  const o=await run('ok',true,'Türev',[]);assert.equal(o.req.length,1)});
