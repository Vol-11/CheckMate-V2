// バックアップ・復元
document.getElementById('backup-btn').addEventListener('click', async () => {
  try {
    const allItems = await getAllItems();
    const allCategories = await getAllCategories();
    localStorage.setItem('wasuremono-backup', JSON.stringify({
      version: 2,
      categories: allCategories,
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
    if (confirm(`バックアップ（${new Date(data.backupAt).toLocaleString()}）から復元しますか？\n現在のデータは上書きされます。`)) {
      await clearItems();
      await clearCategories();

      const isNewVersion = data.version === 2 && Array.isArray(data.categories) && Array.isArray(data.items);

      if (isNewVersion) {
        // 新バージョン
        for (const category of data.categories) {
          await addCategory(category);
        }
        for (const item of data.items) {
          delete item.id;
          await addItem(item);
        }
      } else {
        // 旧バージョン (data.items があると想定)
        const importItems = data.items || [];
        const categoryNames = new Set();
        for (const item of importItems) {
          delete item.id;
          await addItem(item);
          if (item.category) {
            categoryNames.add(item.category);
          }
        }
        for (const catName of categoryNames) {
          await addCategory({ id: new Date().getTime() + Math.random(), name: catName });
        }
      }

      // UIを再読み込み・再描画
      await loadCategoriesAndInitialize();
      await loadItems();
      updateDetailedStats();
      scanResults.clear();
      renderScanResults();
      showStatus('🔄 バックアップから復元しました', 'success');
    }
  } catch (err) {
    showStatus('復元に失敗しました: ' + err.message, 'error');
  }
});
