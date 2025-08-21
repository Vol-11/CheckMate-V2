// チェック状況表示の統一化
function updateCheckDisplay() {
  if (!currentDay) return;
  renderChecklist(currentDay);
  renderScanChecklist(currentDay);
}

// 手動チェックリスト表示
function renderChecklist(day) {
  const list = document.getElementById('checklist');
  const progress = document.getElementById('check-progress');

  const filtered = items.filter(i => i.days.includes(day));

  if (filtered.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">' + day + '曜日のアイテムはありません</li>';
    progress.innerHTML = '';
    return;
  }

  const checkedCount = filtered.filter(i => i.checked).length;
  const totalCount = filtered.length;
  const percentage = Math.round((checkedCount / totalCount) * 100);

  progress.innerHTML = `
    <div class="${checkedCount === totalCount ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}">
      ${day}曜日: ${checkedCount}/${totalCount} 完了 (${percentage}%) ${checkedCount === totalCount ? '🎉' : ''}
    </div>
  `;

  list.innerHTML = '';

  filtered.sort((a, b) => {
    const priorities = { '必須': 3, '重要': 2, '普通': 1 };
    return priorities[b.priority] - priorities[a.priority];
  });

  filtered.forEach(item => {
    const li = createItemElement(item, true);
    if (item.priority === '必須') {
      li.style.borderColor = '#dc2626';
      li.classList.add('ring-2', 'ring-red-200', 'dark:ring-red-800');
    } else if (item.priority === '重要') {
      li.style.borderColor = '#eab308';
      li.classList.add('ring-2', 'ring-yellow-200', 'dark:ring-yellow-800');
    }
    list.appendChild(li);
  });
}

// スキャンモード用チェックリスト表示
function renderScanChecklist(day) {
  const list = document.getElementById('scan-checklist');
  const progress = document.getElementById('scan-check-progress');

  const filtered = items.filter(i => i.days.includes(day));

  if (filtered.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">' + day + '曜日のアイテムはありません</li>';
    progress.innerHTML = '';
    return;
  }

  const checkedCount = filtered.filter(i => i.checked).length;
  const totalCount = filtered.length;
  const percentage = Math.round((checkedCount / totalCount) * 100);

  progress.innerHTML = `
    <div class="${checkedCount === totalCount ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}">
      ${day}曜日: ${checkedCount}/${totalCount} 完了 (${percentage}%) ${checkedCount === totalCount ? '🎉' : ''}
    </div>
  `;

  list.innerHTML = '';

  filtered.sort((a, b) => {
    const priorities = { '必須': 3, '重要': 2, '普通': 1 };
    return priorities[b.priority] - priorities[a.priority];
  });

  filtered.forEach(item => {
    const li = createItemElement(item, true);
    if (item.priority === '必須') {
      li.style.borderColor = '#dc2626';
      li.classList.add('ring-2', 'ring-red-200', 'dark:ring-red-800');
    } else if (item.priority === '重要') {
      li.style.borderColor = '#eab308';
      li.classList.add('ring-2', 'ring-yellow-200', 'dark:ring-yellow-800');
    }
    list.appendChild(li);
  });
}

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

// 明日のチェックリスト表示
function renderTomorrowChecklist() {
    const tomorrowItems = getTomorrowItems();
    const list = document.getElementById('tomorrow-checklist');

    if (tomorrowItems.length === 0) {
        list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">明日の予定はありません</li>';
        return;
    }

    list.innerHTML = '';
    tomorrowItems.forEach(item => {
        const li = createItemElement(item, true);
        list.appendChild(li);
    });
}