import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Statements() {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    // LUXYIELD logo: 'LUX' in bold gold, 'YIELD' in bold black, joined together
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    // Draw 'LUX' in gold, then 'HEDGE' in black, joined
    doc.setTextColor('#FFD700'); // Gold
    doc.text('LUX', 15, 22, { baseline: 'top' });
    doc.setTextColor('#000000'); // Black
    doc.text('HEDGE', 15 + doc.getTextWidth('LUX'), 22, { baseline: 'top' });
    doc.setTextColor('#000000'); // Reset to black
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Account Statement', 15, 35);
    doc.setFontSize(12);
    doc.text('Download Your Statements', 15, 45);
    doc.text('These statements summarize your deposits, withdrawals, investments, and ROI for demo purposes.', 15, 52, { maxWidth: 180 });
    autoTable(doc, {
      startY: 60,
      head: [['Type', 'Details']],
      body: [
        ['Deposit', '$10,000 on 07/01/2025'],
        ['Investment', '$5,000 in Gold Plan on 07/02/2025'],
        ['ROI Credited', '$500 on 07/10/2025'],
        ['Withdrawal', '$1,000 on 07/12/2025'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] }, // Gold
      styles: { fontSize: 11 }
    });
    doc.setFontSize(10);
    doc.setTextColor('#888888');
    doc.text('Disclaimer: All statements and activity on this platform are simulated for demonstration purposes only and do not represent real financial products or advice.', 15, doc.lastAutoTable.finalY + 15, { maxWidth: 180 });
    doc.save('LUXYIELD_Statement.pdf');
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gold">Account Statements</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Download Your Statements</h2>
        <p className="mb-2">You can download your simulated account statements for any period. These statements summarize your deposits, withdrawals, investments, and ROI for demo purposes.</p>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-bold">Recent Activity</h3>
        <ul className="list-disc ml-6 text-gray-300">
          <li>Deposit: $10,000 on 07/01/2025</li>
          <li>Investment: $5,000 in Gold Plan on 07/02/2025</li>
          <li>ROI Credited: $500 on 07/10/2025</li>
          <li>Withdrawal: $1,000 on 07/12/2025</li>
        </ul>
      </div>
      <div className="mb-4">
        <button className="px-6 py-2 bg-gold text-black rounded-lg hover:bg-yellow-600 transition font-bold" onClick={handleDownloadPDF}>Download PDF</button>
      </div>
      <div className="mt-8 text-gray-400 text-sm">
        <p><b>Disclaimer:</b> All statements and activity on this platform are simulated for demonstration purposes only and do not represent real financial products or advice.</p>
      </div>
    </div>
  );
}
