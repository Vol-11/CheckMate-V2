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

    if (target === 'quick') {
      updateStats();
      renderTodayChecklist();
    } else if (target === 'items') {
      renderItems();
    } else if (target === 'check') {
      if (!currentDay) selectCurrentDay();
      updateCheckDisplay();
    } else if (target === 'settings') {
      updateDetailedStats();
    }
  });
});