// ステータス表示
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status-msg') || status;
  statusEl.textContent = message;

  statusEl.className = 'mt-4 text-center font-semibold rounded-lg p-3 transition-colors duration-200';
  if (type === 'success') {
    statusEl.className += ' bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
  } else if (type === 'warning') {
    statusEl.className += ' bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700';
  } else if (type === 'error') {
    statusEl.className += ' bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
  } else {
    statusEl.className += ' bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700';
  }

  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'mt-4 text-center font-semibold';
  }, 3000);
}