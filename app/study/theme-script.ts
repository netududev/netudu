// Sunucu bileşeni (layout) de kullandığı için "use client" dosyasından ayrı tutulur
export const THEME_KEY='nd-theme';
export const themeScript=`try{if(location.protocol==='http:'&&location.hostname!=='localhost'&&location.hostname!=='127.0.0.1'&&!/^192\\.168\\.|^10\\./.test(location.hostname)){location.replace('https://'+location.host+location.pathname+location.search+location.hash)}var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
