// 今日のチェックリスト表示
function renderTodayChecklist() {
  const todayItems = getTodayItems();
  const list = document.getElementById('today-checklist');

  if (todayItems.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">今日の予定はありません</li>';
    return;
  }

  list.innerHTML = '';
  todayItems.forEach(item => {
    const li = createItemElement(item, true);
    list.appendChild(li);
  });
}

// 明日のチェックリスト表示（Coming Soon）
