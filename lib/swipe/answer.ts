// Cevap anahtarı tek şık harfiyse (A–E) harfi verir; değilse null (şık düğmeleri çizilmez)
export function optionLetter(answerKey:string|null|undefined):string|null{
  const m=/^\s*\(?([A-Ea-e])\s*[).:]?\s*$/.exec(answerKey??'');return m?m[1].toUpperCase():null;
}
