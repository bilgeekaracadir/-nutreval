// Nutreval Service Worker
// Tüm uygulama offline çalışır — dosyalar ilk yüklemede önbelleğe alınır

const CACHE_NAME = 'nutreval-v1';
const CACHE_FILES = [
  './takviye-karar-destegi.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Kurulum: tüm dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Aktivasyon: eski önbellekleri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: önbellekten sun, yoksa ağdan al
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            // Başarılı yanıtları önbelleğe ekle
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Tamamen offline: HTML dosyası için fallback
            if (event.request.destination === 'document') {
              return caches.match('./takviye-karar-destegi.html');
            }
          });
      })
  );
});
