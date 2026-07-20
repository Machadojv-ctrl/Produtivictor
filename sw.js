// Service worker do Produtivictor — cuida só de deixar o app instalável e abrir
// mesmo sem internet. Os dados de verdade sempre vêm da API (Google Apps Script),
// então aqui só guardamos em cache a "casca" do app (o HTML/JS/CSS em si).

const CACHE_NAME = 'produtivictor-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Estratégia "rede primeiro": sempre tenta buscar a versão mais nova (importante,
// já que o app muda com frequência); só usa o cache se estiver de verdade offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return; // nunca cacheia POST (as chamadas da API)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
