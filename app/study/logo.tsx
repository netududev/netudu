import {useId} from 'react';
// netudu simgesi (defter, N harfi ve kalem) ve yazı logosu; currentColor ile açık/koyu temaya uyar.
// Silüet parçaları tek yerde durur: LogoMark (sabit) ve LogoMarkAnimated (yükleme) aynı path'leri kullanır.
const FRAME='M433 395V367C433 340 454 318 481 318H783C810 318 832 340 832 367V661Q812 674 792 661V369C792 358 785 350 774 350H484C473 350 465 358 465 369V395Z';
const TABS=[400,487,575,662];
const LINKS='M433 449H465V483H433ZM433 527H465V562H433ZM433 615H465V649H433Z';
const BOTTOM='M433 702H465V720C465 731 473 739 484 739H758C750 758 736 770 716 770H481C454 770 433 748 433 721Z';
const LETTER='M528 699V416H546C556 416 563 420 570 429L723 609V440C723 427 733 416 746 416H767V699H734L572 505V699Z';
const NIB='M792 667Q812 680 832 667L812 720Z';
const VIEW='380 300 480 490';

export function LogoMark({size=28,className}:{size?:number;className?:string}){return <svg width={size*480/490} height={size} viewBox={VIEW} fill="currentColor" aria-hidden="true" className={className}><path d={FRAME}/>{TABS.map(y=><rect key={y} x="394" y={y} width="109" height="36" rx="18"/>)}<path d={LINKS}/><path d={BOTTOM}/><path d={LETTER}/><path d={NIB}/></svg>}

// Yükleme logosu: parçalar maske çizgileriyle (stroke-dashoffset) sırayla açılır; son kare LogoMark ile aynıdır.
// Sıra: sekmeler + alt kenar + çerçeve hattı -> kalem ucu -> kıvılcım -> N -> yazı. Zamanlama globals.css (.logo-anim).
export function LogoMarkAnimated({size=28,className}:{size?:number;className?:string}){
 const id=useId().replace(/:/g,'');const m=(n:string)=>`${id}-${n}`;
 const line={stroke:'#fff',fill:'none',pathLength:1} as const;
 return <svg width={size*480/490} height={size} viewBox={VIEW} fill="currentColor" aria-hidden="true" className={'logo-mark-anim'+(className?' '+className:'')} overflow="visible">
  <defs>
   <mask id={m('tabs')} maskUnits="userSpaceOnUse" x="360" y="380" width="200" height="380">{TABS.map((y,i)=><path key={y} className="lg-m lg-tab" style={{'--i':i} as React.CSSProperties} d={`M360 ${y+26}H540`} strokeWidth="87" {...line}/>)}</mask>
   <mask id={m('bottom')} maskUnits="userSpaceOnUse" x="380" y="680" width="420" height="110"><path className="lg-m lg-bottom" d="M449 690V721C449 739 463 754.500 481 754.500H800" strokeWidth="70" {...line}/></mask>
   <mask id={m('frame')} maskUnits="userSpaceOnUse" x="380" y="300" width="480" height="400"><path className="lg-m lg-frame" d="M449 380V368C449 349 464 334 482 334H779C797 334 812 349 812 368V676" strokeWidth="70" {...line}/></mask>
   <mask id={m('nib')} maskUnits="userSpaceOnUse" x="760" y="650" width="100" height="100"><path className="lg-m lg-nib" d="M812 650V740" strokeWidth="90" {...line}/></mask>
   <mask id={m('n')} maskUnits="userSpaceOnUse" x="500" y="400" width="300" height="320"><path className="lg-m lg-n" d="M500 560H800" strokeWidth="320" {...line}/></mask>
  </defs>
  <g mask={`url(#${m('tabs')})`}>{TABS.map(y=><rect key={y} x="394" y={y} width="109" height="36" rx="18"/>)}<path d={LINKS}/></g>
  <path d={BOTTOM} mask={`url(#${m('bottom')})`}/>
  <path d={FRAME} mask={`url(#${m('frame')})`}/>
  <path d={NIB} mask={`url(#${m('nib')})`}/>
  <path d={LETTER} mask={`url(#${m('n')})`}/>
  <g className="lg-spark"><circle r="30" fill="#D8C7A3" opacity=".55"/><circle r="14" fill="#3454D1"/></g>
  <circle className="lg-pulse" cx="812" cy="716" r="12" fill="#3454D1"/>
 </svg>}

export function Logo({size=28,className,animated=false}:{size?:number;className?:string;animated?:boolean}){const Mark=animated?LogoMarkAnimated:LogoMark;return <span className={'logo'+(animated?' logo-anim':'')+(className?' '+className:'')} role="img" aria-label="netudu"><Mark size={size}/><span className="logo-word" style={{fontSize:size*0.8}}>netudu</span></span>}

// Açılış/oturum denetimi ekranı: kısa gecikmeyle belirir (hızlı yüklemede yanıp sönmez), sunucu ve istemcide aynı çıktıyı verir
export function BootScreen(){return <div className="boot" role="status" aria-live="polite"><span className="sr-only">Yükleniyor</span><Logo size={64} animated/></div>}
