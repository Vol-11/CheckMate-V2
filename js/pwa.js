// PWA設定
const manifestData = {
  "name": "忘れ物防止システム Pro",
  "short_name": "忘れ物Pro",
  "description": "教材・持ち物を統合管理する忘れ物防止システム",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait",
  "icons": [
    { "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "sizes": "192x192", "type": "image/png" },
    { "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "sizes": "512x512", "type": "image/png" }
  ]
};

const manifestBlob = new Blob([JSON.stringify(manifestData)], {type: 'application/json'});
const manifestURL = URL.createObjectURL(manifestBlob);
const link = document.createElement('link');
link.rel = 'manifest';
link.href = manifestURL;
document.head.appendChild(link);

// Service Worker登録
const swCode = `
const CACHE_NAME = 'wasuremono-pro-v2.2';
const urlsToCache = ['./', 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache).catch(() => c.add('./')))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./')))));
`;

if ('serviceWorker' in navigator) {
  const swBlob = new Blob([swCode], {type: 'application/javascript'});
  const swURL = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swURL).then(() => console.log('SW registered')).catch(console.error);
}