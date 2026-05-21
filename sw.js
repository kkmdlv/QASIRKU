// Service Worker KUKAMI (Mode Bypass)
const CACHE_NAME = 'kukami-v1';

// Install SW
self.addEventListener('install', (event) => {
  console.log('[KUKAMI] Service Worker Terinstall');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[KUKAMI] Service Worker Aktif');
  event.waitUntil(clients.claim());
});

// Fetch (Kita biarkan bypass langsung ke internet agar tidak bentrok dengan API Bos)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Aplikasi sedang offline. Periksa koneksi internet Anda.');
  }));
});
