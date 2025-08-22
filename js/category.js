// カテゴリーアイコン取得
function getCategoryIcon(category) {
  const icons = {
    '教材': '📚', '文房具': '✏️', '体育用品': '⚽', '弁当': '🍱',
    '制服・服装': '👔', '部活用品': '🏃', 'その他': '📦'
  };
  return icons[category] || '📦';
}

// カテゴリ選択プルダウンを動的に生成する
function renderCategoryOptions() {
  const selectors = [
    document.getElementById('quick-category'),
    document.getElementById('detail-category'),
    document.getElementById('edit-category')
  ];

  selectors.forEach(selector => {
    if (!selector) return;

    const currentValue = selector.value; // 現在の選択値を保持
    selector.innerHTML = ''; // 中身をクリア

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = `${getCategoryIcon(category.name)} ${category.name}`;
      selector.appendChild(option);
    });

    // 可能な限り元の選択値を復元
    if (currentValue && categories.some(c => c.name === currentValue)) {
      selector.value = currentValue;
    }
  });
}

// 設定タブにカテゴリ管理リストを描画する
function renderCategoryManagementList() {
  const listEl = document.getElementById('category-management-list');
  if (!listEl) return;

  listEl.innerHTML = ''; // リストをクリア

  if (!categories || categories.length === 0) {
    listEl.innerHTML = `<li class="text-center text-gray-500 dark:text-gray-400 py-3">登録済みのカテゴリはありません</li>`;
    return;
  }

  categories.forEach(category => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
    li.innerHTML = `
      <span class="font-medium text-gray-800 dark:text-gray-200">${getCategoryIcon(category.name)} ${category.name}</span>
      <button class="delete-category-btn px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200" data-id="${category.id}" data-name="${category.name}">削除</button>
    `;
    listEl.appendChild(li);
  });
}

// カテゴリ追加処理
document.getElementById('add-category-btn').addEventListener('click', async () => {
  const input = document.getElementById('new-category-name');
  const newName = input.value.trim();

  if (!newName) {
    showStatus('カテゴリ名を入力してください', 'warning');
    return;
  }

  if (categories.some(c => c.name === newName)) {
    showStatus('同じ名前のカテゴリが既に存在します', 'warning');
    return;
  }

  try {
    const newCategory = { id: new Date().getTime(), name: newName };
    await addCategory(newCategory);
    categories.push(newCategory); // グローバル変数を更新
    
    renderCategoryManagementList(); // 管理リストを再描画
    renderCategoryOptions(); // 全てのプルダウンを再描画
    renderCategoryFilterButtons(); // フィルターボタンを再描画

    input.value = '';
    showStatus(`カテゴリ「${newName}」を追加しました`, 'success');
  } catch (err) {
    showStatus('カテゴリの追加に失敗しました: ' + err.message, 'error');
  }
});

// カテゴリ削除処理 (イベントデリゲーション)
document.getElementById('category-management-list').addEventListener('click', async (e) => {
  if (!e.target.classList.contains('delete-category-btn')) return;

  const button = e.target;
  const categoryId = Number(button.dataset.id);
  const categoryName = button.dataset.name;

  // このカテゴリを使用しているアイテムがないかチェック
  const isCategoryInUse = items.some(item => item.category === categoryName);

  if (isCategoryInUse) {
    alert(`「${categoryName}」は現在使用中のため削除できません。
このカテゴリに属する全てのアイテムのカテゴリを変更してから、再度お試しください。`);
    return;
  }

  if (confirm(`本当にカテゴリ「${categoryName}」を削除しますか？`)) {
    try {
      await deleteCategory(categoryId);
      categories = categories.filter(c => c.id !== categoryId); // グローバル変数を更新
      
      renderCategoryManagementList(); // 管理リストを再描画
      renderCategoryOptions(); // 全てのプルダウンを再描画
      renderCategoryFilterButtons(); // フィルターボタンを再描画

      showStatus(`カテゴリ「${categoryName}」を削除しました`, 'success');
    } catch (err) {
      showStatus('カテゴリの削除に失敗しました: ' + err.message, 'error');
    }
  }
});

