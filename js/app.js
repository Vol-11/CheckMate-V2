// メインアプリケーション
(function() {
  'use strict';

  // グローバル状態
  window.appState = {
    items: [],
    currentDay: null,
    currentCategory: 'all',
    sortBy: 'name',
    isScanning: false,
    isCheckScanning: false,
    editingItem: null,
    checkMode: 'manual',
    scanResults: new Map()
  };

  // 統計更新
  function updateStats() {
    const total = window.appState.items.length;
    const checked = window.appState.items.filter(i => i.checked).length;
    const today = getTodayItems().length;

    document.getElementById('total-items').textContent = total;
    document.getElementById('checked-items').textContent = checked;
    document.getElementById('today-items').textContent = today;
  }

  function updateDetailedStats() {
    const total = window.appState.items.length;
    const categories = [...new Set(window.appState.items.map(i => i.category))].length;
    const barcodes = window.appState.items.filter(i => i.code).length;
    const checked = window.appState.items.filter(i => i.checked).length;
    const completion = total > 0 ? Math.round((checked / total) * 100) : 0;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-categories').textContent = categories;
    document.getElementById('stat-barcodes').textContent = barcodes;
    document.getElementById('stat-completion').textContent = completion + '%';
  }

  // 今日のアイテム取得
  function getTodayItems() {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const today = days[new Date().getDay()];
    return window.appState.items.filter(i => i.days.includes(today));
  }

  // カテゴリーアイコン取得
  function getCategoryIcon(category) {
    const icons = {
      '教材': '📚', '文房具': '✏️', '体育用品': '⚽', '弁当・水筒': '🍱',
      '制服・服装': '👔', '楽器': '🎵', '部活用品': '🏃', 'その他': '📦'
    };
    return icons[category] || '📦';
  }

  // ステータス表示
  function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-msg') || document.getElementById('status');
    if (!statusEl) return;

    statusEl.textContent = message;

    statusEl.className = 'mt-4 text-center font-semibold rounded-lg p-3 transition-colors duration-200';
    if (type === 'success') {
      statusEl.className += ' bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
    } else if (type === 'warning') {
      statusEl.className += ' bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
    } else if (type === 'error') {
      statusEl.className += ' bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
    } else {
      statusEl.className += ' bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
    }

    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'mt-4 text-center font-semibold';
    }, 3000);
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
      await window.dbManager.updateItem(item);
      updateStats();
      updateCheckDisplay();
      if (!isQuick) renderItems();
      if (isQuick) renderTodayChecklist();

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
          await window.dbManager.deleteItem(item.id);
          window.appState.items = window.appState.items.filter(i => i.id !== item.id);
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

  // チェックリスト表示
  function renderChecklist(day) {
    const list = document.getElementById('checklist');
    const progress = document.getElementById('check-progress');

    const filtered = window.appState.items.filter(i => i.days.includes(day));

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

    const filtered = window.appState.items.filter(i => i.days.includes(day));

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

  // チェック状況表示の統一化
  function updateCheckDisplay() {
    if (!window.appState.currentDay) return;
    renderChecklist(window.appState.currentDay);
    renderScanChecklist(window.appState.currentDay);
  }

  // スキャン結果表示
  function renderScanResults() {
    const list = document.getElementById('scan-results');

    if (window.appState.scanResults.size === 0) {
      list.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-4">スキャン結果なし</li>';
      return;
    }

    list.innerHTML = '';

    const sortedResults = Array.from(window.appState.scanResults.entries())
      .sort(([,a], [,b]) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedResults.forEach(([code, result]) => {
      const li = document.createElement('li');
      li.className = 'flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-300 dark:border-blue-600 rounded-lg animate-pulse-soft';

      const time = result.timestamp.toLocaleTimeString();
      const statusIcon = result.status === 'checked' ? '✅' : '❌';

      li.innerHTML = `
        <div class="flex items-center w-full">
          <div class="mr-3 text-xl">${statusIcon}</div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900 dark:text-gray-100">${result.item ? result.item.name : '未登録アイテム'}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              ${code} • ${time}
            </div>
          </div>
        </div>
      `;

      list.appendChild(li);
    });
  }

  // アイテム一覧表示
  function renderItems() {
    const list = document.getElementById('items-list');
    const title = document.getElementById('items-title');

    let filtered = window.appState.items;

    if (window.appState.currentCategory !== 'all') {
      filtered = filtered.filter(i => i.category === window.appState.currentCategory);
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
      if (window.appState.sortBy === 'name') return a.name.localeCompare(b.name);
      if (window.appState.sortBy === 'category') return a.category.localeCompare(b.category);
      if (window.appState.sortBy === 'priority') {
        const priorities = { '必須': 3, '重要': 2, '普通': 1 };
        return priorities[b.priority] - priorities[a.priority];
      }
      if (window.appState.sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    title.textContent = `${getCategoryIcon(window.appState.currentCategory)} ${window.appState.currentCategory === 'all' ? '全アイテム' : window.appState.currentCategory} (${filtered.length}件)`;

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

  // アイテム追加（共通関数）
  async function addNewItem(itemData) {
    if (!itemData.name.trim()) return false;

    if (itemData.code && window.appState.items.some(i => i.code === itemData.code)) {
      showStatus('同じバーコードのアイテムが既に登録されています', 'warning');
      return false;
    }

    const item = {
      name: itemData.name.trim(),
      category: itemData.category || 'その他',
      priority: itemData.priority || '普通',
      code: itemData.code ? itemData.code.trim() : '',
      memo: itemData.memo ? itemData.memo.trim() : '',
      days: itemData.days || [],
      checked: false,
      createdAt: new Date().toISOString()
    };

    try {
      item.id = await window.dbManager.addItem(item);
      window.appState.items.push(item);
      return true;
    } catch (err) {
      showStatus('追加に失敗しました: ' + err.message, 'error');
      return false;
    }
  }

  // 編集モーダル
  function openEditModal(item) {
    window.appState.editingItem = item;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-category').value = item.category;
    document.getElementById('edit-priority').value = item.priority;
    document.getElementById('edit-code').value = item.code || '';
    document.getElementById('edit-memo').value = item.memo || '';

    document.querySelectorAll('#edit-days input[type=checkbox]').forEach(cb => {
      cb.checked = item.days.includes(cb.value);
    });

    document.getElementById('edit-modal').classList.remove('hidden');
  }

  function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    window.appState.editingItem = null;
  }

  // 曜日選択
  function selectCurrentDay() {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const today = days[new Date().getDay()];
    window.appState.currentDay = today;

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

  // チェック操作関数
  async function performCheckAll() {
    const dayItems = window.appState.items.filter(i => i.days.includes(window.appState.currentDay));
    for (const item of dayItems) {
      if (!item.checked) {
        item.checked = true;
        await window.dbManager.updateItem(item);
      }
    }
    updateCheckDisplay();
    updateStats();
    renderTodayChecklist();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
  }

  async function performUncheckAll() {
    const dayItems = window.appState.items.filter(i => i.days.includes(window.appState.currentDay));
    for (const item of dayItems) {
      if (item.checked) {
        item.checked = false;
        await window.dbManager.updateItem(item);
      }
    }
    updateCheckDisplay();
    updateStats();
    renderTodayChecklist();
  }

  async function performResetCheck() {
    if (confirm('全てのアイテムのチェック状態をリセットしますか？')) {
      for (const item of window.appState.items) {
        item.checked = false;
        await window.dbManager.updateItem(item);
      }
      renderItems();
      updateCheckDisplay();
      renderTodayChecklist();
      updateStats();
      window.appState.scanResults.clear();
      renderScanResults();
      showStatus('🔄 チェック状態をリセットしました', 'success');
    }
  }

  // データ読み込み
  async function loadItems() {
    try {
      window.appState.items = await window.dbManager.getAllItems();
      renderItems();
      renderTodayChecklist();
      updateStats();
    } catch (err) {
      console.error('Load items failed:', err);
    }
  }

  // イベントリスナー設定
  function setupEventListeners() {
    // タブ切り替え
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('bg-blue-600', 'text-white');
          t.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        });
        tab.classList.add('bg-blue-600', 'text-white');
        tab.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');

        const target = tab.dataset.tab;
        tabContents.forEach(tc => {
          tc.classList.toggle('hidden', tc.id !== target);
        });

        if (target === 'quick') {
          updateStats();
          renderTodayChecklist();
        } else if (target === 'items') {
          renderItems();
        } else if (target === 'check') {
          if (!window.appState.currentDay) selectCurrentDay();
          updateCheckDisplay();
        } else if (target === 'settings') {
          updateDetailedStats();
        }
      });
    });

    // スキャンモード切り替え
    document.querySelectorAll('.scan-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.scan-mode-btn').forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
        });
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');

        window.appState.checkMode = btn.dataset.mode;

        if (window.appState.checkMode === 'manual') {
          document.getElementById('manual-check-mode').classList.remove('hidden');
          document.getElementById('scan-check-mode').classList.add('hidden');
          if (window.appState.isCheckScanning) window.scannerManager.stopCheckScanning();
        } else {
          document.getElementById('manual-check-mode').classList.add('hidden');
          document.getElementById('scan-check-mode').classList.remove('hidden');
          updateCheckDisplay();
        }
      });
    });

    // クイック追加
    document.getElementById('quick-add').addEventListener('click', async () => {
      const name = document.getElementById('quick-name').value.trim();
      const category = document.getElementById('quick-category').value;

      if (!name) {
        document.getElementById('quick-name').focus();
        return;
      }

      const days = ['日', '月', '火', '水', '木', '金', '土'];
      const today = days[new Date().getDay()];

      const success = await addNewItem({
        name, category, priority: '普通', days: [today], code: '', memo: ''
      });

      if (success) {
        document.getElementById('quick-name').value = '';
        renderTodayChecklist();
        updateStats();
        showStatus(`✅ 「${name}」を追加しました`, 'success');
      }
    });

    document.getElementById('quick-name').addEventListener('keypress', e => {
      if (e.key === 'Enter') document.getElementById('quick-add').click();
    });

    // クイックスキャン
    document.getElementById('quick-scan').addEventListener('click', () => {
      document.querySelector('[data-tab="scanner"]').click();
      setTimeout(() => {
        if (!window.appState.isScanning) window.scannerManager.startScanning();
      }, 500);
    });

    // 詳細登録
    document.getElementById('add-detail').addEventListener('click', async () => {
      const name = document.getElementById('detail-name').value;
      const category = document.getElementById('detail-category').value;
      const priority = document.getElementById('detail-priority').value;
      const code = document.getElementById('detail-code').value;
      const memo = document.getElementById('detail-memo').value;
      const dayCheckboxes = document.querySelectorAll('#scanner input[type=checkbox]:checked');
      const days = Array.from(dayCheckboxes).map(cb => cb.value);

      if (!name.trim()) {
        document.getElementById('detail-name').focus();
        showStatus('アイテム名を入力してください', 'warning');
        return;
      }

      const success = await addNewItem({ name, category, priority, code, memo, days });
      if (success) {
        document.getElementById('detail-name').value = '';
        document.getElementById('detail-code').value = '';
        document.getElementById('detail-memo').value = '';
        dayCheckboxes.forEach(cb => cb.checked = false);

        updateStats();
        renderItems();
        updateCheckDisplay();
        showStatus(`✅ 「${name}」を登録しました`, 'success');
      }
    });

    // スキャナー制御
    document.getElementById('scan-btn').addEventListener('click', window.scannerManager.startScanning);
    document.getElementById('stop-btn').addEventListener('click', window.scannerManager.stopScanning);
    document.getElementById('check-scan-btn').addEventListener('click', window.scannerManager.startCheckScanning);
    document.getElementById('check-stop-btn').addEventListener('click', window.scannerManager.stopCheckScanning);

    // カテゴリータブ
    document.getElementById('category-tabs').addEventListener('click', e => {
      if (e.target.classList.contains('category-btn')) {
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
        });
        e.target.classList.add('bg-blue-600', 'text-white');
        e.target.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
        window.appState.currentCategory = e.target.dataset.category;
        renderItems();
      }
    });

    // 検索機能
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    searchInput.addEventListener('input', () => {
      renderItems();
      searchClear.classList.toggle('hidden', !searchInput.value);
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.add('hidden');
      renderItems();
    });

    // ソート切り替え
    document.getElementById('sort-toggle').addEventListener('click', () => {
      const sorts = ['name', 'category', 'priority', 'created'];
      const currentIndex = sorts.indexOf(window.appState.sortBy);
      window.appState.sortBy = sorts[(currentIndex + 1) % sorts.length];

      const labels = { name: '名前順', category: 'カテゴリー順', priority: '重要度順', created: '追加日順' };
      document.getElementById('sort-toggle').textContent = `📊 ${labels[window.appState.sortBy]}`;

      renderItems();
    });

    // 曜日選択
    document.getElementById('preset-days').addEventListener('click', e => {
      if (e.target.classList.contains('preset-btn')) {
        window.appState.currentDay = e.target.dataset.day;

        document.querySelectorAll('.preset-btn').forEach(btn => {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
        });
        e.target.classList.add('bg-blue-600', 'text-white');
        e.target.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');

        updateCheckDisplay();
        window.appState.scanResults.clear();
        renderScanResults();
      }
    });

    // チェック操作
    document.getElementById('check-all').addEventListener('click', performCheckAll);
    document.getElementById('uncheck-all').addEventListener('click', performUncheckAll);
    document.getElementById('reset-check').addEventListener('click', performResetCheck);
    document.getElementById('scan-check-all').addEventListener('click', performCheckAll);
    document.getElementById('scan-uncheck-all').addEventListener('click', performUncheckAll);
    document.getElementById('scan-reset-check').addEventListener('click', performResetCheck);

    // 全削除
    document.getElementById('clear-items').addEventListener('click', async () => {
      if (confirm('本当に全てのアイテムを削除しますか？\nこの操作は取り消せません。')) {
        try {
          await window.dbManager.clearItems();
          window.appState.items = [];
          renderItems();
          renderTodayChecklist();
          updateStats();
          document.getElementById('checklist').innerHTML = '';
          document.getElementById('scan-checklist').innerHTML = '';
          window.appState.scanResults.clear();
          renderScanResults();
          showStatus('🗑 全てのアイテムを削除しました', 'success');
        } catch (err) {
          showStatus('削除に失敗しました: ' + err.message, 'error');
        }
      }
    });

    // 編集モーダル
    document.getElementById('save-edit').addEventListener('click', async () => {
      if (!window.appState.editingItem) return;

      const name = document.getElementById('edit-name').value.trim();
      if (!name) {
        showStatus('アイテム名を入力してください', 'warning');
        return;
      }

      const days = Array.from(document.querySelectorAll('#edit-days input[type=checkbox]:checked'))
                       .map(cb => cb.value);

      window.appState.editingItem.name = name;
      window.appState.editingItem.category = document.getElementById('edit-category').value;
      window.appState.editingItem.priority = document.getElementById('edit-priority').value;
      window.appState.editingItem.code = document.getElementById('edit-code').value.trim();
      window.appState.editingItem.memo = document.getElementById('edit-memo').value.trim();
      window.appState.editingItem.days = days;
      window.appState.editingItem.updatedAt = new Date().toISOString();

      try {
        await window.dbManager.updateItem(window.appState.editingItem);
        renderItems();
        updateCheckDisplay();
        renderTodayChecklist();
        updateStats();
        closeEditModal();
        showStatus('✅ 更新しました', 'success');
      } catch (err) {
        showStatus('更新に失敗しました: ' + err.message, 'error');
      }
    });

    // クリーンアップ
    window.addEventListener('beforeunload', () => {
      if (window.appState.isScanning) window.scannerManager.stopScanning();
      if (window.appState.isCheckScanning) window.scannerManager.stopCheckScanning();
    });
  }

  // 初期化
  async function init() {
    await window.dbManager.openDB();
    await loadItems();
    selectCurrentDay();
    setupEventListeners();

    if (window.appState.items.length === 0) {
      setTimeout(() => {
        showStatus('👋 ようこそ！まずは教材や持ち物を追加してみましょう', 'info');
      }, 1000);
    }
  }

  // グローバル関数として公開
  window.updateStats = updateStats;
  window.updateDetailedStats = updateDetailedStats;
  window.updateCheckDisplay = updateCheckDisplay;
  window.renderScanResults = renderScanResults;
  window.renderItems = renderItems;
  window.renderTodayChecklist = renderTodayChecklist;
  window.showStatus = showStatus;
  window.loadItems = loadItems;
  window.closeEditModal = closeEditModal;
  window.openEditModal = openEditModal;

  // DOM読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
