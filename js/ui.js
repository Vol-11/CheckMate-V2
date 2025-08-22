const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const status = document.getElementById('status');
const checkStatus = document.getElementById('check-status');

// 編集モーダル
function openEditModal(item) {
  editingItem = item;
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
  editingItem = null;
}

document.getElementById('save-edit').addEventListener('click', async () => {
  if (!editingItem) return;

  const name = document.getElementById('edit-name').value.trim();
  if (!name) {
    showStatus('アイテム名を入力してください', 'warning');
    return;
  }

  const days = Array.from(document.querySelectorAll('#edit-days input[type=checkbox]:checked'))
                   .map(cb => cb.value);

  editingItem.name = name;
  editingItem.category = document.getElementById('edit-category').value;
  editingItem.priority = document.getElementById('edit-priority').value;
  editingItem.code = document.getElementById('edit-code').value.trim();
  editingItem.memo = document.getElementById('edit-memo').value.trim();
  editingItem.days = days;
  editingItem.updatedAt = new Date().toISOString();

  try {
    await updateItem(editingItem);
    renderItems();
    updateCheckDisplay();
    updateStats();
    closeEditModal();
    showStatus('✅ 更新しました', 'success');
  } catch (err) {
    showStatus('更新に失敗しました: ' + err.message, 'error');
  }
});

// モーダル外クリックで閉じる
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target.id === 'edit-modal') {
    closeEditModal();
  }
});
