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
  const tomorrowIndex = (todayIndex + 1) % 7;
  const tomorrow = days[tomorrowIndex];
  return items.filter(i => i.days.includes(tomorrow));
}

// アイテム要素作成
function createItemElement(item, isQuick = false, forgottenStats = { counts: {}, total: 0 }) {
  const li = document.createElement('li');
  const forgotten_count = forgottenStats.counts[item.id] || 0;

  // Base classes
  li.className = `item-element flex items-center justify-between p-3 border-2 rounded-lg transition-all duration-200`;
  li.dataset.id = item.id;

  // Checked state classes
  if (item.checked) {
    li.classList.add('bg-gradient-to-r', 'from-green-50', 'to-green-100', 'dark:from-green-900/30', 'dark:to-green-800/30', 'border-green-500');
  } else {
    li.classList.add('bg-white', 'dark:bg-gray-700', 'border-gray-300', 'dark:border-gray-600', 'hover:border-blue-400', 'dark:hover:border-blue-500');
  }

  // Forgotten item highlighting
  if (forgotten_count > 0) {
    li.classList.add('is-forgotten');
    if (forgotten_count >= 3) {
        li.classList.add('is-forgotten-frequently', 'border-orange-400', 'dark:border-orange-500', 'ring-2', 'ring-orange-200', 'dark:ring-orange-800/50');
    } else {
        li.classList.add('border-yellow-400', 'dark:border-yellow-500');
    }
  }

  // --- Main clickable area (checkbox + info) ---
  const clickableArea = document.createElement('div');
  clickableArea.className = 'flex-grow flex items-center cursor-pointer';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600';
  checkbox.checked = !!item.checked;
  
  const info = document.createElement('div');
  info.className = 'flex-1 ml-3';

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
  
  // BUG FIX: Append warning icon AFTER info div is created and populated
  if (forgotten_count > 0) {
    const forgottenBadge = document.createElement('span');
    forgottenBadge.className = 'forgotten-badge ml-2 px-2 py-0.5 rounded-full text-xs font-semibold';
    if (forgotten_count >= 3) {
        forgottenBadge.classList.add('bg-orange-500', 'text-white');
        forgottenBadge.textContent = `忘れやすい (${forgotten_count}回)`;
    } else {
        forgottenBadge.classList.add('bg-yellow-400', 'text-gray-800');
        forgottenBadge.textContent = `忘れ物あり (${forgotten_count}回)`;
    }
    // Append to the first line (the one with the name)
    info.querySelector('.font-semibold').appendChild(forgottenBadge);
  }

  clickableArea.appendChild(checkbox);
  clickableArea.appendChild(info);
  li.appendChild(clickableArea);

  // --- Action buttons ---
  if (!isQuick) {
    const actions = document.createElement('div');
    actions.className = 'flex-shrink-0 flex gap-2 ml-3';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.className = 'px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors duration-200';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(item);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.className = 'px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-200';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
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
    updateCheckDisplay(); // This will re-render the checklist with new stats
    if (!isQuick) renderItems(); // This will re-render the item list
    if (isQuick) {
        renderTodayChecklist();
        renderTomorrowChecklist();
    }

    if (checkbox.checked && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  checkbox.addEventListener('change', handleCheck);

  clickableArea.addEventListener('click', (e) => {
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      handleCheck();
    }
  });

  return li;
}

// アイテム一覧表示
async function renderItems() {
  const list = document.getElementById('items-list');
  const title = document.getElementById('items-title');
  const forgottenStats = await getForgottenItemStats();

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
    const li = createItemElement(item, false, forgottenStats);
    list.appendChild(li);
  });
}

// カテゴリフィルターボタン表示
function renderCategoryFilterButtons() {
  const tabs = document.getElementById('category-tabs');
  if (!tabs) return;

  const existingButtons = tabs.querySelectorAll('.category-btn:not([data-category="all"])');
  existingButtons.forEach(btn => btn.remove());

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-btn px-3 py-1 border-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full text-sm font-medium transition-all duration-200';
    button.dataset.category = category.name;
    
    const icon = getCategoryIcon(category.name);
    const shortName = category.name.length > 3 ? category.name.substring(0, 3) : category.name;
    button.innerHTML = `${icon} ${shortName}`;
    button.title = category.name;

    tabs.appendChild(button);
  });
}

// アイテム追加
async function addNewItem(itemData) {
  const now = new Date().toISOString();
  const newItem = {
    name: itemData.name,
    category: itemData.category,
    priority: itemData.priority || '普通',
    code: itemData.code || '',
    memo: itemData.memo || '',
    days: itemData.days || [],
    checked: false,
    createdAt: now,
    updatedAt: now
  };

  try {
    const newId = await addItem(newItem);
    newItem.id = newId;
    items.push(newItem);
    return true;
  } catch (err) {
    console.error('Failed to add item:', err);
    showStatus(`❌ 登録に失敗しました: ${err.message}`, 'error');
    return false;
  }
}

// ステータスメッセージ表示
function showStatus(message, type = 'info') {
  const statusMsg = document.getElementById('status-msg');
  if (!statusMsg) return;

  let bgColor, textColor, borderColor;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 dark:bg-green-900/30';
      textColor = 'text-green-700 dark:text-green-300';
      borderColor = 'border-green-300 dark:border-green-700';
      break;
    case 'error':
      bgColor = 'bg-red-100 dark:bg-red-900/30';
      textColor = 'text-red-700 dark:text-red-300';
      borderColor = 'border-red-300 dark:border-red-700';
      break;
    case 'warning':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
      textColor = 'text-yellow-700 dark:text-yellow-300';
      borderColor = 'border-yellow-300 dark:border-yellow-700';
      break;
    default: // info
      bgColor = 'bg-blue-100 dark:bg-blue-900/30';
      textColor = 'text-blue-700 dark:text-blue-300';
      borderColor = 'border-blue-300 dark:border-blue-700';
  }

  statusMsg.className = `p-3 rounded-lg text-center font-medium border ${bgColor} ${textColor} ${borderColor}`;
  statusMsg.textContent = message;
  statusMsg.style.opacity = '1';
  statusMsg.style.transform = 'translateY(0)';

  setTimeout(() => {
    statusMsg.style.opacity = '0';
    statusMsg.style.transform = 'translateY(-10px)';
  }, 3000);
}
