// Casino Royale Suite — Service Worker
// Cached rein für Offline-Nutzung, wenn die Seite über http(s) ausgeliefert wird
// (z.B. via lokalem Webserver). Bei file:// registriert der Browser i.d.R. keine
// Service Worker — das Spiel funktioniert dann trotzdem, da es komplett
// selbst-enthalten ist und keine Netzwerkaufrufe braucht.

const CACHE_VERSION = 'ccs-v1';
const APP_SHELL = [
  './casino-simulator.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_SHELL).catch(function(){ /* einzelne fehlende Datei soll Install nicht blockieren */ });
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_VERSION; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      const network = fetch(event.request).then(function(response){
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
