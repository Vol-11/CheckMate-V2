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
  li.className = `flex items-center justify-between p-3 border-2 rounded-lg transition-all duration-200 ${
    item.checked 
      ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-500' 
      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
  }`;
  li.dataset.id = item.id;

  // --- Main clickable area (checkbox + info) ---
  const clickableArea = document.createElement('div');
  clickableArea.className = 'flex-grow flex items-center cursor-pointer';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600';
  checkbox.checked = !!item.checked;
  
  const info = document.createElement('div');
  info.className = 'flex-1 ml-3'; // Add margin left to space from checkbox

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

  clickableArea.appendChild(checkbox);
  clickableArea.appendChild(info);
  li.appendChild(clickableArea);

  // --- Action buttons ---
  if (!isQuick) {
    const actions = document.createElement('div');
    actions.className = 'flex-shrink-0 flex gap-2 ml-3'; // flex-shrink-0 prevents shrinking

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors duration-200';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent li click event
      openEditModal(item);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.className = 'px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent li click event
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
  
  // --- Event Listeners ---
  const handleCheck = async () => {
    item.checked = checkbox.checked;
    await updateItem(item);
    updateStats();
    updateCheckDisplay();
    if (!isQuick) renderItems();
    if (isQuick) renderTodayChecklist() || renderTomorrowChecklist();

    if (checkbox.checked && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  checkbox.addEventListener('change', handleCheck);

  clickableArea.addEventListener('click', (e) => {
    // Only toggle if the click is not on the checkbox itself
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      handleCheck();
    }
  });

  return li;
}

// アイテム一覧表示
function renderItems() {
  const list = document.getElementById('items-list');
  const title = document.getElementById('items-title');

  let filtered = items;

  if (currentCategory !== 'all') {
    filtered = filtered.filter(i => i.category === currentCategory);
  }

  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(searchTerm) ||
      i.category.toLowerCase().includes(searchTerm) ||
      (i.code && i.code.toLowerCase().includes(searchTerm)) ||
      (i.memo && i.memo.toLowerCase().includes(searchTerm))
    );
  }

  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'priority') {
      const priorities = { '必須': 3, '重要': 2, '普通': 1 };
      return priorities[b.priority] - priorities[a.priority];
    }
    if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  title.textContent = `${getCategoryIcon(currentCategory)} ${currentCategory === 'all' ? '全アイテム' : currentCategory} (${filtered.length}件)`;

  if (filtered.length === 0) {
    list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-8">該当するアイテムがありません</li>';
    return;
  }

  list.innerHTML = '';
  filtered.forEach(item => {
    const li = createItemElement(item, false);
    list.appendChild(li);
  });
}

// カテゴリフィルターボタン表示
function renderCategoryFilterButtons() {
  const tabs = document.getElementById('category-tabs');
  if (!tabs) return;

  // 「全て」ボタン以外の既存のボタンを削除
  const existingButtons = tabs.querySelectorAll('.category-btn:not([data-category="all"])');
  existingButtons.forEach(btn => btn.remove());

  // グローバル変数からボタンを生成
  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-btn px-3 py-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full text-sm font-medium transition-all duration-200';
    button.dataset.category = category.name;
    
    const icon = getCategoryIcon(category.name);
    // ボタンのテキストが長くなりすぎないように調整
    const shortName = category.name.length > 3 ? category.name.substring(0, 3) : category.name;
    button.innerHTML = `${icon} ${shortName}`;
    button.title = category.name; // フルネームはツールチップで表示

    tabs.appendChild(button);
  });
}