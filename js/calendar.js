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
        const todayStr = toDateString(today);

        // 今日の日付にはボーダーをつける (リングのギザギザ対策)
        if (dateStr === todayStr) {
            dayEl.classList.add('border-2', 'border-solid', 'border-blue-500');
        }

        // 選択されている日付には青い背景をつける
        if (dateStr === selectedDate) {
            dayEl.classList.add('bg-blue-600', 'text-white', 'font-bold');
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
        const barcode = document.getElementById('special-item-barcode').value.trim();

        if (!name) {
            showStatus('アイテム名を入力してください', 'warning');
            specialItemNameInput.focus();
            return;
        }

        if (!selectedDate) {
            showStatus('日付を選択してください', 'warning');
            return;
        }

        await processSpecialItemRegistration(barcode, name);
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
        await renderDateSpecificChecklist(selectedDate);
        await updateStats(); // ヘッダーの統計を更新
    });

    document.addEventListener('tabChanged', e => {
        if (e.detail.tab === 'calendar') {
            // 初回表示時に明日の日付のリストを表示
            if (isCalendarFirstLoad) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = toDateString(tomorrow);
                renderDateSpecificChecklist(tomorrowStr);
                isCalendarFirstLoad = false;
            }
            renderCalendar();
        }
    });
}
// カレンダー用バーコードスキャン機能
let isCalendarScanning = false;
let calendarAnimationFrameId;
let calendarSelectedDeviceId = undefined;

// DOM要素
const calendarScanBtn = document.getElementById('calendar-scan-btn');
const calendarStopBtn = document.getElementById('calendar-stop-btn');
const calendarVideo = document.getElementById('calendar-video');
const calendarCanvas = document.getElementById('calendar-canvas');
const calendarStatusMessage = document.getElementById('calendar-status');
const specialItemBarcodeInput = document.getElementById('special-item-barcode');

// 🔥 削除：存在しない要素への参照を削除
// const addSpecialBarcodeBtn = document.getElementById('add-special-barcode-btn');

// 🔥 削除：存在しないクラスへの処理を削除
// document.querySelectorAll('.calendar-scan-mode-btn').forEach(btn => {
//     // この部分は削除
// });

// 🔥 削除：存在しない要素のイベントリスナー削除
// addSpecialBarcodeBtn.addEventListener('click', async () => {
//     // この部分は削除
// });

// Enterキーでの登録（修正版）
if (specialItemBarcodeInput) {
    specialItemBarcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            // バーコード入力後はAddボタンをクリック
            if (addSpecialItemBtn) {
                addSpecialItemBtn.click();
            }
        }
    });
}

const specialItemNameInputElement = document.getElementById('special-item-name');
if (specialItemNameInputElement) {
    specialItemNameInputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (addSpecialItemBtn) {
                addSpecialItemBtn.click();
            }
        }
    });
}

async function processSpecialItemRegistration(barcode, itemName) {
    if (!selectedDate) {
        showStatus('日付を選択してください', 'warning');
        return false;
    }

    if (!itemName || !itemName.trim()) {
        showStatus('アイテム名を入力してください', 'warning');
        document.getElementById('special-item-name').focus();
        return false;
    }

    const trimmedName = itemName.trim();
    const override = await getOverride(selectedDate) || { date: selectedDate, added: [], removed: [] };

    // 既に同じバーコードが追加されているかチェック
    const alreadyAdded = override.added.find(item => item.code === barcode);
    if (alreadyAdded) {
        showStatus('このバーコードは既に追加されています', 'warning');
        return false;
    }

    // 同じ名前のアイテムがないかチェック
    const sameNameItem = override.added.find(item => item.name === trimmedName);
    if (sameNameItem) {
        showStatus('同じ名前のアイテムは既に追加されています', 'warning');
        return false;
    }

    override.added.push({
        id: Date.now(),
        name: trimmedName,
        code: barcode || '',
        checked: false
    });

    await saveOverride(override);
    await renderDateSpecificChecklist(selectedDate);
    await updateStats();

    // 入力フィールドをクリア
    document.getElementById('special-item-name').value = '';
    document.getElementById('special-item-barcode').value = '';

    showStatus(`✅ 「${trimmedName}」を${selectedDate}に追加しました`, 'success');
    return true;
}

// バーコード付き特別アイテムの追加
async function addSpecialItemWithBarcode(barcode) {
    if (!selectedDate) {
        showStatus('📅 カレンダーから日付を選択してください', 'warning');
        return;
    }

    // バーコードを入力フィールドに設定
    document.getElementById('special-item-barcode').value = barcode;

    // 既存アイテムに同じバーコードがあるかチェック
    const existingItem = items.find(i => i.code === barcode);

    if (existingItem) {
        // 既存アイテムの場合、名前を自動入力
        document.getElementById('special-item-name').value = existingItem.name;
        showStatus(`✅ 既存アイテム「${existingItem.name}」が入力されました`, 'success');
        // 自動で登録を実行
        await processSpecialItemRegistration(barcode, existingItem.name);
    } else {
        // 新しいアイテムの場合、名前入力を促す
        document.getElementById('special-item-name').value = '';
        document.getElementById('special-item-name').focus();
        showStatus('📝 アイテム名を入力して「追加」ボタンを押してください', 'info');

        // 手動登録セクションまでスムーズスクロール
        setTimeout(() => {
            document.getElementById('special-item-name').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
}

// カレンダー用スキャン検出
function onCalendarDetected(result) {
    const code = result.getText();
    if (!code) return;

    calendarStatusMessage.textContent = `📖 検出: ${code}`;
    calendarStatusMessage.className = 'p-2 rounded-lg mb-3 text-center text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';

    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);

    stopCalendarScanning();
    addSpecialItemWithBarcode(code);

    setTimeout(() => {
        calendarStatusMessage.textContent = '📷 バーコードをスキャンして登録';
        calendarStatusMessage.className = 'p-2 rounded-lg mb-3 text-center text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
    }, 3000);
}

// カレンダー用スキャン開始
async function startCalendarScanning() {
    if (isCalendarScanning) return;
    isCalendarScanning = true;
    calendarScanBtn.disabled = true;
    calendarStopBtn.disabled = false;
    calendarStatusMessage.textContent = '🎥 カメラを起動中...';

    try {
        const constraints = {
            video: {
                width: { ideal: 818 },        // 他と同じに変更
                height: { ideal: 460 },       // 他と同じに変更
                deviceId: calendarSelectedDeviceId ? { exact: calendarSelectedDeviceId } : undefined,
                facingMode: !calendarSelectedDeviceId ? 'environment' : undefined
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        calendarVideo.srcObject = stream;
        await calendarVideo.play();
        calendarStatusMessage.textContent = '📷 スキャン中...';
        calendarAnimationFrameId = requestAnimationFrame(calendarScanLoop);
    } catch (err) {
        console.error('startCalendarScanning error:', err);
        calendarStatusMessage.textContent = `❌ カメラの起動に失敗: ${err.message}`;
        isCalendarScanning = false;
        calendarScanBtn.disabled = false;
        calendarStopBtn.disabled = true;
    }
}

// カレンダー用スキャンループ
function calendarScanLoop() {
    if (!isCalendarScanning) return;

    if (calendarVideo.readyState === calendarVideo.HAVE_ENOUGH_DATA) {
        calendarCanvas.height = calendarVideo.videoHeight;
        calendarCanvas.width = calendarVideo.videoWidth;
        const ctx = calendarCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(calendarVideo, 0, 0, calendarCanvas.width, calendarCanvas.height);

        // グレースケール変換
        const imageData = ctx.getImageData(0, 0, calendarCanvas.width, calendarCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);

        try {
            // 修正：calendarCanvas と onCalendarDetected を使用
            const result = window.codeReader.decodeFromCanvas(calendarCanvas);
            if (result) {
                onCalendarDetected(result);
            }
        } catch (err) {
            if (!(err instanceof ZXing.NotFoundException) &&
                !err.message?.includes('No MultiFormat Readers were able to detect the code') &&
                !err.message?.includes('NotFoundException')) {
                console.error('Calendar scan error:', err);
            }
            // バーコードが見つからないエラーは無視（正常動作）
        }
    }
    calendarAnimationFrameId = requestAnimationFrame(calendarScanLoop);
}

// カレンダー用スキャン停止
function stopCalendarScanning() {
    if (calendarAnimationFrameId) {
        cancelAnimationFrame(calendarAnimationFrameId);
        calendarAnimationFrameId = null;
    }
    if (calendarVideo.srcObject) {
        calendarVideo.srcObject.getTracks().forEach(track => track.stop());
        calendarVideo.srcObject = null;
    }
    isCalendarScanning = false;
    calendarStatusMessage.textContent = '📷 バーコードをスキャンして登録';
    calendarScanBtn.disabled = false;
    calendarStopBtn.disabled = true;
}

// イベントリスナー（安全な登録）
if (calendarScanBtn) {
    calendarScanBtn.addEventListener('click', startCalendarScanning);
}else(alert("calendarScanBtn is null"));

if (calendarStopBtn) {
    calendarStopBtn.addEventListener('click', stopCalendarScanning);
}else(alert("calendarStopBtn is null"));

// クリーンアップ
window.addEventListener('beforeunload', () => {
    if (isCalendarScanning) stopCalendarScanning();
});

initializeCalendar();
