// DOM要素のキャッシュ
const recordTabBtn = document.getElementById('forgotten-record-tab-btn');
const historyTabBtn = document.getElementById('forgotten-history-tab-btn');
const recordModeDiv = document.getElementById('forgotten-record-mode');
const historyModeDiv = document.getElementById('forgotten-history-mode');
const saveBtn = document.getElementById('save-today-forgotten');
const todayChecklist = document.getElementById('today-forgotten-checklist');
const forgottenListEl = document.getElementById('forgotten-list');

function switchForgottenMode(mode) {
  if (mode === 'record') {
    recordModeDiv.classList.remove('hidden');
    historyModeDiv.classList.add('hidden');
    recordTabBtn.classList.add('bg-blue-600', 'text-white');
    recordTabBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
    historyTabBtn.classList.remove('bg-blue-600', 'text-white');
    historyTabBtn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
    renderForgottenRecordingMode();
  } else {
    recordModeDiv.classList.add('hidden');
    historyModeDiv.classList.remove('hidden');
    historyTabBtn.classList.add('bg-blue-600', 'text-white');
    historyTabBtn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
    recordTabBtn.classList.remove('bg-blue-600', 'text-white');
    recordTabBtn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
    renderForgottenHistoryMode();
  }
}

function renderForgottenRecordingMode() {
  const todayItems = getTodayItems();
  if (todayItems.length === 0) {
    todayChecklist.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">今日の予定アイテムはありません</li>';
    return;
  }
  todayChecklist.innerHTML = '';
  todayItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'flex items-center p-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200 hover:border-blue-500';
    li.innerHTML = `
      <label class="flex items-center w-full cursor-pointer">
        <input type="checkbox" data-id="${item.id}" class="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 dark:bg-gray-600 border-gray-400">
        <span class="ml-4 text-gray-900 dark:text-gray-100 font-medium">${item.name}</span>
      </label>
    `;
    todayChecklist.appendChild(li);
  });
}

async function saveTodayForgottenItems() {
  const checkboxes = document.querySelectorAll('#today-forgotten-checklist input[type=checkbox]:checked');
  const forgottenItemIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
  if (forgottenItemIds.length === 0) {
    showStatus('忘れ物を1つ以上選択してください。', 'info');
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const record = { date: today, forgottenItems: forgottenItemIds };
  try {
    await addForgottenRecord(record);
    showUndoToast(`💾 ${forgottenItemIds.length}件の忘れ物を記録しました`, async () => {
      await deleteForgottenRecord(today);
      showStatus('操作を取り消しました', 'info');
      await renderItems();
      await updateCheckDisplay();
      renderForgottenHistoryMode();
    });
    switchForgottenMode('history');
  } catch (err) {
    console.error('Failed to save forgotten items:', err);
    showStatus(`❌ 記録に失敗しました: ${err.message}`, 'error');
  }
}

async function renderForgottenHistoryMode() {
  const forgottenStatsEl = document.getElementById('forgotten-stats');
  const records = await getAllForgottenRecords();
  if (records.length === 0) {
    forgottenStatsEl.innerHTML = '';
    forgottenListEl.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-8">まだ忘れ物の記録はありません。</div>';
    return;
  }
  const allForgottenItemIds = records.flatMap(r => r.forgottenItems);
  const forgottenCounts = allForgottenItemIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const mostForgottenItems = Object.entries(forgottenCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ item: items.find(i => i.id === parseInt(id)), count }));
  let statsHtml = '<ul class="space-y-2">';
if (mostForgottenItems.length > 0) {
  mostForgottenItems.forEach(({ item, count }) => {
    if (item) {
      statsHtml += `
        <li class="flex justify-between items-center bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
          <span class="font-medium">${getCategoryIcon(item.category)} ${item.name}</span>
          <span class="font-bold text-orange-600 dark:text-orange-400 text-lg">${count}回</span>
        </li>
      `;
    }
  });
} else {
  statsHtml += '<li class="text-gray-500 dark:text-gray-400">統計データがありません</li>';
}
  statsHtml += '</ul>';
  forgottenStatsEl.innerHTML = statsHtml;
  let listHtml = '<ul class="space-y-4">';
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  records.forEach(record => {
    listHtml += `
      <li class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
        <details>
          <summary class="flex justify-between items-center font-semibold cursor-pointer text-lg">
            <span>📅 ${record.date} (${record.forgottenItems.length}件)</span>
            <button class="delete-record-btn p-1 text-xl text-red-500 hover:text-red-700" data-date="${record.date}" title="この日の記録を削除">🗑️</button>
          </summary>
          <ul class="mt-3 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
    `;
    record.forgottenItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        listHtml += `
          <li class="flex items-center text-base">
            <span class="mr-3">${getCategoryIcon(item.category)}</span>
            <span>${item.name}</span>
          </li>
        `;
      } else {
        listHtml += `<li class="flex items-center text-gray-500">削除されたアイテム (ID: ${itemId})</li>`;
      }
    });
    listHtml += '</ul></details></li>';
  });
  listHtml += '</ul>';
  forgottenListEl.innerHTML = listHtml;
}

function showUndoToast(message, onUndo) {
    const statusMsg = document.getElementById('status-msg');
    if (!statusMsg) return;
    statusMsg.className = 'p-3 rounded-lg text-center font-medium border bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 flex justify-between items-center';
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    const undoButton = document.createElement('button');
    undoButton.textContent = '元に戻す';
    undoButton.className = 'ml-4 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm';
    statusMsg.innerHTML = '';
    statusMsg.appendChild(messageSpan);
    statusMsg.appendChild(undoButton);
    statusMsg.style.opacity = '1';
    statusMsg.style.transform = 'translateY(0)';
    const timeoutId = setTimeout(() => {
        statusMsg.style.opacity = '0';
        statusMsg.style.transform = 'translateY(-10px)';
    }, 7000);
    undoButton.addEventListener('click', () => {
        clearTimeout(timeoutId);
        onUndo();
        statusMsg.style.opacity = '0';
        statusMsg.style.transform = 'translateY(-10px)';
    }, { once: true });
}

function initializeForgottenTab() {
  recordTabBtn.addEventListener('click', () => switchForgottenMode('record'));
  historyTabBtn.addEventListener('click', () => switchForgottenMode('history'));
  saveBtn.addEventListener('click', saveTodayForgottenItems);
  forgottenListEl.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-record-btn')) {
      const date = e.target.closest('.delete-record-btn').dataset.date;
      if (confirm(`${date} の忘れ物記録を削除しますか？`)) {
        await deleteForgottenRecord(date);
        showStatus('記録を削除しました', 'success');
        await renderItems();
        await updateCheckDisplay();
        renderForgottenHistoryMode();
      }
    }
  });
  document.getElementById('delete-old-forgotten-btn').addEventListener('click', async () => {
    if (confirm('1ヶ月以上前の忘れ物履歴をすべて削除しますか？\nこの操作は元に戻せません。')) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      await deleteForgottenRecordsBefore(oneMonthAgo);
      showStatus('古い履歴を削除しました', 'success');
      await renderItems();
      await updateCheckDisplay();
      renderForgottenHistoryMode();
    }
  });
}

document.addEventListener('tabChanged', (e) => {
  if (e.detail.tab === 'forgotten') {
    switchForgottenMode('record');
  }
});

initializeForgottenTab();
