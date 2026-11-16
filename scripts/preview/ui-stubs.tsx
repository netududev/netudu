// Statik önizleme için radix/shadcn bileşenlerinin düz karşılıkları (yalnız SSR çıktısı; davranış yok).
// Kenar çubuğu çerçevesi (sabit 16rem sol sütun + içerik alanı) tailwind olmadan elle yazılmıştır; data-slot adları gerçeğiyle aynıdır.
import * as React from 'react';
const P=({children}:any)=><>{children}</>;
export const Dialog=P,DialogContent=({className,children}:any)=><div data-slot="dialog-content" className={className}>{children}</div>,DialogHeader=P,DialogTitle=({children}:any)=><h2>{children}</h2>,DialogDescription=({children}:any)=><p>{children}</p>,DialogFooter=P,DialogTrigger=P,DialogClose=P;
export const AlertDialog=P,AlertDialogContent=P,AlertDialogHeader=P,AlertDialogTitle=P,AlertDialogDescription=P,AlertDialogFooter=P,AlertDialogAction=P,AlertDialogCancel=P,AlertDialogTrigger=P;
export const Select=P,SelectTrigger=({children}:any)=><div className="choice">{children}</div>,SelectValue=()=>null,SelectContent=()=>null,SelectItem=()=>null;
export const Table=({children,className}:any)=><table className={className} style={{width:'100%',borderCollapse:'collapse'}}>{children}</table>,TableHeader=({children}:any)=><thead>{children}</thead>,TableBody=({children}:any)=><tbody>{children}</tbody>,TableRow=({children,className}:any)=><tr className={className}>{children}</tr>,TableHead=({children,className}:any)=><th className={className} style={{textAlign:'left',padding:'10px 12px'}}>{children}</th>,TableCell=({children,className}:any)=><td className={className} style={{padding:'10px 12px'}}>{children}</td>;
export const toast:any=Object.assign(()=>{},{error(){},success(){},message(){}});
export const Toaster=()=>null;
const Ctx=React.createContext<any>({isMobile:false,setOpenMobile(){}});
export const useSidebar=()=>React.useContext(Ctx);
export const SidebarProvider=({children}:any)=><Ctx.Provider value={{isMobile:false,setOpenMobile(){}}}><div className="sb-frame">{children}</div></Ctx.Provider>;
export const Sidebar=({className,children}:any)=><aside className={className} data-slot="sidebar-container"><div data-slot="sidebar-inner" className="sb-inner">{children}</div></aside>;
export const SidebarHeader=({children}:any)=><div data-slot="sidebar-header" style={{display:'flex',flexDirection:'column',gap:8,padding:8}}>{children}</div>;
export const SidebarContent=({children}:any)=><div data-slot="sidebar-content" style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflow:'auto'}}>{children}</div>;
export const SidebarFooter=({children}:any)=><div data-slot="sidebar-footer" className="sb-footer" style={{display:'flex',flexDirection:'column',padding:8}}>{children}</div>;
export const SidebarMenu=({children}:any)=><ul data-slot="sidebar-menu" style={{display:'flex',flexDirection:'column',gap:4,padding:'0 8px',margin:0,listStyle:'none'}}>{children}</ul>;
export const SidebarMenuItem=({children}:any)=><li data-slot="sidebar-menu-item">{children}</li>;
export const SidebarMenuButton=({children,isActive,onClick}:any)=><button data-slot="sidebar-menu-button" data-active={isActive?'true':'false'} onClick={onClick} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px',textAlign:'left'}}>{children}</button>;
export const SidebarInset=({children}:any)=><div data-slot="sidebar-inset" className="sb-inset">{children}</div>;
export const SidebarTrigger=()=><button data-slot="sidebar-trigger" className="sb-trigger" aria-label="Kenar çubuğunu aç" style={{display:'inline-grid',placeItems:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button>;
