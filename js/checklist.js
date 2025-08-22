// チェック状況表示の統一化
async function updateCheckDisplay() {
  if (!currentDay) return;
  const forgottenStats = await getForgottenItemStats();
  renderChecklist(currentDay, forgottenStats);
  renderScanChecklist(currentDay, forgottenStats);
}

// 手動チェックリスト表示
function renderChecklist(day, forgottenStats) {
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
    // ★修正点: forgottenStatsを渡す
    const li = createItemElement(item, true, forgottenStats);
    list.appendChild(li);
  });
}

// スキャンモード用チェックリスト表示
function renderScanChecklist(day, forgottenStats) {
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
    // ★修正点: forgottenStatsを渡す
    const li = createItemElement(item, true, forgottenStats);
    list.appendChild(li);
  });
}

// チェックリスト機能
function selectCurrentDay() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = days[new Date().getDay()];
  currentDay = today;

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
    if (btn.dataset.day === today) {
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
    }
  });

  updateCheckDisplay();
}

// 手動モード チェックリスト操作
document.getElementById('check-all').addEventListener('click', async () => {
  await performCheckAll();
});

document.getElementById('uncheck-all').addEventListener('click', async () => {
  await performUncheckAll();
});

document.getElementById('reset-check').addEventListener('click', async () => {
  await performResetCheck();
});

// スキャンモード チェックリスト操作
document.getElementById('scan-check-all').addEventListener('click', async () => {
  await performCheckAll();
});

document.getElementById('scan-uncheck-all').addEventListener('click', async () => {
  await performUncheckAll();
});

document.getElementById('scan-reset-check').addEventListener('click', async () => {
  await performResetCheck();
});

// 共通チェック操作関数
async function performCheckAll() {
  const dayItems = items.filter(i => i.days.includes(currentDay));
  for (const item of dayItems) {
    if (!item.checked) {
      item.checked = true;
      await updateItem(item);
    }
  }
  updateCheckDisplay();
  updateStats();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
}

async function performUncheckAll() {
  const dayItems = items.filter(i => i.days.includes(currentDay));
  for (const item of dayItems) {
    if (item.checked) {
      item.checked = false;
      await updateItem(item);
    }
  }
  updateCheckDisplay();
  updateStats();
}

async function performResetCheck() {
  if (confirm('全てのアイテムのチェック状態をリセットしますか？')) {
    for (const item of items) {
      item.checked = false;
      await updateItem(item);
    }
    renderItems();
    updateCheckDisplay();
    updateStats();
    scanResults.clear();
    renderScanResults();
    showStatus('🔄 チェック状態をリセットしました', 'success');
  }
}


