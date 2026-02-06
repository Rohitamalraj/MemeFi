'use client';

import { useCurrentAccount, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useState } from 'react';
import { toast } from 'sonner';

export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
  effects?: any;
  objectChanges?: any[];
}

export function useWalletConnection() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransactionBlock();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeTransaction = async (
    txb: TransactionBlock,
    successMessage?: string
  ): Promise<TransactionResult> => {
    console.log('🔵 executeTransaction called with:', { txb, successMessage });
    
    if (!currentAccount) {
      console.error('❌ No wallet connected');
      toast.error('Please connect your wallet first');
      return { success: false, error: 'No wallet connected' };
    }

    console.log('✅ Wallet connected:', currentAccount.address);
    setIsExecuting(true);

    try {
      console.log('📤 Signing and executing transaction...');
      
      const result = await signAndExecute({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('📥 Transaction result:', result);

      // Check if transaction was successful
      if (result.digest) {
        console.log('✅ Transaction successful! Digest:', result.digest);
        console.log('📦 Object changes:', result.objectChanges);
        if (successMessage) {
          toast.success(successMessage);
        }
        return { 
          success: true, 
          digest: result.digest,
          effects: result.effects,
          objectChanges: result.objectChanges || undefined,
        };
      } else {
        const error = 'Transaction failed';
        console.error('❌ Transaction failed:', error);
        toast.error(error);
        return { success: false, error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Transaction failed';
      console.error('❌ Transaction error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    address: currentAccount?.address,
    isConnected: !!currentAccount,
    isExecuting,
    executeTransaction,
  };
}
