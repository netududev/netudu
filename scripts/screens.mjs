#!/usr/bin/env node
// Sayfa ekran görüntüleri: 1440x900 ve 390x844, açık ve koyu tema.
//
// Kullanım:
//   node scripts/screens.mjs <BASE_URL> <OUT_DIR> [--cookie "ad=değer"] [--paths "/,/study"]
//
// Çıktı: <OUT_DIR>/<yol-slug>-<genişlik>-<tema>.png (deviceScaleFactor 1).
// Global kurulu Playwright gerekir (npm i -g playwright; gerekirse PLAYWRIGHT_BROWSERS_PATH).
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const VIEWPORTS=[{width:1440,height:900},{width:390,height:844}];
const THEMES=['light','dark'];
// app/study/theme-script.ts ile aynı anahtar (değerler 'light' | 'dark')
const THEME_KEY='nd-theme';

export function slugFromPath(path){
  const clean=path.split(/[?#]/)[0].replace(/^\/+|\/+$/g,'');
  return clean?clean.replace(/\/+/g,'-'):'ana';
}
export const outputName=(path,width,theme)=>`${slugFromPath(path)}-${width}-${theme}.png`;

export function parseArgs(argv){
  const pos=[];let cookie;let paths=['/'];
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--cookie')cookie=argv[++i];
    else if(argv[i]==='--paths')paths=(argv[++i]||'').split(',').map(s=>s.trim()).filter(Boolean);
    else pos.push(argv[i]);
  }
  if(pos.length<2)throw new Error('Kullanım: node scripts/screens.mjs <BASE_URL> <OUT_DIR> [--cookie "ad=değer"] [--paths "/,/study"]');
  return {base:pos[0],outDir:pos[1],cookie,paths};
}

function loadPlaywright(){
  const require=createRequire(import.meta.url);
  try{return require('playwright')}catch{}
  try{return require(join(execSync('npm root -g',{encoding:'utf8'}).trim(),'playwright'))}catch{}
  throw new Error('Playwright bulunamadı: "npm i -g playwright" ile kurun (gerekirse NODE_PATH ya da PLAYWRIGHT_BROWSERS_PATH verin).');
}

async function main(argv){
  const {base,outDir,cookie,paths}=parseArgs(argv);
  const {chromium}=loadPlaywright();
  mkdirSync(outDir,{recursive:true});
  const browser=await chromium.launch();
  try{
    for(const viewport of VIEWPORTS)for(const theme of THEMES){
      const ctx=await browser.newContext({viewport,deviceScaleFactor:1,colorScheme:theme});
      await ctx.addInitScript(([k,v])=>{try{localStorage.setItem(k,v)}catch{}},[THEME_KEY,theme]);
      if(cookie){
        const i=cookie.indexOf('=');
        await ctx.addCookies([{name:cookie.slice(0,i),value:cookie.slice(i+1),url:base}]);
      }
      const page=await ctx.newPage();
      for(const path of paths){
        await page.goto(new URL(path,base).href,{waitUntil:'networkidle'});
        const file=join(outDir,outputName(path,viewport.width,theme));
        await page.screenshot({path:file});
        console.log(file);
      }
      await ctx.close();
    }
  }finally{await browser.close()}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main(process.argv.slice(2)).catch(e=>{console.error('HATA: '+e.message);process.exitCode=1});
}
