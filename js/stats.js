// 統計更新
async function updateStats() {
  const total = items.length;

  // 明日の日付を取得
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 明日の日付のアイテムを全て取得
  const tomorrowItems = await getItemsForDate(tomorrow);

  const checked = tomorrowItems.filter(i => i.checked).length;
  const today = tomorrowItems.length;

  document.getElementById('total-items').textContent = total;
  document.getElementById('checked-items').textContent = checked;
  document.getElementById('today-items').textContent = today;
}

async function updateDetailedStats() {
  const total = items.length;
  const categories = [...new Set(items.map(i => i.category))].length;
  const barcodes = items.filter(i => i.code).length;

  // 明日の日付を取得
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 明日のアイテムを取得して完了率を計算
  const tomorrowItems = await getItemsForDate(tomorrow);
  const tomorrowTotal = tomorrowItems.length;
  const tomorrowChecked = tomorrowItems.filter(i => i.checked).length;
  const completion = tomorrowTotal > 0 ? Math.round((tomorrowChecked / tomorrowTotal) * 100) : 0;

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