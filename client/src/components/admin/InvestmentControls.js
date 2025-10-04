import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatCurrency, formatNumber } from '../../utils/format';

const MAX_ADJUSTMENT = 100000; // Maximum adjustment amount

const InvestmentControls = ({ investment, onUpdate }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState('add'); // 'add' or 'subtract'
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            toast.error('Please enter a valid positive amount');
            return;
        }
        if (parsed > MAX_ADJUSTMENT) {
            toast.error(`Amount exceeds maximum allowed adjustment (${formatCurrency(MAX_ADJUSTMENT)})`);
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        setConfirmOpen(false);
        const adjustmentAmount = action === 'add' ? 
            parseFloat(amount) : 
            -parseFloat(amount);

        try {
            const response = await axios.post('/api/mirror-investment/adjust-gain', {
                investmentId: investment._id,
                amount: adjustmentAmount,
                reason: reason || `${action === 'add' ? 'Added' : 'Subtracted'} by admin`
            });

            toast.success('Investment value adjusted successfully');
            setAmount('');
            setReason('');
            
            if (onUpdate) {
                onUpdate(response.data.investment);
            }

        } catch (err) {
            console.error('Error adjusting investment:', err);
            toast.error(err.response?.data?.message || 'Failed to adjust investment value');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">
                Admin Controls: Adjust Investment Value
            </h3>
            
            <div className="text-sm mb-4">
                <div>Current Value: {formatCurrency(investment.currentValue || investment.amount)}</div>
                <div>Initial Investment: {formatCurrency(investment.amount)}</div>
                <div>Plan: {investment.planName}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap gap-3">
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="px-3 py-2 bg-gray-700 rounded min-w-[120px]"
                    >
                        <option value="add">Add Gain</option>
                        <option value="subtract">Add Loss</option>
                    </select>

                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="px-3 py-2 bg-gray-700 rounded flex-1"
                    />
                </div>

                <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full px-3 py-2 bg-gray-700 rounded"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded w-full ${
                        action === 'add' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                    } text-white font-medium transition-colors`}
                >
                    {loading ? 'Processing...' : `Adjust Investment ${action === 'add' ? 'Gain' : 'Loss'}`}
                </button>
            </form>

            {/* Confirmation Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 w-full max-w-md">
                        <h4 className="text-lg font-semibold mb-4">
                            Confirm Investment Value Adjustment
                        </h4>
                        <p className="mb-4 text-gray-300">
                            Are you sure you want to {action === 'add' ? 'add' : 'subtract'}{' '}
                            <strong>{formatCurrency(amount)}</strong> {action === 'add' ? 'to' : 'from'} this investment's value?
                        </p>
                        {reason && (
                            <p className="mb-4 text-sm text-gray-400">
                                Reason: {reason}
                            </p>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded ${
                                    action === 'add'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentControls;