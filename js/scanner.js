// バーコードスキャナー機能
(function() {
  'use strict';

  const quaggaConfig = {
    inputStream: {
      name: 'Live', type: 'LiveStream',
      constraints: {
        facingMode: 'environment',
        width: { min: 640, ideal: 800, max: 1280 },
        height: { min: 480, ideal: 600, max: 720 }
      },
      area: { top: '20%', right: '15%', left: '15%', bottom: '20%' },
      willReadFrequently: true
    },
    frequency: 8, numOfWorkers: 2,
    decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader'], multiple: false },
    locate: true,
    locator: { patchSize: 'medium', halfSample: false },
    debug: { drawBoundingBox: true, showFrequency: false, drawScanline: true, showPattern: false }
  };

  // 登録用スキャン検出
  function onDetected(result) {
    const code = result.codeResult.code;
    if (!code) return;

    const existing = window.appState.items.find(i => i.code === code);
    const status = document.getElementById('status');

    if (existing) {
      status.textContent = `✅ 既に登録済み: ${existing.name} (${code})`;
      status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      return;
    }

    status.textContent = `📖 検出: ${code} - アイテム名を入力してください`;
    status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
    document.getElementById('detail-code').value = code;
    document.getElementById('detail-name').focus();

    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
  }

  // チェック用スキャン検出
  function onCheckDetected(result) {
    const code = result.codeResult.code;
    if (!code) return;

    const currentDay = window.appState.currentDay;
    const items = window.appState.items;
    const scanResults = window.appState.scanResults;
    const checkStatus = document.getElementById('check-status');

    const dayItems = items.filter(i => i.days.includes(currentDay));
    const foundItem = dayItems.find(i => i.code === code);

    if (foundItem) {
      if (!foundItem.checked) {
        foundItem.checked = true;
        window.dbManager.updateItem(foundItem);
        window.updateStats();
        window.updateCheckDisplay();

        scanResults.set(code, {
          item: foundItem,
          timestamp: new Date(),
          status: 'checked'
        });

        checkStatus.textContent = `✅ チェック完了: ${foundItem.name}`;
        checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';

        const checkResult = document.getElementById('check-result');
        checkResult.className = 'p-4 rounded-lg mb-4 text-center font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
        checkResult.innerHTML = `
          <div>✅ <strong>${foundItem.name}</strong></div>
          <div class="text-sm mt-1">自動でチェックしました</div>
        `;
        checkResult.classList.remove('hidden');

        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);

      } else {
        checkStatus.textContent = `ℹ️ 既にチェック済み: ${foundItem.name}`;
        checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }

    } else {
      const anyItem = items.find(i => i.code === code);

      if (anyItem) {
        checkStatus.textContent = `⚠️ ${currentDay}曜日には不要: ${anyItem.name}`;
        checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';

        const checkResult = document.getElementById('check-result');
        checkResult.className = 'p-4 rounded-lg mb-4 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
        checkResult.innerHTML = `
          <div>⚠️ <strong>${anyItem.name}</strong></div>
          <div class="text-sm mt-1">${currentDay}曜日のリストにありません</div>
        `;
        checkResult.classList.remove('hidden');
      } else {
        checkStatus.textContent = `❌ 未登録アイテム: ${code}`;
        checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';

        const checkResult = document.getElementById('check-result');
        checkResult.className = 'p-4 rounded-lg mb-4 text-center font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
        checkResult.innerHTML = `
          <div>❌ <strong>未登録アイテム</strong></div>
          <div class="text-sm mt-1">バーコード: ${code}</div>
        `;
        checkResult.classList.remove('hidden');
      }

      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }

    window.renderScanResults();

    setTimeout(() => {
      checkStatus.textContent = '📷 バーコードを読み取って自動チェック';
      checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      document.getElementById('check-result').classList.add('hidden');
    }, 3000);
  }

  // スキャナー制御
  function startScanning() {
    if (window.appState.isScanning) return;
    const status = document.getElementById('status');
    const scanBtn = document.getElementById('scan-btn');
    const stopBtn = document.getElementById('stop-btn');
    const viewport = document.getElementById('viewport');

    status.textContent = '🔧 カメラ初期化中...';
    status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';

    Quagga.init({...quaggaConfig, inputStream: {...quaggaConfig.inputStream, target: viewport}}, err => {
      if (err) {
        status.textContent = `❌ カメラエラー: ${err.message || err}`;
        status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
        return;
      }

      Quagga.start();
      window.appState.isScanning = true;
      Quagga.onDetected(onDetected);
      status.textContent = '🔍 バーコードを緑枠内に合わせてください';
      status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      scanBtn.disabled = true;
      stopBtn.disabled = false;
    });
  }

  function stopScanning() {
    if (!window.appState.isScanning) return;
    const status = document.getElementById('status');
    const scanBtn = document.getElementById('scan-btn');
    const stopBtn = document.getElementById('stop-btn');

    Quagga.offDetected(onDetected);
    Quagga.stop();
    window.appState.isScanning = false;
    status.textContent = '⏹ スキャン停止';
    status.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    scanBtn.disabled = false;
    stopBtn.disabled = true;
  }

  function startCheckScanning() {
    if (window.appState.isCheckScanning) return;
    const checkStatus = document.getElementById('check-status');
    const checkScanBtn = document.getElementById('check-scan-btn');
    const checkStopBtn = document.getElementById('check-stop-btn');
    const checkViewport = document.getElementById('check-viewport');

    checkStatus.textContent = '🔧 カメラ初期化中...';
    checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';

    Quagga.init({...quaggaConfig, inputStream: {...quaggaConfig.inputStream, target: checkViewport}}, err => {
      if (err) {
        checkStatus.textContent = `❌ カメラエラー: ${err.message || err}`;
        checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
        return;
      }

      Quagga.start();
      window.appState.isCheckScanning = true;
      Quagga.onDetected(onCheckDetected);
      checkStatus.textContent = '🔍 バーコードを緑枠内に合わせてください';
      checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      checkScanBtn.disabled = true;
      checkStopBtn.disabled = false;
    });
  }

  function stopCheckScanning() {
    if (!window.appState.isCheckScanning) return;
    const checkStatus = document.getElementById('check-status');
    const checkScanBtn = document.getElementById('check-scan-btn');
    const checkStopBtn = document.getElementById('check-stop-btn');

    Quagga.offDetected(onCheckDetected);
    Quagga.stop();
    window.appState.isCheckScanning = false;
    checkStatus.textContent = '⏹ スキャン停止';
    checkStatus.className = 'p-3 rounded-lg mb-4 text-center font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
    checkScanBtn.disabled = false;
    checkStopBtn.disabled = true;
  }

  // グローバルに公開
  window.scannerManager = {
    startScanning,
    stopScanning,
    startCheckScanning,
    stopCheckScanning
  };

})();
