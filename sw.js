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

// 푸시 알림 수신 (앱이 꺼져있어도 동작) — 안드로이드는 기본 알림음까지 같이 울림
self.addEventListener('push', function(e){
  var data = {};
  try{ data = e.data ? e.data.json() : {}; }catch(err){ data = {title:'T1OS', body: e.data ? e.data.text() : ''}; }
  var title = data.title || 'T1 환경미화사업부';
  var options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200,100,200],
    data: { url: data.url || './index.html' },
    tag: data.topic || 't1os-push'
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// 알림 탭하면 앱으로 이동
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var targetUrl = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(function(clientList){
      for(var i=0;i<clientList.length;i++){
        if('focus' in clientList[i]) return clientList[i].focus();
      }
      if(clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('fetch', function(e){
  // 페이지 자체를 처음 여는 요청(주소 입력, 홈화면 아이콘 실행 등)은
  // 서비스워커가 가로채지 않고 브라우저가 직접 처리하게 둔다.
  // (여기서 가로챈 fetch가 어떤 이유로든 멈추면 화면이 영원히 빈 화면으로 남는 문제가 있었음)
  if(e.request.mode==='navigate'){
    return;
  }
  // Supabase API·외부 CDN 등 다른 출처로 가는 요청은 그대로 네트워크로 흘려보낸다.
  // iOS Safari는 서비스워커가 가로챈 요청을 처리하는 속도가 느려서, 화면 하나에서
  // API를 수십 개씩 병렬로 부르는 이 앱 특성상 가로채면 로딩이 10초 이상 걸리는 문제가 있었음.
  // 이 서비스워커는 애초에 캐시를 안 쓰므로(위 주석 참고) 가로채도 얻는 이점이 없다.
  if(e.request.url.indexOf(self.location.origin)!==0){
    return;
  }
  // 그 외 우리 앱 자체 파일(아이콘 등)은 네트워크에서만 가져오되, 8초 넘게 응답이 없으면
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
