// データ管理機能（エクスポート/インポート/バックアップ）
(function() {
  'use strict';

  // エクスポート機能
  async function exportData() {
    try {
      const allItems = await window.dbManager.getAllItems();
      const exportData = {
        items: allItems,
        exportedAt: new Date().toISOString(),
        version: '2.2',
        app: 'wasuremono-pro'
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `忘れ物防止Pro_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      window.showStatus('✅ データをエクスポートしました', 'success');
    } catch (err) {
      window.showStatus('エクスポートに失敗しました: ' + err.message, 'error');
    }
  }

  // インポート機能
  async function importData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const importItems = data.items || data;

        if (!Array.isArray(importItems)) {
          throw new Error('不正なデータ形式です');
        }

        if (confirm(`${importItems.length}件のアイテムをインポートします。\n既存のデータは削除されます。続行しますか？`)) {
          await window.dbManager.clearItems();

          for (const item of importItems) {
            delete item.id;
            item.checked = false;
            if (!item.category) item.category = 'その他';
            if (!item.priority) item.priority = '普通';
            if (!item.days) item.days = [];
            await window.dbManager.addItem(item);
          }

          await window.loadItems();
          window.updateDetailedStats();
          window.appState.scanResults.clear();
          window.renderScanResults();
          window.showStatus(`✅ ${importItems.length}件のアイテムをインポートしました`, 'success');
        }
      } catch (err) {
        window.showStatus('インポートに失敗しました: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // バックアップ機能
  async function createBackup() {
    try {
      const allItems = await window.dbManager.getAllItems();
      localStorage.setItem('wasuremono-backup', JSON.stringify({
        items: allItems,
        backupAt: new Date().toISOString()
      }));
      window.showStatus('💾 バックアップを作成しました', 'success');
    } catch (err) {
      window.showStatus('バックアップに失敗しました: ' + err.message, 'error');
    }
  }

  // 復元機能
  async function restoreBackup() {
    try {
      const backup = localStorage.getItem('wasuremono-backup');
      if (!backup) {
        window.showStatus('バックアップが見つかりません', 'warning');
        return;
      }

      const data = JSON.parse(backup);
      if (confirm(`バックアップ（${new Date(data.backupAt).toLocaleString()}）から復元しますか？\n現在のデータは削除されます。`)) {
        await window.dbManager.clearItems();

        for (const item of data.items) {
          delete item.id;
          await window.dbManager.addItem(item);
        }

        await window.loadItems();
        window.updateDetailedStats();
        window.appState.scanResults.clear();
        window.renderScanResults();
        window.showStatus('🔄 バックアップから復元しました', 'success');
      }
    } catch (err) {
      window.showStatus('復元に失敗しました: ' + err.message, 'error');
    }
  }

  // PWAインストール機能
  async function installPWA() {
    const deferredPrompt = window.pwaManger.deferredPrompt;
    const installBtn = window.pwaManger.installBtn;

    if (!deferredPrompt) {
      window.showStatus('このブラウザではPWAインストールがサポートされていません', 'warning');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      if (installBtn) installBtn.classList.add('hidden');
      window.showStatus('📱 PWAがインストールされました', 'success');
    }

    window.pwaManger.deferredPrompt = null;
  }

  // イベントリスナーの設定
  function setupEventListeners() {
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const installPwaBtn = document.getElementById('install-pwa');

    if (exportBtn) {
      exportBtn.addEventListener('click', exportData);
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => {
        importData(e.target.files[0]);
        e.target.value = '';
      });
    }

    if (backupBtn) {
      backupBtn.addEventListener('click', createBackup);
    }

    if (restoreBtn) {
      restoreBtn.addEventListener('click', restoreBackup);
    }

    if (installPwaBtn) {
      installPwaBtn.addEventListener('click', installPWA);
    }
  }

  // DOM読み込み完了時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }

  // グローバルに公開
  window.dataManager = {
    exportData,
    importData,
    createBackup,
    restoreBackup,
    installPWA
  };

})();
