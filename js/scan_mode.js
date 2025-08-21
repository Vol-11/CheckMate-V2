// スキャンモード切り替え
document.querySelectorAll('.scan-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.scan-mode-btn').forEach(b => {
      b.classList.remove('bg-blue-600', 'text-white');
      b.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');
    });
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600');

    checkMode = btn.dataset.mode;

    if (checkMode === 'manual') {
      document.getElementById('manual-check-mode').classList.remove('hidden');
      document.getElementById('scan-check-mode').classList.add('hidden');
      if (isCheckScanning) stopCheckScanning();
    } else {
      document.getElementById('manual-check-mode').classList.add('hidden');
      document.getElementById('scan-check-mode').classList.remove('hidden');
      updateCheckDisplay();
    }
  });
});