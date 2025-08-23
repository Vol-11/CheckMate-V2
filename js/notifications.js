
/**
 * =================================================================
 * ローカル通知機能 / Local Notifications
 * =================================================================
 * Notification APIとService Workerを利用して、アイテムのローカル通知を管理します。
 * Handles local notifications for items using the Notification API and Service Worker.
 */
(function() {
    'use strict';

    // ブラウザが主要なAPIをサポートしているか確認
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('このブラウザは通知機能またはService Workerをサポートしていません。');
        return;
    }

    const notificationLogic = {
        hasShowTrigger: window.Notification.prototype.hasOwnProperty('showTrigger'),

        /**
         * @type {ServiceWorkerRegistration|null}
         */
        swRegistration: null,

        /**
         * 初期化処理
         * アプリケーション起動時に呼び出される
         */
        init: async function() {
            this.swRegistration = await navigator.serviceWorker.ready;

            // showTrigger未対応の場合、ユーザーに警告
            if (!this.hasShowTrigger) {
                this.showFallbackWarning();
            }
            
            // 初回起動時に通知許可を要求
            this.requestPermission();
        },

        /**
         * 通知の許可をユーザーに要求する
         * 丁寧なメッセージで許可を促す
         */
        requestPermission: function() {
            if (Notification.permission === 'default') {
                // ここではシンプルなconfirmを使いますが、UIに組み込むのがより丁寧です
                const ask = confirm('タスクの期限を通知でお知らせしますか？\nこの機能を有効にするには、次のダイアログで「許可」を選択してください。');
                if (ask) {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            console.log('通知の許可が得られました。');
                        } else {
                            console.log('通知は拒否されました。');
                        }
                    });
                }
            }
        },

        /**
         * showTrigger APIが使えない場合の警告を表示する
         * アプリが閉じていると通知が機能しないことを伝える
         */
        showFallbackWarning: function() {
            // UIに警告メッセージを表示する（例: bodyの先頭に要素を追加）
            const warningEl = document.createElement('div');
            warningEl.style.backgroundColor = '#ffc107';
            warningEl.style.padding = '10px';
            warningEl.style.textAlign = 'center';
            warningEl.style.position = 'fixed';
            warningEl.style.top = '0';
            warningEl.style.left = '0';
            warningEl.style.width = '100%';
            warningEl.style.zIndex = '1000';
            warningEl.textContent = 'お使いのブラウザは、アプリが閉じている間の通知に対応していません。通知はアプリを開いている間のみ機能します。';
            document.body.prepend(warningEl);
        },

        /**
         * アイテムの通知をスケジュールまたはキャンセルする
         * @param {string} itemId - 対象アイテムのID
         * @param {HTMLElement} iconEl - クリックされたベルアイコン要素
         */
        toggleNotification: async function(itemId, iconEl) {
            if (Notification.permission !== 'granted') {
                alert('通知機能が許可されていません。ブラウザの設定を確認してください。');
                return this.requestPermission();
            }

            // indexdb.jsから現在のアイテム情報を取得することを想定
            const item = await window.db.getItem(itemId);
            if (!item) return;

            if (item.notifyAt) {
                // 既に予約済みの場合はキャンセル
                await this.cancelNotification(item);
                iconEl.classList.remove('active');
            } else {
                // 新規予約
                const time = prompt('通知時刻を「HH:MM」形式で入力してください (例: 09:30)。', '12:00');
                if (time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
                    await this.scheduleNotification(item, time);
                    iconEl.classList.add('active');
                } else if (time) {
                    alert('時刻の形式が正しくありません。');
                }
            }
        },

        /**
         * 通知をスケジュールする
         * @param {object} item - 対象アイテム
         * @param {string} time - 通知時刻 "HH:MM"
         */
        scheduleNotification: async function(item, time) {
            item.notifyAt = time;
            // indexdb.jsでアイテムを更新することを想定
            await window.db.updateItem(item);

            if (this.hasShowTrigger) {
                // Service Workerにスケジュールを依頼
                this.swRegistration.active.postMessage({
                    type: 'schedule',
                    item: item
                });
            } else {
                // フォールバック: setTimeoutでスケジュール
                this.scheduleWithTimeout(item);
            }
            console.log(`通知を予約しました: ${item.name} at ${item.notifyAt}`);
        },

        /**
         * 通知をキャンセルする
         * @param {object} item - 対象アイテム
         */
        cancelNotification: async function(item) {
            console.log(`通知をキャンセルしました: ${item.name}`);
            item.notifyAt = null;
            // indexdb.jsでアイテムを更新することを想定
            await window.db.updateItem(item);

            if (this.hasShowTrigger) {
                // Service Workerにキャンセルを依頼
                this.swRegistration.active.postMessage({
                    type: 'cancel',
                    itemId: item.id
                });
            }
            // setTimeoutのフォールバックは、次のチェックで自動的に無視される
        },

        /**
         * [フォールバック] setTimeoutを使用して通知をスケジュールする
         * アプリが起動中のみ機能する
         */
        scheduleWithTimeout: function(item) {
            if (!item.notifyAt || item.checked) return;

            const [hours, minutes] = item.notifyAt.split(':');
            const now = new Date();
            const notifyTime = new Date();
            notifyTime.setHours(hours, minutes, 0, 0);

            // 5分前通知
            const preNotifyTime = new Date(notifyTime.getTime() - 5 * 60 * 1000);
            if (preNotifyTime > now) {
                const delay = preNotifyTime.getTime() - now.getTime();
                setTimeout(async () => {
                    const currentItem = await window.db.getItem(item.id);
                    if (currentItem && !currentItem.checked) {
                         new Notification(`まもなく: ${currentItem.name}`, {
                            body: `5分後に「${currentItem.name}」のタスクが予定されています。`,
                            tag: `${currentItem.id}-pre-fallback`,
                            icon: '/icons/icon-192.png'
                        });
                    }
                }, delay);
            }

            // メイン通知
            if (notifyTime > now) {
                const delay = notifyTime.getTime() - now.getTime();
                setTimeout(() => this.showFallbackNotification(item.id, 3), delay);
            }
        },
        
        /**
         * [フォールバック] 通知を表示し、必要に応じて再通知をスケジュールする
         * @param {string} itemId 
         * @param {number} retriesLeft 
         */
        showFallbackNotification: async function(itemId, retriesLeft) {
            const item = await window.db.getItem(itemId);
            if (!item || !item.notifyAt || item.checked) return; // 実行中にチェックされた場合は中断

            new Notification(item.name, {
                body: `タスク「${item.name}」の期限です。優先度: ${item.priority}`,
                tag: `${item.id}-fallback`,
                icon: '/icons/icon-192.png',
                renotify: true
            });

            // 'must' の場合、10分後に再通知を試みる
            if (item.priority === 'must' && retriesLeft > 0) {
                setTimeout(() => {
                    this.showFallbackNotification(itemId, retriesLeft - 1);
                }, 10 * 60 * 1000); // 10分
            }
        },

        /**
         * アイテムのDOM要素に通知UI（ベルアイコン）を追加・設定する
         * @param {HTMLElement} itemEl - アイテムのリスト要素 (e.g., <li>)
         * @param {object} item - アイテムデータ
         */
        setupItemUI: function(itemEl, item) {
            let bellIcon = itemEl.querySelector('.notification-bell');
            if (!bellIcon) {
                bellIcon = document.createElement('span');
                bellIcon.className = 'notification-bell';
                bellIcon.innerHTML = '&#x1F514;'; // Bell character
                // スタイルはCSSで定義することを推奨
                bellIcon.style.cursor = 'pointer';
                bellIcon.style.marginLeft = '10px';
                bellIcon.style.opacity = '0.5';
                
                // アイテム名の隣など、適切な場所にアイコンを挿入
                const itemNameEl = itemEl.querySelector('.item-name'); // 仮のセレクタ
                if (itemNameEl) {
                    itemNameEl.parentNode.insertBefore(bellIcon, itemNameEl.nextSibling);
                } else {
                    itemEl.appendChild(bellIcon);
                }
            }

            bellIcon.onclick = (e) => {
                e.stopPropagation();
                this.toggleNotification(item.id, bellIcon);
            };

            if (item.notifyAt) {
                bellIcon.classList.add('active');
                bellIcon.style.opacity = '1';
                bellIcon.style.color = 'orange'; // 予約中は橙色
            } else {
                bellIcon.classList.remove('active');
                bellIcon.style.opacity = '0.5';
                bellIcon.style.color = '';
            }
        }
    };

    // グローバルスコープに公開
    window.notifications = notificationLogic;

    // Service Workerが準備できたら初期化
    navigator.serviceWorker.ready.then(() => {
        window.notifications.init();
        // showTriggerがない場合、1分ごとにタイムアウトを再計算
        if (!window.notifications.hasShowTrigger) {
            setInterval(async () => {
                const allItems = await window.db.getAllItems(); // indexdb.jsの全件取得を想定
                allItems.forEach(item => window.notifications.scheduleWithTimeout(item));
            }, 60 * 1000);
        }
    });

})();
