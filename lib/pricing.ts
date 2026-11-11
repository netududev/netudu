// Üyelik fiyatının tek kaynağı. Arayüzdeki tüm fiyat ve deneme metinleri buradan okunur.
// Ödeme sistemi henüz yok: bu değerler yalnızca gösterim içindir, erişimi kilitlemez.
export const MONTHLY_PRICE_TRY=199.99;
export const TRIAL_DAYS=7;

// 199.99 -> "199,99 TL" (binlik ayraç ve virgül Türkçe biçimiyle)
export function formatTry(amount:number){
 const [whole,frac]=amount.toFixed(2).split('.');
 return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g,'.')},${frac} TL`;
}
export const monthlyPriceLabel=()=>formatTry(MONTHLY_PRICE_TRY);
export const trialLabel=()=>`${TRIAL_DAYS} gün ücretsiz`;
// Tek cümlelik fiyat özeti: "7 gün ücretsiz. Sonrası aylık 199,99 TL."
export const priceSummary=()=>`${trialLabel()}. Sonrası aylık ${monthlyPriceLabel()}.`;
export const PAYMENT_NOTE='Ödeme adımı yakında; şu an senden ödeme alınmıyor.';

// Deneme günü hesabı yalnız gerçek kayıt tarihinden (ISO) yapılır; tarih yoksa/geçersizse null döner.
export function trialDaysLeft(createdAt:string|null|undefined,now:number=Date.now()):number|null{
 if(!createdAt)return null;
 const t=Date.parse(createdAt);
 if(!Number.isFinite(t)||t>now+86400000)return null;
 const used=Math.floor((now-t)/86400000);
 return Math.max(0,TRIAL_DAYS-used);
}
