// MODE=onceki girişi: yeni kabuk girişine ek olarak taban kabuğunun kopyası (docs/proof altındaki before-frame.tsx).
// Test paketi bu dosyayı içe aktarmaz; yalnız scripts/shell-preview.mjs MODE=onceki iken kullanır.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {OldFrame} from '@/docs/proof/feat-kabuk-ve-giris/before-frame';
import {StudyContext} from '@/app/study/shared';
export * from './shell-entry';
import {oldProps} from './shell-entry';
export const oldShell=(view:string,o:any={})=>{const {study,props,body}=oldProps(view,o);return R(<StudyContext.Provider value={study}><OldFrame {...props}>{body}</OldFrame></StudyContext.Provider>)};
