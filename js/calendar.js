let calendarDate = new Date();
let selectedDate = null;

// DOM要素
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const checklistContainer = document.getElementById('date-specific-checklist-container');
const selectedDateDisplay = document.getElementById('selected-date-display');
const dateSpecificChecklist = document.getElementById('date-specific-checklist');
const specialItemNameInput = document.getElementById('special-item-name');
const addSpecialItemBtn = document.getElementById('add-special-item-btn');

// 日付をYYYY-MM-DD形式の文字列に変換 (タイムゾーン問題を修正)
function toDateString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// カレンダーの描画
async function renderCalendar() {
    calendarDate.setDate(1); // 月の初日に設定
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();

    calendarMonthYear.textContent = `${year}年 ${month + 1}月`;
    calendarGrid.innerHTML = '';

    // 曜日のヘッダーを追加
    const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
    dayHeaders.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'font-bold text-xs text-gray-600 dark:text-gray-400';
        dayEl.textContent = day;
        calendarGrid.appendChild(dayEl);
    });

    const firstDayOfMonth = calendarDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 月の開始曜日まで空白セルを埋める
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    // 日付セルを生成
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('button');
        const date = new Date(year, month, i);
        const dateStr = toDateString(date);

        dayEl.textContent = i;
        dayEl.dataset.date = dateStr;
        dayEl.className = 'p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200';

        const today = new Date();
        if (dateStr === toDateString(today)) {
            dayEl.classList.add('bg-blue-600', 'text-white', 'font-bold');
        }
        if (dateStr === selectedDate) {
            dayEl.classList.add('ring-2', 'ring-blue-500');
        }
        calendarGrid.appendChild(dayEl);
    }
}

// 特定の日付のチェックリストを描画
async function renderDateSpecificChecklist(dateStr) {
    selectedDate = dateStr;
    selectedDateDisplay.textContent = dateStr;
    checklistContainer.classList.remove('hidden');

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

    // 曜日に基づく通常のアイテムを取得
    const regularItems = items.filter(item => item.days.includes(dayOfWeek));
    const override = await getOverride(dateStr) || { added: [], removed: [] };

    dateSpecificChecklist.innerHTML = '';

    // 通常アイテムを描画
    regularItems.forEach(item => {
        const isRemoved = override.removed.includes(item.id);
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-2 rounded-lg ${isRemoved ? 'bg-red-100 dark:bg-red-900/50 opacity-50' : 'bg-gray-50 dark:bg-gray-700'}`;
        li.innerHTML = `
            <span>${getCategoryIcon(item.category)} ${item.name}</span>
            <button data-item-id="${item.id}" class="toggle-remove-btn px-2 py-1 text-xs rounded ${isRemoved ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
                ${isRemoved ? '✅ 戻す' : '❌ この日は不要'}
            </button>
        `;
        dateSpecificChecklist.appendChild(li);
    });

    // 特別なアイテムを描画
    override.added.forEach(specialItem => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/50';
        li.innerHTML = `
            <span>✨ ${specialItem.name}</span>
            <button data-special-id="${specialItem.id}" class="delete-special-btn px-2 py-1 text-xs rounded bg-red-500 text-white">🗑️ 削除</button>
        `;
        dateSpecificChecklist.appendChild(li);
    });

    if (regularItems.length === 0 && override.added.length === 0) {
        dateSpecificChecklist.innerHTML = '<li class="text-center text-gray-500 dark:text-gray-400 py-4">この日のアイテムはありません。</li>';
    }
}

// イベントリスナー
function initializeCalendar() {
    let isCalendarFirstLoad = true; // 初回読み込みフラグ

    prevMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    calendarGrid.addEventListener('click', e => {
        if (e.target.dataset.date) {
            const dateStr = e.target.dataset.date;
            renderDateSpecificChecklist(dateStr);
            renderCalendar(); // 選択状態を更新するため再描画
        }
    });

    // 特別なアイテムを追加
    addSpecialItemBtn.addEventListener('click', async () => {
        const name = specialItemNameInput.value.trim();
        if (!name || !selectedDate) return;

        const override = await getOverride(selectedDate) || { date: selectedDate, added: [], removed: [] };
        override.added.push({ id: Date.now(), name: name });
        await saveOverride(override);
        specialItemNameInput.value = '';
        renderDateSpecificChecklist(selectedDate);
    });

    // アイテムの除外/復帰、特別なアイテムの削除
    dateSpecificChecklist.addEventListener('click', async e => {
        const override = await getOverride(selectedDate) || { date: selectedDate, added: [], removed: [] };

        if (e.target.classList.contains('toggle-remove-btn')) {
            const itemId = parseInt(e.target.dataset.itemId);
            if (override.removed.includes(itemId)) {
                override.removed = override.removed.filter(id => id !== itemId);
            } else {
                override.removed.push(itemId);
            }
        } else if (e.target.classList.contains('delete-special-btn')) {
            const specialId = parseInt(e.target.dataset.specialId);
            override.added = override.added.filter(item => item.id !== specialId);
        }

        await saveOverride(override);
        renderDateSpecificChecklist(selectedDate);
    });

    document.addEventListener('tabChanged', e => {
        if (e.detail.tab === 'calendar') {
            // 初回表示時に今日の日付のリストを表示
            if (isCalendarFirstLoad) {
                const todayStr = toDateString(new Date());
                renderDateSpecificChecklist(todayStr);
                isCalendarFirstLoad = false;
            }
            renderCalendar();
        }
    });
}

initializeCalendar();
