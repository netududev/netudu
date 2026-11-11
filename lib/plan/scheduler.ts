// Kişisel ders çalışma programı motoru (TYT çalışma sırası + okul ve sabit düzen).
// Algoritmalar github.com/keremisthebabo/tyt (js/scheduler.js) temel alınarak TypeScript'e taşındı ve şu hatalar düzeltildi:
//  - Başlığında "dershane/okul/lise" geçen bir blok artık okul saatlerini silmiyor (okul yalnızca ayarlardan kapanır).
//  - Okul ve sabit bloklar arasındaki saat çakışmaları uyarı olarak raporlanıyor.
//  - Program takvime bağlı: başlangıç tarihi + gün sırası → bugünün dersi; tamamlanan dersler kaydırmada dersle birlikte kayar.
//  - Kenar durumlar: boş gün, çakışan bloklar, gece yarısını aşan saatler ve geçersiz saat girişi hata vermez (bkz. normalizePlanConfig).
//  - Eski kayıtlardaki `sport` alanı okunurken yok sayılır (spor özelliği kaldırıldı).
import {ALL_DAYS,DAY_FULL_NAMES,DIRECT_CHANNELS,LINEAR_CURRICULUM,MACRO_PHASES,TEMPO_OPTIONS,WEEKS_DATABASE,type DayKey,type TempoKey,type Unit} from './curriculum';

export type FixedBlock={id:string;title:string;days:DayKey[];start:string;end:string};
export type PlanConfig={
 school:{enabled:boolean;title:string;days:DayKey[];start:string;end:string};
 fixedBlocks:FixedBlock[];
 tempo:TempoKey;
 dayStart:string;dayEnd:string;
 startDate:string;
 alarm:{enabled:boolean;time:string;blockReminders:boolean};
};
export type OffDay={date:string;topic:string};
export type PlanState={config:PlanConfig;done:Record<string,string>;offDays:Record<string,OffDay>;updated_at?:string};
export type Lesson={index:number;weekNum:number;phaseId:number;subj:string;topic:string;teacher:string;target:string;directUrl:string;channelUrl:string;note:string};
export type CampaignWeek={weekNum:number;phaseId:number;phaseName:string;title:string;desc:string;days:Lesson[]};
export type DayItem={type:'school'|'fixed'|'study'|'off';startMin:number;endMin:number;start:string;end:string;title:string;detail:string;tag:string;fitted:boolean};
export type DayPlan={date:string;dayKey:DayKey;dayName:string;slot:number;isOff:boolean;lesson:Lesson|null;finished:boolean;shifted:boolean;items:DayItem[];warnings:string[]};

export {ALL_DAYS,DAY_FULL_NAMES,TEMPO_OPTIONS,MACRO_PHASES};
export type {DayKey,TempoKey};

// ---------- zaman yardımcıları ----------
const DAY_END=24*60;
// "SS:DD" → dakika; geçersiz girişte null (24:00 gün sonu sayılır)
export function parseTime(t:unknown):number|null{if(typeof t!=='string')return null;const m=/^\s*(\d{1,2}):(\d{2})\s*$/.exec(t);if(!m)return null;const h=Number(m[1]),mi=Number(m[2]);if(mi>59||h>24||(h===24&&mi>0))return null;return h*60+mi}
export function toMin(t:string,fallback=9*60){const v=parseTime(t);return v===null?fallback:Math.min(DAY_END-1,v)}
export function fmt(min:number){const s=Math.max(0,Math.min(23*60+59,Math.round(Number.isFinite(min)?min:0)));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
// Saat aralığı. Bitiş başlangıçtan önceyse blok gece yarısını aşar (o günün sonuna kadar sürer, kalanı ertesi güne taşar);
// bitiş = başlangıç ya da geçersiz giriş ise `fallback` süresi uygulanır ve valid=false döner.
export function range(start:string,end:string,fallback=60){const a=toMin(start,9*60),pe=parseTime(end);const okStart=parseTime(start)!==null,okEnd=pe!==null;
 if(okStart&&okEnd&&pe!==a){const b0=Math.min(DAY_END,pe);if(b0>a)return {startMin:a,endMin:b0,start:fmt(a),end:pe===DAY_END?'24:00':fmt(b0),valid:true,overnight:false,tailMin:0};
  return {startMin:a,endMin:DAY_END,start:fmt(a),end:'24:00',valid:true,overnight:true,tailMin:Math.min(pe,DAY_END)}}
 const b=Math.min(DAY_END-1,a+fallback);return {startMin:a,endMin:b,start:fmt(a),end:fmt(b),valid:false,overnight:false,tailMin:0}}
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function daysBetween(from:string,to:string){return Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000)}
export function dayKeyOf(date:string):DayKey{const js=new Date(date+'T12:00:00Z').getUTCDay();return ALL_DAYS[js===0?6:js-1]}

export function defaultPlanConfig(today:string,grade='12'):PlanConfig{return {
 school:{enabled:grade!=='Mezun',title:'Okul',days:['Pzt','Sal','Çar','Per','Cum'],start:'08:00',end:'16:00'},
 fixedBlocks:[],tempo:'balanced',
 dayStart:'08:00',dayEnd:'23:30',startDate:today,alarm:{enabled:true,time:'08:00',blockReminders:true}}}

// ---------- boş saat bulma ----------
type Busy={startMin:number;endMin:number;buffer?:number};
export function allocateFreeSlots(busy:Busy[],durations0:number[],win0={startMin:8*60,endMin:23*60+30}){
 // Geçersiz girişler çökmez: sayı olmayan süreler 30 dk sayılır (dizin hizası korunur), pencere ters/bozuksa varsayılan pencere kullanılır.
 const durations=durations0.map(d=>Number.isFinite(d)&&d>0?d:30);
 const win=Number.isFinite(win0.startMin)&&Number.isFinite(win0.endMin)&&win0.endMin>win0.startMin?win0:{startMin:8*60,endMin:23*60+30};
 const work=busy.filter(b=>Number.isFinite(b.startMin)&&Number.isFinite(b.endMin)).map(b=>({startMin:Math.max(0,b.startMin),endMin:Math.min(24*60,b.endMin+(b.buffer??15))})).filter(b=>b.endMin>b.startMin).sort((a,b)=>a.startMin-b.startMin);
 const slots:{startMin:number;endMin:number;fitted:boolean}[]=[];let collision=false;
 for(let i=0;i<durations.length;i++){const dur=durations[i];const left=durations.length-i;let cursor=win.startMin;let placed:{startMin:number;endMin:number;fitted:boolean}|null=null;let largest:{startMin:number;len:number}|null=null;
  for(const iv of [...work].sort((a,b)=>a.startMin-b.startMin)){if(iv.startMin>cursor){const len=iv.startMin-cursor;if(!largest||len>largest.len)largest={startMin:cursor,len};if(len>=dur){placed={startMin:cursor,endMin:cursor+dur,fitted:true};break}}if(iv.endMin>cursor)cursor=iv.endMin}
  if(!placed){if(win.endMin>cursor){const len=win.endMin-cursor;if(!largest||len>largest.len)largest={startMin:cursor,len}}
   if(cursor+dur<=win.endMin)placed={startMin:cursor,endMin:cursor+dur,fitted:true};
   else{collision=true;const lateLeft=23*60+50-cursor;
    if(lateLeft>=45)placed={startMin:cursor,endMin:cursor+Math.min(dur,Math.floor(lateLeft/left)),fitted:false};
    else if(largest&&largest.len>=30){const len=Math.min(dur,Math.max(20,Math.floor(largest.len/left)));placed={startMin:largest.startMin,endMin:largest.startMin+len,fitted:false}}
    else{const s=Math.min(23*60+50,cursor);const len=Math.max(5,Math.floor(Math.max(10,23*60+59-s)/left));placed={startMin:s,endMin:Math.min(23*60+59,s+len),fitted:false}}}}
  slots.push(placed);work.push({startMin:placed.startMin,endMin:placed.endMin+15});work.sort((a,b)=>a.startMin-b.startMin)}
 return {slots,collision}}

// ---------- kamp haftaları (tempo) ----------
const phaseOf=(id:number)=>MACRO_PHASES.find(p=>p.id===id)||MACRO_PHASES[0];
const toLesson=(u:Pick<Unit,'subj'|'topic'|'teacher'|'directUrl'|'channelUrl'|'note'>,weekNum:number,phaseId:number,target:string):Lesson=>({index:0,weekNum,phaseId,subj:u.subj,topic:u.topic,teacher:u.teacher,target,directUrl:u.directUrl,channelUrl:u.channelUrl,note:u.note});
const cache=new Map<TempoKey,CampaignWeek[]>();
export function campaignWeeks(tempo:TempoKey='balanced'):CampaignWeek[]{const hit=cache.get(tempo);if(hit)return hit;const units=LINEAR_CURRICULUM;let weeks:CampaignWeek[]=[];
 if(tempo==='balanced')weeks=WEEKS_DATABASE.map(w=>({weekNum:w.weekNum,phaseId:w.phaseId,phaseName:phaseOf(w.phaseId).name,title:w.title,desc:w.desc,days:w.days.map(d=>toLesson(d,w.weekNum,w.phaseId,'50 Soru + Konu Tekrarı + 20 Paragraf'))}));
 else if(tempo==='relaxed'){const total=22;let c=0;for(let wn=1;wn<=total;wn++){const ph=MACRO_PHASES[Math.min(3,Math.floor((wn-1)/total*4))];const days:Lesson[]=[];let first='';
   for(let d=0;d<7;d++){const review=(d===2||d===6)&&c>0&&((total-wn)*7+(7-d))>(units.length-c);
    if(!review&&c<units.length){const u=units[c++];if(!first)first=u.topic;days.push(toLesson(u,wn,ph.id,'30 Soru + 1 Konu Videosu + 15 Paragraf'))}
    else if(c<units.length&&review){const p=units[Math.max(0,c-1)];days.push({...toLesson(p,wn,ph.id,'30 Pekiştirme Sorusu + 15 Paragraf + Yanlış Defteri'),subj:`${p.subj} Pekiştirme`,topic:`${p.topic} — Esnek Soru Çözümü & Tekrar`,note:`Pekiştirme günü: ${p.topic} konusundaki soru kalıplarını sindirerek tekrar et.`})}
    else days.push({index:0,weekNum:wn,phaseId:ph.id,subj:'Genel Deneme & Tekrar',topic:'TYT Karma Branş Denemesi & Yanlış Defteri Analizi',teacher:'Tüm Kadro',target:'30 Seçme Soru + Yanlış Defteri Taraması',directUrl:'https://www.youtube.com/watch?v=OY2MsClSr3U',channelUrl:DIRECT_CHANNELS.mertHoca,note:'Esnek programın tekrar ve deneme günü.'})}
   weeks.push({weekNum:wn,phaseId:ph.id,phaseName:ph.name,title:`${wn}. Hafta: ${first||'Genel Deneme & Pekiştirme'}`,desc:'Rahat tempo: günde 1,5–2 saatlik sindirerek ilerleme.',days})}}
 else{const total=12,slots=total*7;let c=0;for(let wn=1;wn<=total;wn++){const ph=MACRO_PHASES[Math.min(3,Math.floor((wn-1)/total*4))];const days:Lesson[]=[];let first='';
   for(let d=0;d<7;d++){const g=(wn-1)*7+d;const two=(units.length-c)>(slots-g)&&c+1<units.length;
    if(two){const a=units[c++],b=units[c++];if(!first)first=a.topic;days.push({...toLesson(a,wn,ph.id,'90 Soru + 2 Konu Videosu + Branş Taraması'),subj:a.subj===b.subj?a.subj:`${a.subj} + ${b.subj}`,topic:`${a.topic} & ${b.topic}`,teacher:a.teacher===b.teacher?a.teacher:`${a.teacher} / ${b.teacher}`,note:`Birleştirilmiş gün: 1) ${a.note} 2) ${b.note}`})}
    else if(c<units.length){const u=units[c++];if(!first)first=u.topic;days.push(toLesson(u,wn,ph.id,'90 Soru + Konu & İleri Soru + Branş Denemesi'))}}
   weeks.push({weekNum:wn,phaseId:ph.id,phaseName:ph.name,title:`${wn}. Hafta: ${first}`,desc:'Yoğun tempo: günde 4,5+ saatlik maksimum odak.',days})}}
 let i=0;for(const w of weeks)for(const d of w.days)d.index=i++;cache.set(tempo,weeks);return weeks}
export const flatLessons=(tempo:TempoKey)=>campaignWeeks(tempo).flatMap(w=>w.days);

// ---------- domino kaydırma: takvim günü → ders ----------
export function lessonAt(plan:PlanState,slot:number){const flat=flatLessons(plan.config.tempo);if(plan.offDays[String(slot)])return {isOff:true,lesson:null,shifted:false,finished:false};
 let before=0;for(const k of Object.keys(plan.offDays))if(Number(k)<slot)before++;const idx=slot-before;
 if(idx>=0&&idx<flat.length)return {isOff:false,lesson:flat[idx],shifted:before>0,finished:false};
 return {isOff:false,lesson:null,shifted:before>0,finished:idx>=flat.length}}
export const slotOf=(plan:PlanState,date:string)=>daysBetween(plan.config.startDate,date);
export const dateOf=(plan:PlanState,slot:number)=>addDays(plan.config.startDate,slot);

// ---------- yapılandırma normalleştirme ----------
const cleanDays=(v:unknown):DayKey[]=>Array.isArray(v)?ALL_DAYS.filter(d=>v.includes(d)):[];
const cleanTime=(v:unknown,f:string)=>{const m=parseTime(v);return m===null?f:fmt(Math.min(m,DAY_END-1))};
// Eski ya da bozuk kayıtları güvenle okur: spor alanı (kaldırıldı) yok sayılır, eksik/geçersiz alanlar varsayılanla tamamlanır.
export function normalizePlanConfig(raw:unknown,today=new Date().toISOString().slice(0,10)):PlanConfig{
 const r=(raw&&typeof raw==='object'?raw:{}) as Record<string,any>;const def=defaultPlanConfig(today);
 const sc=(r.school&&typeof r.school==='object'?r.school:{}) as Record<string,any>;const al=(r.alarm&&typeof r.alarm==='object'?r.alarm:{}) as Record<string,any>;
 const blocks=(Array.isArray(r.fixedBlocks)?r.fixedBlocks:[]).filter((b:any)=>b&&typeof b==='object').map((b:any,i:number)=>({id:String(b.id||`blok-${i}`),title:String(b.title??''),days:cleanDays(b.days),start:cleanTime(b.start,'18:00'),end:cleanTime(b.end,'19:00')})).filter((b:FixedBlock)=>b.days.length>0);
 return {
  school:{enabled:sc.enabled===undefined?def.school.enabled:!!sc.enabled,title:String(sc.title||'Okul'),days:sc.days===undefined?def.school.days:cleanDays(sc.days),start:cleanTime(sc.start,def.school.start),end:cleanTime(sc.end,def.school.end)},
  fixedBlocks:blocks,
  tempo:(r.tempo in TEMPO_OPTIONS?r.tempo:'balanced') as TempoKey,
  dayStart:cleanTime(r.dayStart,def.dayStart),dayEnd:cleanTime(r.dayEnd,def.dayEnd),
  startDate:typeof r.startDate==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(r.startDate)&&!Number.isNaN(Date.parse(r.startDate+'T12:00:00Z'))?r.startDate:today,
  alarm:{enabled:al.enabled===undefined?def.alarm.enabled:!!al.enabled,time:cleanTime(al.time,def.alarm.time),blockReminders:al.blockReminders===undefined?true:!!al.blockReminders}
 }}

// ---------- birleşik gün planı ----------
const prevKey=(k:DayKey):DayKey=>ALL_DAYS[(ALL_DAYS.indexOf(k)+6)%7];
export function buildDay(plan:PlanState,date:string):DayPlan{const cfg=normalizePlanConfig(plan.config);const dayKey=dayKeyOf(date);const slot=slotOf({...plan,config:cfg},date);const at=slot>=0?lessonAt({...plan,config:cfg},slot):{isOff:false,lesson:null,shifted:false,finished:false};
 const items:DayItem[]=[];const busy:Busy[]=[];const warnings:string[]=[];
 const push=(type:DayItem['type'],r:{startMin:number;endMin:number},title:string,detail:string,tag:string,buffer=15)=>{busy.push({startMin:r.startMin,endMin:r.endMin,buffer});items.push({type,startMin:r.startMin,endMin:r.endMin,start:fmt(r.startMin),end:r.endMin>=DAY_END?'24:00':fmt(r.endMin),title,detail,tag,fitted:true})};
 // Okul ve sabit bloklar; gece yarısını aşan blok o günün sonuna kadar sürer, kalan kısmı ertesi günün başına eklenir.
 const hardBlocks:{title:string;days:DayKey[];start:string;end:string;fallback:number;detail:string;tag:string}[]=[];
 if(cfg.school.enabled)hardBlocks.push({title:cfg.school.title||'Okul',days:cfg.school.days,start:cfg.school.start,end:cfg.school.end,fallback:480,detail:'Sabit düzen',tag:'Okul'});
 for(const b of cfg.fixedBlocks)hardBlocks.push({title:b.title||'Sabit program',days:b.days,start:b.start,end:b.end,fallback:60,detail:'Kişisel düzen',tag:'Sabit'});
 for(const b of hardBlocks){const r=range(b.start,b.end,b.fallback);const type=b.tag==='Okul'?'school':'fixed';
  if(b.days.includes(dayKey)){push(type,r,b.title,b.detail,b.tag);if(!r.valid)warnings.push(`${b.title}: saatler okunamadı, ${r.start}-${r.end} varsayıldı.`)}
  if(r.overnight&&r.tailMin>0&&b.days.includes(prevKey(dayKey)))push(type,{startMin:0,endMin:r.tailMin},`${b.title} (devam)`,b.detail,b.tag)}
 // çakışma kontrolü (okul / sabit bloklar)
 const hard=items.slice().sort((a,b)=>a.startMin-b.startMin);for(let i=0;i<hard.length;i++)for(let j=i+1;j<hard.length;j++)if(hard[j].startMin<hard[i].endMin)warnings.push(`${hard[i].title} (${hard[i].start}-${hard[i].end}) ile ${hard[j].title} (${hard[j].start}-${hard[j].end}) çakışıyor.`);
 let ds=toMin(cfg.dayStart,8*60),de=Math.min(parseTime(cfg.dayEnd)??23*60+30,23*60+59);
 if(de<=ds){ds=8*60;de=23*60+30;warnings.push('Çalışma penceresi geçersiz (bitiş başlangıçtan önce); 08:00-23:30 kullanıldı.')}
 if(slot<0){}else if(at.isOff){items.push({type:'off',startMin:ds,endMin:ds+60,start:'Tüm gün',end:'',title:'Dinlenme günü',detail:'Bu günün dersi bir sonraki güne kaydırıldı.',tag:'Kaydırıldı',fitted:true})}
 else{const tempo=TEMPO_OPTIONS[cfg.tempo];const lesson=at.lesson;const blocks=lesson?tempo.studyBlocks:[{durationMin:120,label:'Genel deneme ve yanlış defteri analizi',tag:'Serbest tekrar'}];
  const alloc=allocateFreeSlots(busy,blocks.map(b=>b.durationMin),{startMin:ds,endMin:de});
  if(alloc.collision)warnings.push('Gün çok dolu: çalışma blokları tam sığmadı, bazıları kısaltıldı veya geç saate kaydı.');
  blocks.forEach((b,i)=>{const s=alloc.slots[i];items.push({type:'study',startMin:s.startMin,endMin:s.endMin,start:fmt(s.startMin),end:fmt(s.endMin),title:i===0&&lesson?`${lesson.subj}: ${lesson.topic}`:b.label,detail:i===0&&lesson?`${b.label} · ${lesson.teacher}`:b.tag,tag:b.tag,fitted:s.fitted})})}
 items.sort((a,b)=>a.startMin-b.startMin);
 return {date,dayKey,dayName:DAY_FULL_NAMES[dayKey],slot,isOff:at.isOff,lesson:at.lesson,finished:at.finished,shifted:at.shifted,items,warnings}}

// ---------- özet ----------
export function planStats(plan:PlanState,today:string){const total=flatLessons(plan.config.tempo).length;const done=Object.keys(plan.done).filter(k=>Number(k)<total).length;const off=Object.keys(plan.offDays).length;const length=total+off;const slot=slotOf(plan,today);
 return {total,done,off,remaining:total-done,percent:total?Math.round(done/total*100):0,length,weeks:Math.ceil(length/7),endDate:addDays(plan.config.startDate,length-1),todaySlot:slot,currentWeek:Math.min(Math.max(1,Math.floor(Math.max(0,slot)/7)+1),Math.ceil(length/7)),started:slot>=0,ended:slot>=length}}
export function weekDates(plan:PlanState,weekNum:number){return Array.from({length:7},(_,i)=>dateOf(plan,(weekNum-1)*7+i))}
export function weekMeta(plan:PlanState,weekNum:number){const weeks=campaignWeeks(plan.config.tempo);const first=lessonAt(plan,(weekNum-1)*7);const w=first.lesson?weeks[first.lesson.weekNum-1]:weeks[Math.min(weeks.length,weekNum)-1];return {title:w?.title||`${weekNum}. Hafta`,desc:w?.desc||'',phaseName:w?.phaseName||'',phaseId:w?.phaseId||4}}

// ---------- Net Defterim eşlemesi ----------
// Program derslerini lib/meb-topics.ts'teki Maarif ders adlarına eşler; birden fazla ders geçiyorsa metinde ilk geçen seçilir.
const NOTE_SUBJECTS:[RegExp,string][]=[[/matematik|geometri|problem/,'Matematik'],[/türkçe|paragraf|edebiyat|dil bilgisi/,'Türk Dili ve Edebiyatı'],[/fizik/,'Fizik'],[/kimya/,'Kimya'],[/biyoloji/,'Biyoloji'],[/tarih/,'Tarih'],[/coğrafya/,'Coğrafya'],[/felsefe/,'Felsefe'],[/din/,'Din Kültürü ve Ahlak Bilgisi']];
export function noteSubject(subj:string){const s=String(subj||'').toLocaleLowerCase('tr');let best='Matematik',pos=Infinity;for(const [re,name] of NOTE_SUBJECTS){const m=re.exec(s);if(m&&m.index<pos){pos=m.index;best=name}}return best}
export const MOTIVATION=[
 'Bugünkü işi bitirmek, hedef netine bir adım daha yaklaştırır.',
 'Disiplin; canın istemediğinde bile masaya oturabilmektir.',
 'Her gün düzenli çalışılan bloklar, son haftalardaki yükü hafifletir.',
 'Yorulduysan kısa bir mola ver, sonra sıradaki soruyla devam et.',
 'Her yanlış, bir sonraki doğrunun hazırlığıdır.'];

// ---------- paylaşım metinleri (Telegram) ----------
export function dayShareText(d:DayPlan){const l=d.lesson;return [`${d.dayName} ${d.date}`,l?`${l.subj}: ${l.topic}`:d.isOff?'Dinlenme günü':'Serbest tekrar',l?`Hedef: ${l.target}`:'','',...d.items.map(i=>`• ${i.start}${i.end?'-'+i.end:''} ${i.title}`)].filter(x=>x!=='').join('\n')}
export function weekShareText(plan:PlanState,weekNum:number){const m=weekMeta(plan,weekNum);return [`${m.title.toLocaleUpperCase('tr')}`,`(${weekDates(plan,weekNum)[0]} haftası)`,'',...weekDates(plan,weekNum).map(dt=>{const d=buildDay(plan,dt);return `${d.dayName}: ${d.lesson?`${d.lesson.subj} — ${d.lesson.topic}`:d.isOff?'Dinlenme (kaydırıldı)':'Serbest tekrar'}`})].join('\n')}
export const telegramUrl=(text:string,url='')=>`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
