// 統計更新
function updateStats() {
  const total = items.length;
  const checked = items.filter(i => i.checked).length;
  const today = getTodayItems().length;

  document.getElementById('total-items').textContent = total;
  document.getElementById('checked-items').textContent = checked;
  document.getElementById('today-items').textContent = today;
}

function updateDetailedStats() {
  const total = items.length;
  const categories = [...new Set(items.map(i => i.category))].length;
  const barcodes = items.filter(i => i.code).length;
  const checked = items.filter(i => i.checked).length;
  const completion = total > 0 ? Math.round((checked / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-categories').textContent = categories;
  document.getElementById('stat-barcodes').textContent = barcodes;
  document.getElementById('stat-completion').textContent = completion + '%';

  // データリセット機能
    document.getElementById('reset-all-items-btn').addEventListener('click', async () => {
        if (confirm('全てのアイテムを削除します。本当によろしいですか？\nこの操作は元に戻せません。')) {
            await clearItems();
            items = [];
            await renderItems();
            await updateCheckDisplay();
            await updateStats();
            showStatus('🗑 全てのアイテムを削除しました', 'success');
        }
    });

    document.getElementById('reset-forgotten-history-btn').addEventListener('click', async () => {
        if (confirm('全ての忘れ物履歴を削除します。本当によろしいですか？\nこの操作は元に戻せません。')) {
            await clearForgottenRecords();
            // UIの更新
            await renderItems(); // ハイライトを消すため
            await updateCheckDisplay(); // ハイライトを消すため
            showStatus('😥 全ての忘れ物履歴を削除しました', 'success');
            // もし忘れ物タブが開かれていたら、表示を更新する
            if (document.getElementById('forgotten').style.display !== 'none') {
                renderForgottenHistoryMode();
            }
        }
    });

    document.getElementById('reset-categories-btn').addEventListener('click', async () => {
        if (confirm('全てのカスタムカテゴリを削除し、デフォルト設定に戻します。本当によろしいですか？')) {
            await clearCategories();
            await loadCategoriesAndInitialize(); // デフォルトを再読み込み
            showStatus('🏷️ カテゴリをリセットしました', 'success');
        }
    });

}