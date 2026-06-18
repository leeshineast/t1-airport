// 캐시 사용 안 함 - 항상 최신 파일 로드
self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  // 기존 캐시 전부 삭제
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // 항상 네트워크에서만 가져옴 (캐시 사용 안 함)
  e.respondWith(fetch(e.request));
});
