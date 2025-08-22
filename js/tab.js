// タブ切り替え
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

    const event = new CustomEvent('tabChanged', { detail: { tab: target } });
    document.dispatchEvent(event);

    if (target === 'items') {
      renderItems();
    } else if (target === 'settings') {
      updateDetailedStats();
    }
  });
});

// カテゴリータブ
document.getElementById('category-tabs').addEventListener('click', e => {
  if (e.target.classList.contains('category-btn')) {
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
    });
    e.target.classList.add('bg-blue-600', 'text-white');
    e.target.classList.remove('text-blue-600', 'dark:text-blue-400', 'bg-white', 'dark:bg-gray-800', 'hover:bg-blue-50', 'dark:hover:bg-gray-700');
    currentCategory = e.target.dataset.category;
    renderItems();
  }
});
