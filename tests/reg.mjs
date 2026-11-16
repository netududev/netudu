// Test yükleyicisi kaydı: npm test içinde --import ile verilir
import {register} from 'node:module';
register('./hook.mjs',import.meta.url);
