import type { Metadata } from "next";
import {Manrope} from "next/font/google";
import "./globals.css";
const manrope=Manrope({subsets:["latin","latin-ext"],display:"swap",variable:"--font-manrope"});
import {themeScript} from "./study/theme-script";
import {priceSummary} from "@/lib/pricing";
export const metadata: Metadata = {title:"netudu · YKS çalışma programı ve yanlış defteri", description:"Okul ve dershane saatlerine göre YKS çalışma programı, yanlış defteri, deneme ve net takibi. Konu listeleri Türkiye Yüzyılı Maarif Modeli ders programlarına göre. "+priceSummary(), icons:{icon:"/favicon.png",shortcut:"/favicon.png",apple:"/apple-touch-icon.png"},manifest:"/manifest.webmanifest",appleWebApp:{capable:true,statusBarStyle:"default",title:"netudu"}};
export const viewport={themeColor:[{media:"(prefers-color-scheme: light)",color:"#ffffff"},{media:"(prefers-color-scheme: dark)",color:"#000000"}],width:"device-width",initialScale:1,viewportFit:"cover" as const};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr" className={manrope.variable} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
