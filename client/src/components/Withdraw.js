// Update the handleConfirmWithdrawal function in Withdraw.js
import { withdraw } from '../services/api';

const handleConfirmWithdrawal = async () => {
  setIsSubmitting(true);
  
  try {
    const response = await withdraw(
      parseFloat(amount),
      'USDT', // Would be dynamic in real app
      selectedNetwork,
      walletAddress
    );
    
    setTransactionId(response.transactionId);
    setStep(3);
  } catch (error) {
    console.error('Withdrawal error:', error);
    // Show error to user
  } finally {
    setIsSubmitting(false);
  }
};