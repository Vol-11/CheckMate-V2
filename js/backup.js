// バックアップ・復元
document.getElementById('backup-btn').addEventListener('click', async () => {
  try {
    const allItems = await getAllItems();
    localStorage.setItem('wasuremono-backup', JSON.stringify({
      items: allItems,
      backupAt: new Date().toISOString()
    }));
    showStatus('💾 バックアップを作成しました', 'success');
  } catch (err) {
    showStatus('バックアップに失敗しました: ' + err.message, 'error');
  }
});

document.getElementById('restore-btn').addEventListener('click', async () => {
  try {
    const backup = localStorage.getItem('wasuremono-backup');
    if (!backup) {
      showStatus('バックアップが見つかりません', 'warning');
      return;
    }

    const data = JSON.parse(backup);
    if (confirm(`バックアップ（${new Date(data.backupAt).toLocaleString()}）から復元しますか？\n現在のデータは削除されます。`)) {
      await clearItems();

      for (const item of data.items) {
        delete item.id;
        await addItem(item);
      }

      await loadItems();
      updateDetailedStats();  // 統計情報も更新
      scanResults.clear();
      renderScanResults();
      showStatus('🔄 バックアップから復元しました', 'success');
    }
  } catch (err) {
    showStatus('復元に失敗しました: ' + err.message, 'error');
  }
});