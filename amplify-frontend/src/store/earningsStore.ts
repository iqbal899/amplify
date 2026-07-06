import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction, MonthlyEarning } from '@/types';
import { mockTransactions, mockMonthlyData } from './mockData';

interface EarningsState {
  totalEarned: number;
  pendingAmount: number;
  paidOut: number;
  transactions: Transaction[];
  monthlyData: MonthlyEarning[];
  requestWithdrawal: () => void;
}

export const useEarningsStore = create<EarningsState>()(
  persist(
    (set, get) => ({
      totalEarned: 2840,
      pendingAmount: 650,
      paidOut: 2190,
      transactions: mockTransactions,
      monthlyData: mockMonthlyData,
      requestWithdrawal: () => {
        const { pendingAmount } = get();
        if (pendingAmount < 100) return;
        const newTransaction: Transaction = {
          id: `txn-${Date.now()}`,
          campaignId: '',
          trackName: 'Withdrawal',
          milestone: 0,
          amount: pendingAmount,
          status: 'pending',
          date: new Date().toISOString(),
        };
        set((state) => ({
          pendingAmount: 0,
          transactions: [newTransaction, ...state.transactions],
        }));
      },
    }),
    {
      name: 'doorbeen-earnings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
