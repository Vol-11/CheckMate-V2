// 今日のアイテム取得
function getTodayItems() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = days[new Date().getDay()];
  return items.filter(i => i.days.includes(today));
}

// 明日のアイテム取得
function getTomorrowItems() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const todayIndex = new Date().getDay();
  const tomorrowIndex = (todayIndex + 1) % 7; // 土曜の次は日曜になる
  const tomorrow = days[tomorrowIndex];
  return items.filter(i => i.days.includes(tomorrow));
}