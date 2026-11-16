// Kenar çubuğu DERSLER bölümü önizlemesi: GERÇEK app/globals.css + LessonItem işaretlemesinin elle yazılmış karşılığı (Next çalıştırılmadı). Sayılar örnektir.
// Çalıştırma: ND_ROOT=<worktree> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/npm-tools/node_modules node docs/proof/foto-soru-gorsel-not/sidebar-preview.mjs
import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('/opt/npm-tools/node_modules/x.cjs');const {chromium}=require('playwright');
const W=process.env.ND_ROOT+'/';
const css=fs.readFileSync(W+'app/globals.css','utf8').replace(/@import[^;]*;/g,'').replace(/@theme inline\{[^\n]*\n/,'');
const item=(n,c,d)=>`<li data-slot="sidebar-menu-item"><button data-slot="sidebar-menu-button"><span class="lesson-dot dot-${d}"></span><span>${n}</span><span class="lesson-count">${c}</span></button></li>`;
const html=`<!doctype html><html lang="tr"><head><style>*{box-sizing:border-box}ul{list-style:none;margin:0;padding:0}button{display:flex;align-items:center;gap:10px;width:100%;padding:0 12px;border:0;background:none;font:inherit;text-align:left}</style><style>${css}</style></head><body><div class="app-sidebar"><div data-slot="sidebar-inner" style="width:260px;padding:16px"><p class="nav-label lesson-label" style="margin-top:0">DERSLER</p><ul data-slot="sidebar-menu">${item('Matematik',12,0)}${item('Fizik',5,1)}${item('Kontrol bekleyenler',3,-1)}</ul></div></div></body></html>`;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:300,height:220}});await p.setContent(html);await p.screenshot({path:W+'docs/proof/foto-soru-gorsel-not/sidebar-review.png'});await b.close();
