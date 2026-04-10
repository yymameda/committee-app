// Service Worker — 委員会決定システム PWA
// キャッシュファースト + バージョン管理

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = 'committee-app-' + CACHE_VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// インストール：アセットをキャッシュ
self.addEventListener('install', function(event) {
  console.log('[SW] Install:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('[SW] Remove old cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// フェッチ：キャッシュファースト → ネットワークフォールバック
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // バックグラウンドで更新
        fetch(event.request).then(function(res) {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, res.clone());
            });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request);
    })
  );
});

// メッセージ
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
