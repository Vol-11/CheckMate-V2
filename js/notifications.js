/**
 * =================================================================
 * ローカル通知機能 / Local Notifications
 * =================================================================
 * PWAの通知設定を管理し、Service Workerと連携して通知をスケジュールします。
 * Manages PWA notification settings and schedules notifications via the Service Worker.
 */
(function() {
    'use strict';

    // --- DOM要素 --- //
    const container = document.getElementById('notification-settings-container');
    const toggle = document.getElementById('notification-toggle');
    const optionsDiv = document.getElementById('notification-options');
    const timeInput = document.getElementById('notification-time');
    const renotifyToggle = document.getElementById('renotify-toggle');

    // --- localStorageキー --- //
    const SETTINGS_KEY = 'notificationSettings';

    // --- 通知マネージャー --- //
    const NotificationManager = {
        swRegistration: null,
        settings: {
            enabled: false,
            time: '08:00',
            renotify: true
        },

        /**
         * 初期化
         */
        async init() {
            if (!('Notification' in window) || !('serviceWorker' in navigator) || !container) {
                console.warn('通知機能はサポートされていないか、設定UIが見つかりません。');
                return;
            }

            // PWAモードまたはHTTPS経由でのみ表示
            const isPWA = window.matchMedia('(display-mode: standalone)').matches;
            const isHttps = window.location.protocol === 'https:';

            if (isPWA || isHttps) {
                container.classList.remove('hidden');
            } else {
                return; // PWA/HTTPSでない場合は何もしない
            }

            this.swRegistration = await navigator.serviceWorker.ready;
            this.loadSettings();
            this.updateUI();
            this.addEventListeners();
        },

        /**
         * localStorageから設定を読み込む
         */
        loadSettings() {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
        },

        /**
         * 現在の設定に基づいてUIを更新する
         */
        updateUI() {
            toggle.checked = this.settings.enabled;
            timeInput.value = this.settings.time;
            renotifyToggle.checked = this.settings.renotify;

            if (this.settings.enabled) {
                optionsDiv.classList.remove('hidden');
            } else {
                optionsDiv.classList.add('hidden');
            }
        },

        /**
         * UI要素にイベントリスナーを追加する
         */
        addEventListeners() {
            toggle.addEventListener('change', () => this.handleToggle());
            timeInput.addEventListener('change', () => this.updateAndReschedule());
            renotifyToggle.addEventListener('change', () => this.updateAndReschedule());
        },

        /**
         * 通知の有効/無効トグルを処理する
         */
        async handleToggle() {
            this.settings.enabled = toggle.checked;

            if (this.settings.enabled) {
                // 有効にした場合、まず許可を求める
                const permission = await this.requestPermission();
                if (permission === 'granted') {
                    optionsDiv.classList.remove('hidden');
                    this.updateAndReschedule();
                } else {
                    // 許可されなかった場合はトグルを戻す
                    this.settings.enabled = false;
                    toggle.checked = false;
                    showStatus('通知が許可されませんでした。', 'warning');
                }
            } else {
                // 無効にした場合は全ての通知をキャンセル
                optionsDiv.classList.add('hidden');
                this.cancelAllNotifications();
                this.saveSettings();
                showStatus('通知をオフにしました。', 'info');
            }
        },

        /**
         * 設定を保存し、通知を再スケジュールする
         */
        updateAndReschedule() {
            this.settings.time = timeInput.value;
            this.settings.renotify = renotifyToggle.checked;
            this.saveSettings();
            this.scheduleDailyNotification();
            showStatus('通知設定を更新しました。', 'success');
        },

        /**
         * 設定をlocalStorageに保存する
         */
        saveSettings() {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        },

        /**
         * 通知の許可をユーザーに要求する
         * @returns {Promise<NotificationPermission>}
         */
        async requestPermission() {
            if (Notification.permission === 'granted') {
                return 'granted';
            }
            return await Notification.requestPermission();
        },

        /**
         * 毎日のサマリー通知をスケジュールする
         */
        async scheduleDailyNotification() {
            if (!this.settings.enabled || !this.swRegistration || !this.swRegistration.active) {
                return;
            }

            // まず既存のデイリー通知をキャンセル
            await this.cancelAllNotifications(false); // UIメッセージは表示しない

            const items = await getAllItems();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][tomorrow.getDay()];

            const tomorrowItems = items.filter(item => item.days.includes(dayOfWeek));

            if (tomorrowItems.length === 0) {
                console.log('明日のアイテムはないため、通知はスケジュールされません。');
                return;
            }

            const body = tomorrowItems.length > 3
                ? `${tomorrowItems.slice(0, 3).map(i => i.name).join('、')}他、全${tomorrowItems.length}件の持ち物があります。`
                : `${tomorrowItems.map(i => i.name).join('、')}があります。忘れずに準備しましょう！`;

            this.swRegistration.active.postMessage({
                type: 'schedule-daily',
                payload: {
                    title: '明日の持ち物のお知らせ',
                    body: body,
                    time: this.settings.time,
                    renotify: this.settings.renotify,
                    tag: 'daily-summary'
                }
            });
        },

        /**
         * 全ての通知をキャンセルする
         * @param {boolean} showMsg - UIにメッセージを表示するか
         */
        cancelAllNotifications(showMsg = true) {
            if (this.swRegistration && this.swRegistration.active) {
                this.swRegistration.active.postMessage({ type: 'cancel-all' });
                if(showMsg) showStatus('スケジュールされた全ての通知をキャンセルしました。', 'info');
            }
        }
    };

    // グローバルスコープに公開
    window.NotificationManager = NotificationManager;
})();