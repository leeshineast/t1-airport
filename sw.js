const CACHE_NAME = 't1-airport-v1';
const CACHE_URLS = [
  '/t1-airport/',
  '/t1-airport/index.html'
];

// 설치 시 캐시
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CACHE_URLS).catch(function(){});
    })
  );
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', function(e){
  // Supabase, Gemini API는 캐시 안 함
  if(e.request.url.includes('supabase.co') || e.request.url.includes('googleapis.com')){
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      // 성공하면 캐시 업데이트
      const clone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){cache.put(e.request, clone);});
      return res;
    }).catch(function(){
      // 오프라인이면 캐시에서
      return caches.match(e.request).then(function(cached){
        return cached || new Response('오프라인 상태입니다.', {status: 503});
      });
    })
  );
});
