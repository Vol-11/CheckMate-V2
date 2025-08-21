// 今日のアイテム取得
function getTodayItems() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = days[new Date().getDay()];
  return items.filter(i => i.days.includes(today));
}

// 明日のアイテム取得
function getTomorrowItems() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const todayIndex = new Date().getDay();
  const tomorrowIndex = (todayIndex + 1) % 7; // 土曜の次は日曜になる
  const tomorrow = days[tomorrowIndex];
  return items.filter(i => i.days.includes(tomorrow));
}

// アイテム要素作成
function createItemElement(item, isQuick = false) {
  const li = document.createElement('li');
  li.className = `flex items-center p-3 border-2 rounded-lg transition-all duration-200 ${
    item.checked 
      ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-500' 
      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
  }`;
  li.dataset.id = item.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600';
  checkbox.checked = !!item.checked;
  checkbox.addEventListener('change', async () => {
    item.checked = checkbox.checked;
    await updateItem(item);
    updateStats();
    updateCheckDisplay();
    if (!isQuick) renderItems();
    if (isQuick) renderTodayChecklist() || renderTomorrowChecklist();

    if (checkbox.checked && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  });

  const info = document.createElement('div');
  info.className = 'flex-1';

  let priorityIcon = '';
  if (item.priority === '重要') priorityIcon = '⭐ ';
  else if (item.priority === '必須') priorityIcon = '‼️ ';

  let categoryIcon = getCategoryIcon(item.category);

  info.innerHTML = `
    <div class="font-semibold text-gray-900 dark:text-gray-100">${priorityIcon}${item.name}</div>
    <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
      <span class="text-gray-700 dark:text-gray-300 font-medium">${categoryIcon} ${item.category}</span>
      ${item.code ? `<span class="text-blue-600 dark:text-blue-400"> • ${item.code}</span>` : ''}
      ${item.days.length > 0 ? `<span class="text-green-600 dark:text-green-400"> • ${item.days.join(', ')}</span>` : ''}
      ${item.memo ? `<br><small class="text-gray-500 dark:text-gray-400">${item.memo}</small>` : ''}
    </div>
  `;

  if (!isQuick) {
    const actions = document.createElement('div');
    actions.className = 'flex gap-2 ml-3';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors duration-200';
    editBtn.addEventListener('click', () => openEditModal(item));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.className = 'px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`「${item.name}」を削除しますか？`)) {
        await deleteItem(item.id);
        items = items.filter(i => i.id !== item.id);
        renderItems();
        updateStats();
        updateCheckDisplay();
        showStatus('🗑 削除しました', 'success');
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);
  }

  li.appendChild(checkbox);
  li.appendChild(info);

  return li;
}