importScripts('js/indexdb.js');

const CACHE_NAME = 'wasuremono-pro-v2.3'; // Cache version updated
const urlsToCache = [
    '/CheckMate-V2/',
    '/CheckMate-V2/index.html',
    '/CheckMate-V2/js/dark_mode.js',
    '/CheckMate-V2/js/indexdb.js',
    '/CheckMate-V2/js/style_config.js',
    '/CheckMate-V2/js/dark_mode_startup.js',
    '/CheckMate-V2/icons/icon-192.png',
    '/CheckMate-V2/icons/icon-512.png',
    'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(err => {
                console.error('Failed to cache URLs:', err);
            });
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }))
        )
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => caches.match('/CheckMate-V2/index.html'));
        })
    );
});

// =================================================================
// Notification Logic
// =================================================================

// --- IndexedDB Access from Service Worker ---
let dbPromise;

function getDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = (event) => resolve(event.target.result);
            // No onupgradeneeded here, assuming main thread handles it.
        });
    }
    return dbPromise;
}

async function getItemFromDb(id) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE_NAME, 'readonly');
        const store = tx.objectStore(ITEMS_STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getItemsForDay(dayOfWeek) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ITEMS_STORE_NAME, 'readonly');
        const store = tx.objectStore(ITEMS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const allItems = request.result;
            const dayItems = allItems.filter(item => item.days.includes(dayOfWeek));
            resolve(dayItems);
        };
        request.onerror = () => reject(request.error);
    });
}

async function getAllForgottenRecords() {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORGOTTEN_RECORDS_STORE_NAME, 'readonly');
    const store = tx.objectStore(FORGOTTEN_RECORDS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


// --- Event Listeners ---

self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'schedule-daily':
                scheduleDailyNotification(event.data.payload);
                break;
            case 'cancel-all':
                cancelAllNotifications();
                break;
        }
    }
});

async function scheduleDailyNotification(payload) {
    const { title, body, time, renotify, tag } = payload;
    const [hours, minutes] = time.split(':');

    const notificationTime = new Date();
    notificationTime.setHours(parseInt(hours, 10));
    notificationTime.setMinutes(parseInt(minutes, 10));
    notificationTime.setSeconds(0, 0);

    // If the time is in the past for today, schedule it for tomorrow
    if (notificationTime < new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
    }

    try {
        await self.registration.showNotification(title, {
            tag: tag,
            body: body,
            icon: '/CheckMate-V2/icons/icon-192.png',
            showTrigger: new TimestampTrigger(notificationTime.getTime()),
            data: {
                scheduledTime: notificationTime.toISOString(),
                renotify: renotify
            }
        });
        console.log(`Daily notification scheduled for ${notificationTime.toLocaleString()}`);
    } catch (error) {
        console.error('Error scheduling daily notification:', error);
    }
}

async function cancelAllNotifications() {
    const notifications = await self.registration.getNotifications();
    for (const notification of notifications) {
        notification.close();
    }
    console.log('All scheduled notifications have been cancelled.');
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = new URL('/CheckMate-V2/', self.location.origin).href;
            const client = clientList.find(c => c.url === urlToOpen && 'focus' in c);
            if (client) {
                return client.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('notificationclose', async (event) => {
    const notification = event.notification;
    const data = notification.data;

    // Only re-notify for the main daily summary
    if (!data || !data.renotify || notification.tag !== 'daily-summary') {
        return;
    }

    const scheduledTime = new Date(data.scheduledTime);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][scheduledTime.getDay()];

    const itemsToReNotify = [];
    const itemsForDay = await getItemsForDay(dayOfWeek);
    const forgottenRecords = await getAllForgottenRecords(); // Assumes this function exists from indexdb.js

    // Find frequently forgotten item IDs
    const forgottenCounts = {};
    forgottenRecords.forEach(record => {
        record.itemIds.forEach(id => {
            forgottenCounts[id] = (forgottenCounts[id] || 0) + 1;
        });
    });
    const frequentlyForgottenIds = Object.keys(forgottenCounts).filter(id => forgottenCounts[id] >= 3); // Example: 3+ times

    for (const item of itemsForDay) {
        if (item.checked) continue; // Skip already checked items

        if (item.priority === '必須' || item.priority === '重要' || frequentlyForgottenIds.includes(item.id.toString())) {
            itemsToReNotify.push(item.name);
        }
    }

    if (itemsToReNotify.length > 0) {
        const nextNotifyTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        try {
            await self.registration.showNotification('【未チェックあり】持ち物を確認してください', {
                tag: `renotify-${Date.now()}`,
                body: `未チェックの重要アイテムがあります: ${itemsToReNotify.join('、')}`,
                icon: '/CheckMate-V2/icons/icon-192.png',
                showTrigger: new TimestampTrigger(nextNotifyTime.getTime()),
                renotify: true, // Allow this to be re-notified again if needed
                data: { ...data } // Carry over original data
            });
        } catch (error) {
            console.error('Error scheduling re-notification:', error);
        }
    }
});
