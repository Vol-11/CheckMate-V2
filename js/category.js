// カテゴリーアイコン取得
function getCategoryIcon(category) {
  const icons = {
    '教材': '📚', '文房具': '✏️', '体育用品': '⚽', '弁当・水筒': '🍱',
    '制服・服装': '👔', '楽器': '🎵', '部活用品': '🏃', 'その他': '📦'
  };
  return icons[category] || '📦';
}