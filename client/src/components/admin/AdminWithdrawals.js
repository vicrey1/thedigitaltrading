// Add to AdminWithdrawals.js
const handleBulkUpdate = async (ids, status) => {
  try {
    // In a real app: await bulkUpdateWithdrawals(ids, { status });
    setWithdrawals(withdrawals.map(w => 
      ids.includes(w.id) ? { ...w, status, processedAt: new Date() } : w
    ));
  } catch (error) {
    console.error('Bulk update failed:', error);
  }
};

// Pass to WithdrawalList
<WithdrawalList 
  // ... other props
  onBulkUpdate={handleBulkUpdate}
/>