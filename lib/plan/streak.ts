// Üst üste çalışılan gün sayısı: yalnızca gerçek tamamlama kayıtlarından (plan.done değerleri YYYY-MM-DD) hesaplanır.
// Bugün henüz bir ders tamamlanmadıysa seri bozulmuş sayılmaz; dünden geriye doğru sayılır.
const prevDay=(d:string)=>new Date(Date.parse(d+'T12:00:00Z')-86400000).toISOString().slice(0,10);
export function studyStreak(done:Record<string,string>,today:string){
 const days=new Set(Object.values(done).filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v)));
 let d=days.has(today)?today:prevDay(today),n=0;
 while(days.has(d)){n++;d=prevDay(d)}
 return n;
}
