// Minimal service worker to prevent 404 errors
// This file exists to satisfy browser requests for service worker updates

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Removed no-op fetch handler to prevent overhead warning