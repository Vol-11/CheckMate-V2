// PWAインストール
let deferredPrompt;
const installBtn = document.getElementById('install-pwa');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) {
    showStatus('このブラウザではPWAインストールがサポートされていません', 'warning');
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    installBtn.classList.add('hidden');
    showStatus('📱 PWAがインストールされました', 'success');
  }

  deferredPrompt = null;
});
