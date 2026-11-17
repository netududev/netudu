// Soru penceresi sekme durumu: sekme soru kimliğine bağlıdır. Aynı soru yeni nesneyle gelince (upsert) korunur;
// farklı soru ya da kapanış (id=null) "Soru ve çözüm"e döner. Bileşen: app/study/question-dialog.tsx.
export const DEFAULT_TAB='solution';
export type TabState={id:string|null;tab:string};
export const syncTab=(st:TabState,id:string|null):TabState=>st.id===id?st:{id,tab:DEFAULT_TAB};
export const pickTab=(st:TabState,tab:string):TabState=>({id:st.id,tab});
