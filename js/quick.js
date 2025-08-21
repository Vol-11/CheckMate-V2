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
    if (!isScanning) document.getElementById('scan-btn').click();
  }, 500);
});

// アイテム追加（共通関数）
async function addNewItem(itemData) {
  if (!itemData.name.trim()) return false;

  if (itemData.code && items.some(i => i.code === itemData.code)) {
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
    item.id = await addItem(item);
    items.push(item);
    return true;
  } catch (err) {
    showStatus('追加に失敗しました: ' + err.message, 'error');
    return false;
  }
}