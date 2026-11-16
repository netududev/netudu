import {Camera,Check} from '@/components/icons';
import {HERO_PHOTO,HERO_PHOTO_ALT,HERO_PHOTO_SIZE} from '@/lib/hero';
// Kahraman paneli: HERO_PHOTO varsa gerçek fotoğraf, yoksa ürünün arayüz kartlarından kurulu sıcak koyu kompozisyon.
// Kartlardaki etiketler örnektir (gerçek kullanıcı verisi değil).
export function HeroVisual(){
 return <div className="lp-visual" role="group" aria-label="Örnek ekran: fotoğrafı çekilen soru, ders, konu ve alt konusuyla tanınmış">
  {HERO_PHOTO
   ?<img className="lp-photo" src={HERO_PHOTO} alt={HERO_PHOTO_ALT} width={HERO_PHOTO_SIZE.width} height={HERO_PHOTO_SIZE.height} loading="eager" decoding="async"/>
   :<div className="lp-scene" aria-hidden="true">
     <div className="lp-sheet"><i className="w70"/><i className="w92"/><i className="w84"/><em>f(x) = (3x² + 1)⁵</em><i className="w60"/><i className="w76"/>
      <span className="lp-corner tl"/><span className="lp-corner tr"/><span className="lp-corner bl"/><span className="lp-corner br"/></div>
    </div>}
  <div className="lp-float lp-recog">
   <div className="lp-recog-top"><span>SORU TANINDI</span><span className="lp-tick"><Check size={14} strokeWidth={2.4}/></span></div>
   <div className="lp-recog-main"><b>Türev</b><span>Matematik · Zincir kuralı</span></div>
   <div className="lp-pills"><span className="champ">AYT</span><span>Orta zorluk</span><span className="brand">Tekrar: 3 gün sonra</span></div>
  </div>
  <div className="lp-float lp-cal">
   <span>TEKRAR TAKVİMİ</span>
   <ol aria-label="Tekrar günleri">{[1,3,7,14,30,60].map(d=><li key={d} className={d===3?'on':''}>{d}</li>)}</ol>
   <small>gün sonra, sırayla</small>
  </div>
  <div className="lp-float lp-noentry">
   <span className="lp-noentry-ico"><Camera size={20}/></span>
   <span><b>Elle giriş yok</b><small>Çek ya da galeriden seç, bitti.</small></span>
  </div>
 </div>;
}
