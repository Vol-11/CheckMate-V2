// 統計更新
function updateStats() {
  const total = items.length;
  const checked = items.filter(i => i.checked).length;
  const today = getTodayItems().length;

  document.getElementById('total-items').textContent = total;
  document.getElementById('checked-items').textContent = checked;
  document.getElementById('today-items').textContent = today;
}

function updateDetailedStats() {
  const total = items.length;
  const categories = [...new Set(items.map(i => i.category))].length;
  const barcodes = items.filter(i => i.code).length;
  const checked = items.filter(i => i.checked).length;
  const completion = total > 0 ? Math.round((checked / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-categories').textContent = categories;
  document.getElementById('stat-barcodes').textContent = barcodes;
  document.getElementById('stat-completion').textContent = completion + '%';
}