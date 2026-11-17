// Statik önizleme ekranlarında gerçek ölçüm koduyla (chrome-vars.ts) --sw-top / --sw-bar yazılır; SSR çıktısında kanca çalışmadığı için bu paket sayfaya eklenir.
import {watchChrome} from '@/app/study/swipe/chrome-vars';
(window as any).__watchChrome=watchChrome;
