// utils/csvExporter.js
const { Transform } = require('stream');
const { stringify } = require('csv-stringify');

exports.createCsvStream = () => {
  // Define CSV headers
  const headers = [
    'Withdrawal ID',
    'User ID',
    'User Email',
    'Amount',
    'Currency',
    'Network',
    'Wallet Address',
    'Status',
    'Created At',
    'Processed At',
    'Admin Notes'
  ];

  // Create stringifier with headers
  const stringifier = stringify({ header: true, columns: headers });

  // Create transform stream to format data
  return new Transform({
    objectMode: true,
    transform(withdrawal, encoding, callback) {
      const row = [
        withdrawal._id,
        withdrawal.userId,
        withdrawal.user?.email || '',
        withdrawal.amount,
        withdrawal.currency,
        withdrawal.network,
        withdrawal.walletAddress,
        withdrawal.status,
        withdrawal.createdAt.toISOString(),
        withdrawal.processedAt?.toISOString() || '',
        withdrawal.adminNotes || ''
      ];
      this.push(row);
      callback();
    }
  }).pipe(stringifier);
};