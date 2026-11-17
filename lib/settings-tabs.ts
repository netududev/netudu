// Ayarlar sekmeleri: saf mantık (React/DOM yok; node:test ile sınanır). Bileşen: app/study/settings.tsx.
// Seçili sekme türetilir: kullanıcının seçimi + hesap türü → geçerli sekme. Effect ile sıfırlama yoktur.
import type {Profile} from './study';
export type SettingsTab='profile'|'membership'|'data'|'account'|'developer';
export type SettingsSection='profile'|'plan'|'appearance'|'membership'|'usage'|'backup'|'export'|'report'|'account'|'workspace'|'users'|'openai'|'supabase';
export const DEFAULT_SETTINGS_TAB:SettingsTab='profile';
const ALL:{id:SettingsTab;label:string;sections:SettingsSection[];devOnly?:boolean}[]=[
 {id:'profile',label:'Profil',sections:['profile','plan','appearance']},
 {id:'membership',label:'Üyelik',sections:['membership','usage']},
 {id:'data',label:'Veri',sections:['backup','export','report']},
 {id:'account',label:'Hesap',sections:['account','workspace']},
 {id:'developer',label:'Geliştirici',sections:['users','openai','supabase'],devOnly:true},
];
// Geliştirici sekmesi yalnız geliştirici hesabında vardır.
export const settingsTabs=(isDev:boolean)=>ALL.filter(t=>!t.devOnly||isDev).map(({id,label})=>({id,label}));
export const tabSections=(tab:SettingsTab):SettingsSection[]=>ALL.find(t=>t.id===tab)?.sections??[];
// Seçim geçerli değilse (bilinmeyen kimlik ya da geliştirici olmayan hesapta Geliştirici) Profil'e düşer.
export const resolveTab=(picked:string|null|undefined,isDev:boolean):SettingsTab=>settingsTabs(isDev).find(t=>t.id===picked)?.id??DEFAULT_SETTINGS_TAB;
// Profil formu kayıtlı profilden farklı mı: Kaydet yalnız değişiklik varken etkin. Sayısal alanlar sayıya çevrilerek karşılaştırılır.
const norm=(p:Profile)=>[p.name.trim(),p.grade,Number(p.examYear),p.examDate,p.target.trim(),p.school.trim(),Number(p.dailyGoal)||0,p.motto.trim()];
export const isProfileDirty=(form:Profile,saved:Profile)=>JSON.stringify(norm(form))!==JSON.stringify(norm(saved));
