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
  // 페이지 자체를 처음 여는 요청(주소 입력, 홈화면 아이콘 실행 등)은
  // 서비스워커가 가로채지 않고 브라우저가 직접 처리하게 둔다.
  // (여기서 가로챈 fetch가 어떤 이유로든 멈추면 화면이 영원히 빈 화면으로 남는 문제가 있었음)
  if(e.request.mode==='navigate'){
    return;
  }
  // 그 외 리소스(이미지 등)는 네트워크에서만 가져오되, 8초 넘게 응답이 없으면
  // 무한 대기하지 않고 바로 에러로 처리(타임아웃 안전장치)
  e.respondWith(
    Promise.race([
      fetch(e.request),
      new Promise(function(_, reject){ setTimeout(function(){ reject(new Error('timeout')); }, 8000); })
    ]).catch(function(err){
      return new Response('오프라인 상태이거나 네트워크 연결에 실패했습니다.', {
        status: 503,
        statusText: 'Network Error',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});
