// ================================================================
// Service Worker for Al-Azeza Platform (PWA)
// ================================================================

const CACHE_NAME = 'al-azeza-cache-v1';
const OFFLINE_URL = 'index.html';

// الملفات التي سيتم تخزينها مؤقتاً
const urlsToCache = [
    '/',
    '/index.html',
    '/volunteer.html',
    '/help.html',
    '/bulletins.html',
    '/activities.html',
    '/maps.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ================================================================
// التثبيت: تخزين الملفات الأساسية
// ================================================================
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(urlsToCache);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// ================================================================
// التنشيط: تنظيف الكاش القديم
// ================================================================
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// ================================================================
// استراتيجية: Network First مع Fallback للكاش
// ================================================================
self.addEventListener('fetch', function (event) {
    const requestUrl = new URL(event.request.url);

    // تجاهل طلبات التحليلات والإعلانات
    if (requestUrl.hostname.includes('analytics') || 
        requestUrl.hostname.includes('google') && requestUrl.pathname.includes('ads')) {
        return;
    }

    // استراتيجية Network First للملفات الرئيسية
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(function () {
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // استراتيجية Cache First للموارد الثابتة
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request).then(function (networkResponse) {
                // تخزين النسخة الجديدة في الكاش
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(function () {
                // إذا كان طلب صورة، نعيد صورة بديلة
                if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
                    return caches.match('/icon-192.png');
                }
            });
        })
    );
});

// ================================================================
// الإشعارات (Push Notifications) - أساسيات
// ================================================================
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'منصة الأعزاء';
    const options = {
        body: data.body || 'هناك تحديث جديد في منصة الأعزاء',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            {
                action: 'open',
                title: 'فتح'
            },
            {
                action: 'close',
                title: 'إغلاق'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ================================================================
// التعامل مع ضغط على الإشعار
// ================================================================
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});