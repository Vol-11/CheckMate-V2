async function getForgottenItemStats() {
  const records = await getAllForgottenRecords();
  if (records.length === 0) {
    return { counts: {}, total: 0 };
  }

  const allForgottenItemIds = records.flatMap(r => r.forgottenItems);
  const forgottenCounts = allForgottenItemIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return { counts: forgottenCounts, total: allForgottenItemIds.length };
}
