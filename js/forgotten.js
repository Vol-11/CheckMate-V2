// 忘れ物記録機能

async function renderForgottenRecords() {
  const forgottenContainer = document.getElementById('forgotten');
  if (forgottenContainer.classList.contains('hidden')) return; // タブが表示されていない場合は何もしない

  const forgottenStats = document.getElementById('forgotten-stats');
  const forgottenList = document.getElementById('forgotten-list');

  const records = await getAllForgottenRecords();
  
  if (records.length === 0) {
    forgottenStats.innerHTML = '';
    forgottenList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">まだ忘れ物の記録はありません。</div>';
    return;
  }

  // 統計計算
  const allForgottenItemIds = records.flatMap(r => r.forgottenItems);
  const forgottenCounts = allForgottenItemIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const mostForgottenItems = Object.entries(forgottenCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id, count]) => {
      const item = items.find(i => i.id === parseInt(id));
      return { item, count };
    });

  // 統計情報の描画
  let statsHtml = `
    <h4 class="text-md font-semibold mb-3">忘れ物ワースト3</h4>
    <ul class="space-y-2">
  `;
  if (mostForgottenItems.length > 0) {
    mostForgottenItems.forEach(({ item, count }) => {
      if (item) {
        statsHtml += `
          <li class="flex justify-between items-center bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg">
            <span>${getCategoryIcon(item.category)} ${item.name}</span>
            <span class="font-bold text-orange-600 dark:text-orange-400">${count}回</span>
          </li>
        `;
      }
    });
  } else {
    statsHtml += '<li class="text-gray-500 dark:text-gray-400">データがありません</li>';
  }
  statsHtml += '</ul>';
  forgottenStats.innerHTML = statsHtml;

  // 忘れ物リストの描画
  let listHtml = '<ul class="space-y-3">';
  // 日付の新しい順にソート
  records.sort((a, b) => new Date(b.date) - new Date(a.date));

  records.forEach(record => {
    listHtml += `
      <li class="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
        <details>
          <summary class="font-semibold cursor-pointer">📅 ${record.date} (${record.forgottenItems.length}件)</summary>
          <ul class="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
    `;
    record.forgottenItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        listHtml += `
          <li class="flex items-center">
            <span class="mr-2">${getCategoryIcon(item.category)}</span>
            <span>${item.name}</span>
          </li>
        `;
      }
    });
    listHtml += '</ul></details></li>';
  });
  listHtml += '</ul>';
  forgottenList.innerHTML = listHtml;
}

// タブがクリックされたら忘れ物記録を再描画する
// このイベントリスナーは `tab.js` の `data-tab` を処理するロジックと連携して動作する
document.addEventListener('tabChanged', (e) => {
  if (e.detail.tab === 'forgotten') {
    renderForgottenRecords();
  }
});