const CACHE_VERSION = 'tw-v2';
const PRECACHE = ['./', 'manifest.json',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

// install: PRECACHE 저장 후 skipWaiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// activate: 구 캐시 삭제 후 clients.claim
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// fetch: 분기 순서 엄수
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. 비-GET 요청은 가로채지 않음 (window.storage 동적 요청 보호)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. navigate 요청 — network-first, 실패 시 캐시 셸 fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('./'))
    );
    return;
  }

  // 3. fonts.googleapis.com — stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 4. fonts.gstatic.com — cache-first (불변 URL)
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // 5. unpkg.com — cache-first (three.js 버전 고정)
  if (url.hostname === 'unpkg.com') {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // 6. 그 외 동일 출처 GET 정적 에셋 — cache-first (obj/mtl runtime cache 포함)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            // opaque 응답은 저장 금지
            if (response.ok && response.type !== 'opaque') {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // 그 외: passthrough (가로채지 않음)
});
