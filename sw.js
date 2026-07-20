// Service worker do Produtivictor — cuida de deixar o app instalável, abrir
// mesmo sem internet, e receber notificações push (mesmo com o app fechado).
// Os dados de verdade sempre vêm da API (Google Apps Script), então aqui só
// guardamos em cache a "casca" do app (o HTML/JS/CSS em si).

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDT-QP7eATa7v8wr9876GyKeeT1O_qX5Gc",
  authDomain: "produtivictor.firebaseapp.com",
  projectId: "produtivictor",
  storageBucket: "produtivictor.firebasestorage.app",
  messagingSenderId: "736380659169",
  appId: "1:736380659169:web:52391e10061769e1d01ea0"
});

const messaging = firebase.messaging();

// notificação chegando com o app fechado/em segundo plano
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Produtivictor';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
  };
  self.registration.showNotification(title, options);
});

const CACHE_NAME = 'produtivictor-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

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
