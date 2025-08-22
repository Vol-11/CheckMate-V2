async function getForgottenItemStats() {
  const records = await getAllForgottenRecords();
  if (records.length === 0) {
    return { counts: {}, total: 0 };
  }

  const allForgottenItemIds = records.flatMap(r => r.forgottenItems);
  const forgottenCounts = allForgottenItemIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return { counts: forgottenCounts, total: allForgottenItemIds.length };
}

/**
 * 忘れ物に関する包括的な統計情報を生成します。
 * @returns {Promise<object>} 統計情報オブジェクト
 */
async function getForgottenStats() {
  const records = await getAllForgottenRecords();
  const allItems = await getAllItems(); // indexdb.jsから提供される想定

  const dayOfWeekMapping = ['日', '月', '火', '水', '木', '金', '土'];
  const stats = {
    totalRecords: records.length,
    totalForgottenItems: 0,
    byItem: {},
    byCategory: {},
    byDayOfWeek: { '月': 0, '火': 0, '水': 0, '木': 0, '金': 0, '土': 0, '日': 0 },
    byDate: {}
  };

  if (records.length === 0) {
    return stats;
  }

  const itemsMap = new Map(allItems.map(item => [item.id, item]));

  for (const record of records) {
    // タイムゾーンを考慮し、日付文字列に'T00:00:00'を追加して解釈させる
    const date = new Date(record.date + 'T00:00:00');
    const dayOfWeek = dayOfWeekMapping[date.getDay()];
    const dateString = record.date;

    const forgottenCountForDate = record.forgottenItems.length;
    stats.totalForgottenItems += forgottenCountForDate;
    stats.byDate[dateString] = (stats.byDate[dateString] || 0) + forgottenCountForDate;
    stats.byDayOfWeek[dayOfWeek] = (stats.byDayOfWeek[dayOfWeek] || 0) + forgottenCountForDate;

    for (const itemId of record.forgottenItems) {
      const item = itemsMap.get(itemId);
      if (item) {
        // アイテム別集計
        if (!stats.byItem[itemId]) {
          stats.byItem[itemId] = { name: item.name, category: item.category, count: 0 };
        }
        stats.byItem[itemId].count++;

        // カテゴリ別集計
        const categoryName = item.category || '未分類';
        if (!stats.byCategory[categoryName]) {
          stats.byCategory[categoryName] = { count: 0, items: {} };
        }
        stats.byCategory[categoryName].count++;
        if (!stats.byCategory[categoryName].items[itemId]) {
           stats.byCategory[categoryName].items[itemId] = 0;
        }
        stats.byCategory[categoryName].items[itemId]++;
      }
    }
  }

  return stats;
}
