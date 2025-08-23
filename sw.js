/* キャッシュ名はバージョンで変えると更新が楽 */
const CACHE_NAME = 'wasuremono-pro-v2.2';

/* オフラインでも必要なファイルを列挙 */
const urlsToCache = [
  '/CheckMate-V2/',             // GitHub Pages のルート（上と同じ）
  '/CheckMate-V2/index.html',
  '/CheckMate-V2/js/dark_mode.js',
    '/CheckMate-V2/js/indexdb.js',
    '/CheckMate-V2/js/style_config.js',
    '/CheckMate-V2/js/dark_mode_startup.js',
  // '/CheckMate-V2/icons/icon-192.png',
  '/CheckMate-V2/icons/icon-512.png',
  'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js'
];

/* インストール時にファイルをキャッシュ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.error('❌ cache failed:', url, err);
        }
      }
    })
  );
});


/* 新旧キャッシュを整理（任意 ─ 推奨） */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

/* ネット優先。失敗したらキャッシュを返す */
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// notify patch start
// =================================================================
// ローカル通知機能パッチ
// =================================================================

/**
 * Service Workerにメッセージが送られたときの処理
 * 主に通知のスケジュールとキャンセルを行う
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'schedule') {
        scheduleNotification(event.data.item);
    }
    if (event.data && event.data.type === 'cancel') {
        cancelNotification(event.data.itemId);
    }
});

/**
 * showTriggerを使用して通知をスケジュールする
 * @param {object} item - 通知するアイテム
 */
async function scheduleNotification(item) {
    if (!item.notifyAt) return;

    const [hours, minutes] = item.notifyAt.split(':');
    const now = new Date();
    const notifyTime = new Date();
    notifyTime.setHours(hours, minutes, 0, 0);

    // 既に時刻を過ぎている場合はスケジュールしない（ただし、今日の未来の時刻ならOK）
    if (notifyTime < now) {
        notifyTime.setDate(notifyTime.getDate() + 1); // 明日の同じ時刻に設定
    }

    // 1. 5分前通知
    const preNotifyTime = new Date(notifyTime.getTime() - 5 * 60 * 1000);
    if (preNotifyTime > new Date()) {
        self.registration.showNotification(`まもなく: ${item.name}` , {
            tag: `${item.id}-pre`,
            body: `5分後に「${item.name}」のタスクが予定されています。`,
            icon: '/icons/icon-192.png',
            showTrigger: new TimestampTrigger(preNotifyTime.getTime()),
            data: { itemId: item.id }
        });
    }

    // 2. メイン通知
    self.registration.showNotification(item.name, {
        tag: item.id,
        body: `タスク「${item.name}」の期限です。優先度: ${item.priority}`,
        icon: '/icons/icon-192.png',
        showTrigger: new TimestampTrigger(notifyTime.getTime()),
        renotify: true, // 再通知を許可
        data: {
            itemId: item.id,
            priority: item.priority,
            originalTime: notifyTime.getTime(),
            renotifyCount: item.priority === 'must' ? 3 : 0 // mustなら3回再通知
        }
    });
}

/**
 * 特定のアイテムに関連するすべての通知をキャンセルする
 * @param {string} itemId - キャンセルするアイテムのID
 */
async function cancelNotification(itemId) {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(notification => {
        // タグがIDで始まるものをすべてキャンセル (e.g., 'item-id', 'item-id-pre', 'item-id-renotify-1')
        if (notification.tag.startsWith(itemId)) {
            notification.close();
        }
    });
}

/**
 * 通知がクリックされたときのデフォルトの動作
 * アプリケーションを開き、フォーカスする
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            } else {
                return clients.openWindow('/');
            }
        })
    );
});

/**
 * 通知が表示された後の処理 (主に再通知ロジック)
 */
self.addEventListener('notificationclose', async (event) => {
    const notification = event.notification;
    const data = notification.data;

    // データがない、または再通知カウントがない場合は終了
    if (!data || !data.renotifyCount || data.renotifyCount <= 0) {
        return;
    }

    // TODO: 本来はここでIndexedDBにアクセスして、アイテムが未チェックか確認するのが最も確実です。
    // しかし、ServiceWorkerからのIndexedDBアクセスは複雑なため、ここではデモとして
    // closeイベントをトリガーに再通知をスケジュールします。
    // ユーザーがチェックした場合、メインスレッドからキャンセルメッセージが送られ、この再通知もキャンセルされます。

    const newRenotifyCount = data.renotifyCount - 1;
    const nextNotifyTime = new Date(notification.timestamp + 10 * 60 * 1000); // 10分後

    self.registration.showNotification(`${data.name} (再通知)`, {
        tag: `${data.itemId}-renotify-${newRenotifyCount}`,
        body: `【再通知】タスク「${data.name}」が未完了です。`,
        icon: '/icons/icon-192.png',
        showTrigger: new TimestampTrigger(nextNotifyTime.getTime()),
        renotify: true,
        data: {
            ...data,
            renotifyCount: newRenotifyCount
        }
    });
});

// notify patch end