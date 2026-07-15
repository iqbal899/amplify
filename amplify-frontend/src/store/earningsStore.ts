import { create } from "zustand";
import type { Transaction, MonthlyEarning } from "@/types";

interface EarningsState {
  totalRewards: number;

  paidRewards: number;

  awaitingPayment: number;

  activeRewards: number;

  transactions: Transaction[];

  monthlyData: MonthlyEarning[];

  setRewards: (data: {
    totalRewards: number;
    paidRewards: number;
    awaitingPayment: number;
    activeRewards: number;
    transactions: Transaction[];
    monthlyData: MonthlyEarning[];
  }) => void;

  clearRewards: () => void;
}

export const useEarningsStore =
  create<EarningsState>((set) => ({
    totalRewards: 0,

    paidRewards: 0,

    awaitingPayment: 0,

    activeRewards: 0,

    transactions: [],

    monthlyData: [],

    setRewards: (data) =>
      set({
        totalRewards: data.totalRewards,
        paidRewards: data.paidRewards,
        awaitingPayment:
          data.awaitingPayment,
        activeRewards: data.activeRewards,
        transactions: data.transactions,
        monthlyData: data.monthlyData,
      }),

    clearRewards: () =>
      set({
        totalRewards: 0,
        paidRewards: 0,
        awaitingPayment: 0,
        activeRewards: 0,
        transactions: [],
        monthlyData: [],
      }),
  }));