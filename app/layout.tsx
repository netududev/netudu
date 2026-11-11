import type { Metadata } from "next";
import "./globals.css";
import {themeScript} from "./study/theme-script";
export const metadata: Metadata = {title:"netudu · YKS ders çalışma programı", description:"Okul, dershane ve spor saatlerine göre kişisel YKS ders çalışma programı; Maarif TYT kampı, alarm, yanlış defteri, aralıklı tekrar ve aylık rapor.", icons:{icon:"/favicon.png",shortcut:"/favicon.png",apple:"/apple-touch-icon.png"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:"netudu"}};
export const viewport={themeColor:[{media:"(prefers-color-scheme: light)",color:"#ffffff"},{media:"(prefers-color-scheme: dark)",color:"#000000"}],width:"device-width",initialScale:1,viewportFit:"cover" as const};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
