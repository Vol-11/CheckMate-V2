/* キャッシュ名はバージョンで変えると更新が楽 */
const CACHE_NAME = 'wasuremono-pro-v2.2';

/* オフラインでも必要なファイルを列挙 */
const urlsToCache = [
  '/',                       // index.html
  '/repo-name/',             // GitHub Pages のルート（上と同じ）
  '/repo-name/index.html',
  '/repo-name/style.css',
  '/repo-name/main.js',
  '/repo-name/icons/icon-192.png',
  '/repo-name/icons/icon-512.png',
  'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js'
];

/* インストール時にファイルをキャッシュ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
          .then(cache => cache.addAll(urlsToCache))
  );
});

/* 新旧キャッシュを整理（任意 ─ 推奨） */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

/* ネット優先。失敗したらキャッシュを返す */
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
