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
  // 네트워크 실패 시에도 respondWith가 reject되지 않도록 처리
  // (그렇지 않으면 브라우저가 "FetchEvent.respondWith received an error" 경고 배너를 띄움)
  e.respondWith(
    fetch(e.request).catch(function(err){
      return new Response('오프라인 상태이거나 네트워크 연결에 실패했습니다.', {
        status: 503,
        statusText: 'Network Error',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
