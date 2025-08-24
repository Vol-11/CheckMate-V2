let checklistDate = new Date(); // 現在のチェックリストの日付

// 日付から曜日を取得する関数を追加
function getDayOfWeek(date) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
}

// currentDayを更新する関数を追加（グローバルのcurrentDayを使用）
function updateCurrentDay() {
    // グローバルのcurrentDay変数を更新
    if (typeof window !== 'undefined') {
        window.currentDay = getDayOfWeek(checklistDate);
    }
}

// チェック状況表示の統一化
async function updateCheckDisplay() {
    if (!checklistDate) return;

    // currentDayを更新
    updateCurrentDay();

    const forgottenStats = await getForgottenItemStats();
    const allItemsForDate = await getItemsForDate(checklistDate);

    renderChecklist(allItemsForDate, forgottenStats);
    renderScanChecklist(allItemsForDate, forgottenStats);
}

// 手動チェックリスト表示
function renderChecklist(allItems, forgottenStats) {
    const list = document.getElementById('checklist');
    const progress = document.getElementById('check-progress');
    const dateString = toDateString(checklistDate);

    if (allItems.length === 0) {
        list.innerHTML = `<li class="text-center text-gray-500 dark:text-gray-400 py-8">${dateString} のアイテムはありません</li>`;
        progress.innerHTML = '';
        return;
    }

    const checkedCount = allItems.filter(i => i.checked).length;
    const totalCount = allItems.length;
    const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    progress.innerHTML = `
    <div class="${checkedCount === totalCount ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}">
      ${dateString}: ${checkedCount}/${totalCount} 完了 (${percentage}%) ${checkedCount === totalCount ? '🎉' : ''}
    </div>
  `;

    list.innerHTML = '';

    // 通常アイテムを優先度でソート
    const sortedItems = allItems.sort((a, b) => {
        if (a.isSpecial && !b.isSpecial) return 1;
        if (!a.isSpecial && b.isSpecial) return -1;
        if (a.isSpecial && b.isSpecial) return 0;
        const priorities = { '必須': 3, '重要': 2, '普通': 1 };
        return priorities[b.priority] - priorities[a.priority];
    });

    sortedItems.forEach(item => {
        let li;
        if (item.isSpecial) {
            li = document.createElement('li');
            li.className = 'flex items-center p-3 rounded-lg bg-yellow-100 dark:bg-yellow-800/50';
            li.innerHTML = `
                <label class="flex items-center w-full cursor-pointer">
                    <input type="checkbox" data-special-id="${item.id}" ${item.checked ? 'checked' : ''} class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-600 border-gray-400 special-item-checkbox">
                    <span class="ml-4 font-medium text-gray-900 dark:text-gray-100">✨ ${item.name}</span>
                </label>
            `;
        } else {
            li = createItemElement(item, true, forgottenStats);
        }
        list.appendChild(li);
    });
}

// スキャンモード用チェックリスト表示
function renderScanChecklist(allItems, forgottenStats) {
    const list = document.getElementById('scan-checklist');
    const progress = document.getElementById('scan-check-progress');
    const dateString = toDateString(checklistDate);

    if (allItems.length === 0) {
        list.innerHTML = `<li class="text-center text-gray-500 dark:text-gray-400 py-8">${dateString} のアイテムはありません</li>`;
        progress.innerHTML = '';
        return;
    }

    const checkedCount = allItems.filter(i => i.checked).length;
    const totalCount = allItems.length;
    const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

    progress.innerHTML = `
    <div class="${checkedCount === totalCount ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}">
      ${dateString}: ${checkedCount}/${totalCount} 完了 (${percentage}%) ${checkedCount === totalCount ? '🎉' : ''}
    </div>
  `;

    list.innerHTML = '';
    
    const sortedItems = allItems.sort((a, b) => {
        if (a.isSpecial && !b.isSpecial) return 1;
        if (!a.isSpecial && b.isSpecial) return -1;
        if (a.isSpecial && b.isSpecial) return 0;
        const priorities = { '必須': 3, '重要': 2, '普通': 1 };
        return priorities[b.priority] - priorities[a.priority];
    });

    sortedItems.forEach(item => {
        let li;
        if (item.isSpecial) {
            li = document.createElement('li');
            li.className = 'flex items-center p-3 rounded-lg bg-yellow-100 dark:bg-yellow-800/50';
            li.innerHTML = `
                <label class="flex items-center w-full cursor-pointer">
                    <input type="checkbox" data-special-id="${item.id}" ${item.checked ? 'checked' : ''} class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-600 border-gray-400 special-item-checkbox">
                    <span class="ml-4 font-medium text-gray-900 dark:text-gray-100">✨ ${item.name}</span>
                </label>
            `;
        } else {
            li = createItemElement(item, true, forgottenStats);
        }
        list.appendChild(li);
    });
}

// チェックリストの初期化
function initializeChecklist() {
    const datePicker = document.getElementById('check-date-picker');

    // デフォルトを明日に設定
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    checklistDate = tomorrow;
    updateCurrentDay(); // currentDayを初期化
    datePicker.value = toDateString(tomorrow);

    // 日付ピッカーのイベントリスナー
    datePicker.addEventListener('change', () => {
        const [year, month, day] = datePicker.value.split('-').map(Number);
        checklistDate = new Date(year, month - 1, day);
        updateCurrentDay(); // currentDayを更新
        updateCheckDisplay();
    });

    // 特別なアイテムのチェック処理
    const handleSpecialItemCheck = async (e) => {
        if (e.target.classList.contains('special-item-checkbox')) {
            const specialId = parseInt(e.target.dataset.specialId);
            const isChecked = e.target.checked;
            const dateString = toDateString(checklistDate);
            
            const override = await getOverride(dateString) || { added: [], removed: [] };
            const itemIndex = override.added.findIndex(item => item.id === specialId);
            if (itemIndex > -1) {
                override.added[itemIndex].checked = isChecked;
                await saveOverride(override);
                await updateCheckDisplay();
                await updateStats();
            }
        }
    };
    document.getElementById('checklist').addEventListener('change', handleSpecialItemCheck);
    document.getElementById('scan-checklist').addEventListener('change', handleSpecialItemCheck);
}


// 手動モード チェックリスト操作
document.getElementById('check-all').addEventListener('click', async () => {
  await performCheckAll(true);
});

document.getElementById('uncheck-all').addEventListener('click', async () => {
  await performCheckAll(false);
});

document.getElementById('reset-check').addEventListener('click', async () => {
  if (confirm('表示されている日の全てのアイテムのチェック状態をリセットしますか？')) {
    await performCheckAll(false); // uncheck all is a form of reset
    showStatus('🔄 チェック状態をリセットしました', 'success');
  }
});

// スキャンモード チェックリスト操作
document.getElementById('scan-check-all').addEventListener('click', async () => {
  await performCheckAll(true);
});

document.getElementById('scan-uncheck-all').addEventListener('click', async () => {
  await performCheckAll(false);
});

document.getElementById('scan-reset-check').addEventListener('click', async () => {
  if (confirm('表示されている日の全てのアイテムのチェック状態をリセットしますか？')) {
    await performCheckAll(false);
    showStatus('🔄 チェック状態をリセットしました', 'success');
  }
});

// 共通チェック操作関数
async function performCheckAll(checkState) {
    const dateString = toDateString(checklistDate);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][checklistDate.getDay()];
    const override = await getOverride(dateString) || { date: dateString, added: [], removed: [] };

    // 通常アイテムの更新
    const regularItems = items.filter(item => item.days.includes(dayOfWeek) && !override.removed.includes(item.id));
    for (const item of regularItems) {
        if (item.checked !== checkState) {
            item.checked = checkState;
            await updateItem(item);
        }
    }

    // 特別アイテムの更新
    let overrideChanged = false;
    if (!override.added) override.added = [];
    override.added.forEach(item => {
        if (item.checked !== checkState) {
            item.checked = checkState;
            overrideChanged = true;
        }
    });

    if (overrideChanged) {
        await saveOverride(override);
    }

    await updateCheckDisplay();
    await updateStats();
    if (checkState && navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
}



// `tab.js`から呼び出されるための処理
document.addEventListener('tabChanged', e => {
    if (e.detail.tab === 'check') {
        updateCheckDisplay();
    }
});