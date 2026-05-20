const CACHE_NAME = 'bing-images-v1';

// Install: activate immediately
self.addEventListener('install', () => {
    self.skipWaiting();
});

// Activate: take control immediately
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// Fetch: cache-first for Bing image requests
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Only intercept Bing image requests (th?id=...)
    if (url.hostname === 'www.bing.com' && url.pathname.startsWith('/th')) {
        e.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(e.request).then((cached) => {
                    if (cached) {
                        return cached;
                    }
                    return fetch(e.request).then((response) => {
                        if (response.ok || response.type === 'opaque') {
                            // Cache the response (works for both normal and opaque)
                            cache.put(e.request, response.clone());
                        }
                        return response;
                    });
                })
            )
        );
    }
});

// Listen for messages from the page to clear stale image cache
self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'clear-image-cache') {
        e.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                // Notify all clients that cache was cleared
                self.clients.matchAll().then((clients) => {
                    clients.forEach((c) => c.postMessage({ type: 'image-cache-cleared' }));
                });
            })
        );
    }
});