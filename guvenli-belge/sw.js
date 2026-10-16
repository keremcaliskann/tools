/**
 * GüvenliBelge Service Worker
 * %100 Çevrimdışı ve Sıfır-Sunucu (Air-Gapped) Önbellekleme Katmanı
 * Cache Version: v1.0.0
 */

const CACHE_VERSION = 'guvenli-belge-v1.0.0';
const STATIC_CACHE = `gb-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gb-runtime-${CACHE_VERSION}`;

// Precache listesi: Uygulama kabuğu ve temel rotalar
const PRECACHE_PATHS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon.svg',
  './workers/compressor.worker.js',
  './kimlik-fotokopisi-filigran-ekleme.html',
  './pdf-hassas-bilgi-karartma.html',
  './e-devlet-pdf-boyut-kucultme-1mb.html',
  './kira-sozlesmesi-belge-birlestirme.html',
  './fotograftan-resmi-pdf-yapma.html',
  './pdf-exif-metadata-temizleme.html'
];

/**
 * 1. INSTALL: Uygulama kabuğunu dayanıklı (resilient) şekilde önbelleğe alma
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      
      // Promise.allSettled sayesinde dev ortamında veya eksik dosyalarda SW kurulumu kesintiye uğramaz
      await Promise.allSettled(
        PRECACHE_PATHS.map(async (path) => {
          try {
            const url = new URL(path, self.registration.scope).href;
            const response = await fetch(url, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Sessizce logla - çevrimdışı kabuk diğer varlıklarla çalışmaya devam eder
            console.debug('[SW] Precache item not available yet:', path);
          }
        })
      );
      
      // Yeni service worker'ı hemen aktif duruma geçmeye hazırla
      await self.skipWaiting();
    })()
  );
});

/**
 * 2. ACTIVATE: Eski versiyon önbelleklerini temizleme ve istemcileri devralma
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const allowedCaches = new Set([STATIC_CACHE, RUNTIME_CACHE]);
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('gb-') && !allowedCaches.has(name)) {
            console.info('[SW] Eski önbellek temizleniyor:', name);
            return caches.delete(name);
          }
        })
      );

      // Açık sekmeleri anında kontrol et
      await self.clients.claim();
    })()
  );
});

/**
 * 3. FETCH: Önbellek öncelikli (Cache-First) ve Çevrimdışı Dayanıklılık
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Yalnızca GET istekleri işlenir
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Yalnızca HTTP/HTTPS istekleri önbelleklenir (blob:, data:, chrome-extension: atlanır)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A. NAVİGASYON (HTML Sayfa Rotaları) - Network First, Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          // Ağ varsa taze sayfayı al ve önbelleğe yaz
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Çevrimdışı durumunda önbellekten sun
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Rota eşleşmezse ana sayfa kabuğunu döndür
          const rootUrl = new URL('./', self.registration.scope).href;
          const rootCached = await caches.match(rootUrl);
          if (rootCached) {
            return rootCached;
          }

          const indexUrl = new URL('./index.html', self.registration.scope).href;
          const indexCached = await caches.match(indexUrl);
          if (indexCached) {
            return indexCached;
          }

          // Son çare: Dahili çevrimdışı geri dönüş sayfası
          return new Response(
            `<!DOCTYPE html>
            <html lang="tr" class="dark">
            <head>
              <meta charset="utf-8">
              <title>GüvenliBelge - Çevrimdışı Mod</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
                .card { background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                h1 { color: #38bdf8; font-size: 1.4rem; margin: 0.5rem 0; }
                p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
                .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
                .btn { display: inline-block; margin-top: 1.5rem; background: #0284c7; color: white; padding: 0.65rem 1.25rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="badge">🔒 %100 İstemci Taraflı ve Çevrimdışı</div>
                <h1>GüvenliBelge Aktif</h1>
                <p>İnternet bağlantınız olmasa bile GüvenliBelge tarayıcı hafızanızda çalışmaya devam eder. Aradığınız rota önbellekte yoksa ana sayfaya dönerek araçları kullanabilirsiniz.</p>
                <a href="${self.registration.scope}" class="btn">Ana Sayfaya Dön</a>
              </div>
            </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }
      })()
    );
    return;
  }

  // B. STATİK VARLIKLAR (JS, CSS, Resimler, SVG, Fontlar, Web Worker) - Cache First
  const isStaticAsset = /\.(js|css|svg|png|jpg|jpeg|webp|gif|woff2?|ttf|wasm)$/i.test(url.pathname) ||
                        url.pathname.includes('/workers/');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        // Önce önbelleğe bak
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // Önbellekte yoksa ağdan çek ve runtime önbelleğe ekle
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Ağ başarısız olduysa generic fallback döndür
          return new Response('', { status: 408, statusText: 'Request Timed Out / Offline' });
        }
      })()
    );
    return;
  }

  // C. DİĞER İSTEKLER - Network with Cache Fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});

/**
 * 4. MESAJLAŞMA (IPC) KANALI
 */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Kullanıcı "Yenile" butonuna tıkladığında hemen yeni sürüme geç
  if (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Sürüm sorgusu
  if (event.data === 'GET_VERSION' || event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
      scope: self.registration.scope,
      timestamp: Date.now()
    });
  }

  // Acil durum önbellek sıfırlama
  if (event.data === 'CLEAR_CACHE' || event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      Promise.all(keys.map((k) => caches.delete(k))).then(() => {
        event.ports[0]?.postMessage({ status: 'CLEARED' });
      });
    });
  }
});
