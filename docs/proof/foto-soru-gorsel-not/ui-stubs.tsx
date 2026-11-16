// Statik önizleme için radix tabanlı bileşenlerin düz karşılıkları (yalnız SSR çıktısı alınır; davranış yok).
import * as React from 'react';
export const Dialog=({children}:any)=><>{children}</>;
export const DialogContent=({className,children}:any)=><div data-slot="dialog-content" className={className}>{children}</div>;
export const DialogHeader=({children}:any)=><div className="dialog-header" style={{display:'flex',flexDirection:'column',gap:8}}>{children}</div>;
export const DialogTitle=({children}:any)=><h2 data-slot="dialog-title">{children}</h2>;
export const DialogDescription=({children}:any)=><p className="muted" style={{fontSize:'.9375rem'}}>{children}</p>;
export const Select=({children}:any)=><>{children}</>;export const SelectTrigger=({children}:any)=><div className="choice">{children}</div>;export const SelectValue=()=>null;export const SelectContent=()=>null;export const SelectItem=()=>null;
export const toast:any=Object.assign(()=>{},{error(){},success(){},message(){}});
