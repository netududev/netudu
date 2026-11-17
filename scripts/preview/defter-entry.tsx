// Yanlış defteri, yükleme, etiket ve soru penceresi önizlemeleri (SONRA): gerçek bileşenlerin SSR çıktısı, örnek veriyle.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {StudyContext} from '@/app/study/shared';
import {ArchiveView} from '@/app/study/archive';
import {PickStep} from '@/app/study/upload-dialog';
import {TagReview} from '@/app/study/tag-review';
import {QuestionDialog} from '@/app/study/question-dialog';
import {shell,rows,study} from './shell-entry';
import {shots,tagItems,pendingRows} from './defter-entry-veri';
export * from './shell-entry';
export {pendingRows};
export const defter=(o:any={})=>shell('archive',{...o,rows:o.rows??rows,study:{rows:o.rows??rows,...(o.study||{})},body:<ArchiveView subject={o.subject||"Tüm dersler"} setSubject={()=>{}} filteredRef={{current:[]}} onPrint={()=>{}} filtersOpenInitially={!!o.filtersOpen}/>});
const dlg=(el:any,st:any={})=>R(<StudyContext.Provider value={{...study,...st}}><div className="dlg-frame"><div data-slot="dialog-content" className="upload-dialog cap-dialog">{el}</div></div></StudyContext.Provider>);
export const pick=(n:number,ai=true)=>dlg(<PickStep items={shots(n) as any} ai={ai} onAdd={()=>{}} onRemove={()=>{}} onStart={()=>{}}/>,{ai});
export const tag=(busy=false)=>dlg(<TagReview items={tagItems(busy)} busy={busy} ai={true} hinted={false} onPatch={()=>{}} onRetry={()=>{}} onFinish={()=>{}}/>);
export const soru=()=>R(<StudyContext.Provider value={study}><div className="dlg-frame"><QuestionDialog question={{...rows[0],analysis:null} as any} onClose={()=>{}} onPrint={()=>{}}/></div></StudyContext.Provider>);
