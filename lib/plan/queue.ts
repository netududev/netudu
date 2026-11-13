// Kaynak işlemleri için sıralı kuyruk (saf mantık): her görev öncekinin bitmesini bekler; hata sonrası kuyruk durmaz.
// onBusy(id,±1): kaynak başına bekleyen işlem sayacı (arayüzde aria-busy ve düğme kilidi için).
export function makeQueue(onBusy:(id:string,delta:number)=>void=()=>{}){
 let tail:Promise<unknown>=Promise.resolve();
 return (id:string,task:()=>Promise<boolean>):Promise<boolean>=>{onBusy(id,1);
  const run=tail.then(task).catch(()=>false).finally(()=>onBusy(id,-1));tail=run;return run}}
