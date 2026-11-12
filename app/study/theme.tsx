"use client";
import {useSyncExternalStore} from 'react';
import {Monitor,Moon,Sun} from '@/components/icons';
import {THEME_KEY as KEY} from './theme-script';
export type ThemePref='system'|'light'|'dark';
const EVENT='nd-theme-change';
export function readTheme():ThemePref{try{const t=localStorage.getItem(KEY);return t==='light'||t==='dark'?t:'system'}catch{return 'system'}}
export function applyTheme(t:ThemePref){const root=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){root.classList.add('theme-anim');window.setTimeout(()=>root.classList.remove('theme-anim'),350)}if(t==='system')root.removeAttribute('data-theme');else root.setAttribute('data-theme',t);try{if(t==='system')localStorage.removeItem(KEY);else localStorage.setItem(KEY,t)}catch{}window.dispatchEvent(new Event(EVENT))}
const subscribe=(cb:()=>void)=>{window.addEventListener(EVENT,cb);window.addEventListener('storage',cb);return()=>{window.removeEventListener(EVENT,cb);window.removeEventListener('storage',cb)}};
const options:{id:ThemePref;label:string;icon:typeof Sun}[]=[{id:'system',label:'Cihaz ayarı',icon:Monitor},{id:'light',label:'Açık',icon:Sun},{id:'dark',label:'Koyu',icon:Moon}];
export function ThemeSwitch(){
 const pref=useSyncExternalStore(subscribe,readTheme,()=>'system' as ThemePref);
 return <div className="segmented theme-switch" role="radiogroup" aria-label="Görünüm">{options.map(({id,label,icon:Icon})=><button key={id} type="button" role="radio" aria-checked={pref===id} className={pref===id?'on':''} onClick={()=>applyTheme(id)}><Icon size={15}/> {label}</button>)}</div>
}
