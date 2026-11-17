// "ÖNCE" önizlemesi: taban dalın bileşenleri (PR 4 öncesi) aynı ekran adlarıyla. '@' takma adı taban çalışma dizinine işaret eder.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {StudyContext} from '@/app/study/shared';
import {ArchiveView} from '@/app/study/archive';
import {UploadDialog} from '@/app/study/upload-dialog';
import {TagReview} from '@/app/study/tag-review';
import {QuestionDialog} from '@/app/study/question-dialog';
import {shell,rows,study} from './shell-entry';
import {pendingRows,tagItems} from './defter-entry-veri';
export {pendingRows};
export const defter=(o:any={})=>shell('archive',{...o,rows:o.rows??rows,study:{rows:o.rows??rows,...(o.study||{})},body:<ArchiveView subject="Tüm dersler" setSubject={()=>{}} filteredRef={{current:[]}}/>});
const dlg=(el:any,st:any={})=>R(<StudyContext.Provider value={{...study,...st}}><div className="dlg-frame"><div data-slot="dialog-content" className="upload-dialog cap-dialog">{el}</div></div></StudyContext.Provider>);
export const pick=(n:number,ai=true)=>dlg(<UploadDialog open files={[]} onClose={()=>{}}/>,{ai});
export const tag=(busy=false)=>dlg(<TagReview items={tagItems(busy)} busy={busy} ai={true} hinted={false} onPatch={()=>{}} onRetry={()=>{}} onFinish={()=>{}}/>);
export const soru=()=>R(<StudyContext.Provider value={study}><div className="dlg-frame"><QuestionDialog question={{...rows[0],analysis:null} as any} onClose={()=>{}} onPrint={()=>{}}/></div></StudyContext.Provider>);
