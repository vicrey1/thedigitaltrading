import React, { useState } from 'react';
import { X, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react';
import { getStoredToken } from '../utils/authToken';

const FeePaymentModal = ({ 
  isOpen, 
  onClose, 
  feeType, 
  feeAmount, 
  feeReason, 
  onPaymentSuccess,
  feeData
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto');

  console.log('FeePaymentModal props:', { isOpen, feeType, feeAmount, feeData });

  if (!isOpen) return null;

  const getFeeTitle = () => {
    switch (feeType) {
      case 'activation':
        return 'Activation Fee Required';
      case 'taxClearance':
        return 'Tax Clearance Fee Required';
      case 'network':
        return 'Network Processing Fee Required';
      default:
        return 'Fee Payment Required';
    }
  };

  const getFeeDescription = () => {
    switch (feeType) {
      case 'activation':
        return 'Your profit has exceeded the margin threshold. An activation fee is required to proceed with the withdrawal.';
      case 'taxClearance':
        return 'A tax clearance fee is required before funds can be moved to your available balance.';
      case 'network':
        return 'A network processing fee is required to complete your withdrawal transaction.';
      default:
        return feeReason || 'A fee payment is required to proceed.';
    }
  };

  const handlePayment = async () => {
    console.log('Starting fee payment process...', { feeType, withdrawalId: feeData?.withdrawalId });
    setIsProcessing(true);
    
    try {
      if (!feeData?.withdrawalId) {
        throw new Error('Withdrawal ID is required');
      }

      console.log('Paying network fee for withdrawal:', feeData.withdrawalId);
      
      // Make API request to pay network fee
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'}/api/withdrawal/${feeData.withdrawalId}/pay-network-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Network fee payment failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Payment successful:', data);
      
      // Call the success callback
      if (onPaymentSuccess) {
        onPaymentSuccess(data);
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      // Set error state or show error message to user
      alert(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
    try {
      let response;
      
      // Handle withdrawal network fee payment
      if (feeType === 'network' && feeData?.withdrawalId) {
        const { payNetworkFee } = require('../services/withdrawalAPI');
        console.log('Paying network fee for withdrawal:', feeData.withdrawalId);
        response = await payNetworkFee(feeData.withdrawalId);
        console.log('Network fee payment response:', response);

        if (response.success) {
          onPaymentSuccess && onPaymentSuccess({
            ...response,
            withdrawalId: feeData.withdrawalId,
            status: 'pending' // Change to pending after fee payment
          });
          onClose();
          return;
        } else {
          throw new Error(response.msg || 'Failed to process network fee');
        }
      } else {
        const token = getStoredToken();
        const endpoint = `/api/fees/pay-${feeType === 'taxClearance' ? 'tax-clearance' : feeType}`;
        const fetchResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            transactionId
          })
        });
        response = await fetchResponse.json();
      }

      const data = await response.json();

      if (response.ok) {
        if (feeType === 'network') {
          onPaymentSuccess && onPaymentSuccess({
            ...data,
            withdrawalId: feeData?.withdrawalId,
            status: 'processing'
          });
        } else {
          onPaymentSuccess && onPaymentSuccess(data);
        }
        onClose();
      } else {
        alert(data.msg || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">{getFeeTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Fee Information */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">Fee Required</h3>
                <p className="text-orange-700 text-sm mb-3">
                  {getFeeDescription()}
                </p>
                <div className="bg-white rounded-md p-3 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Fee Amount:</span>
                    <span className="text-xl font-bold text-orange-600">
                      ${feeAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="crypto"
                  checked={paymentMethod === 'crypto'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600"
                />
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Cryptocurrency Payment</span>
              </label>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Payment Instructions</h4>
            <div className="text-blue-700 text-sm space-y-2">
              <p>1. Send exactly <strong>${feeAmount?.toFixed(2)}</strong> to the following wallet address:</p>
              <div className="bg-white p-3 rounded-md border border-blue-200 my-2 break-all font-mono text-sm">
                {feeData?.walletAddress || '0x1234567890AbCdEf1234567890aBcDeF12345678'}
                <button 
                  onClick={() => navigator.clipboard.writeText(feeData?.walletAddress || '0x1234567890AbCdEf1234567890aBcDeF12345678')}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                >
                  Copy
                </button>
              </div>
              <p>2. Copy the transaction ID from your wallet</p>
              <p>3. Paste the transaction ID below and click "Confirm Payment"</p>
              <p>4. Your payment will be verified and processed within 24 hours</p>
            </div>
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter your transaction ID here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to verify your payment
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || !transactionId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeePaymentModal;