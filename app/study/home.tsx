"use client";
import {Check,X} from '@/components/icons';
import {toast} from 'sonner';
import {today,reviewStageLabel,type Question} from '@/lib/study';
import {useStudy,dates,postJson,mistakeLabel} from './shared';
import {subjectClass} from './archive';
// Bugün ekranının tekrar sırası listesi (eski "Ana sayfa" görünümü kullanılmadığı için kaldırıldı)
export function DueList({items}:{items:Question[]}){const s=useStudy();async function mark(q:Question,result:'doğru'|'yanlış'){try{const d=await postJson(`/api/questions/${q.id}`,{review:result},'PATCH');s.upsert(d.question);toast.success(result==='doğru'?`Bir sonraki tekrar: ${d.question.next_review?dates(d.question.next_review):'gerekmiyor, öğrenildi'}.`:'Sorun değil. Yarın yeniden karşına gelecek.')}catch(e){toast.error((e as Error).message)}}
 return <ul className="due-list">{items.map(q=><li key={q.id}><button className="due-main" onClick={()=>s.select(q)}><span className={subjectClass(q.subject)}>{q.subject}</span><strong>{q.topic}</strong><small>{q.exam} · {dates(q.date)} · {mistakeLabel[q.mistake_type]||q.mistake_type} · {reviewStageLabel(q)}{q.next_review&&q.next_review<today()?' · gecikti':''}</small></button><span className="due-actions"><button className="ok" onClick={()=>void mark(q,'doğru')} aria-label="Doğru çözdüm"><Check size={16}/> Doğru çözdüm</button><button className="no" onClick={()=>void mark(q,'yanlış')} aria-label="Yine yanlış"><X size={16}/> Yine yanlış</button></span></li>)}</ul>}
