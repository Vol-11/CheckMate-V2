// ソート切り替え
document.getElementById('sort-toggle').addEventListener('click', () => {
  const sorts = ['name', 'category', 'priority', 'created'];
  const currentIndex = sorts.indexOf(sortBy);
  sortBy = sorts[(currentIndex + 1) % sorts.length];

  const labels = { name: '名前順', category: 'カテゴリー順', priority: '重要度順', created: '追加日順' };
  document.getElementById('sort-toggle').textContent = `📊 ${labels[sortBy]}`;

  renderItems();
});