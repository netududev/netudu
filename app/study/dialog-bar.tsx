"use client";
import {X} from '@/components/icons';
import {DialogClose,DialogTitle} from '@/components/ui/dialog';
// Tam ekran / pano pencerelerinin üst çubuğu: solda kapat (44px), ortada başlık; sağdaki boş hücre başlığı ortalar.
export function DialogBar({title,disabled}:{title:string;disabled?:boolean}){
 return <div className="dlg-bar"><DialogClose asChild><button type="button" className="dlg-close" aria-label="Kapat" disabled={disabled}><X size={20}/></button></DialogClose><DialogTitle>{title}</DialogTitle><span aria-hidden="true"/></div>}
