import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyWallet, Expense } from '@/types';

interface ExpenseState {
    wallets: CurrencyWallet[];

    // 액션
    setBudget: (currency: string, symbol: string, amount: number) => void;
    addExpense: (currency: string, amount: number, description: string, date?: Date) => void;
    addIncome: (currency: string, amount: number, description: string, date?: Date) => void; // 잔액 추가
    deleteTransaction: (currency: string, transactionId: string) => void; // 지출/수입 삭제 통일
    resetWallet: (currency: string) => void;
    deleteWallet: (currency: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            wallets: [],

            setBudget: (currency, symbol, amount) => {
                const { wallets } = get();
                const existingWalletIndex = wallets.findIndex(w => w.currency === currency);

                if (existingWalletIndex !== -1) {
                    const updatedWallets = [...wallets];
                    const wallet = updatedWallets[existingWalletIndex];

                    // 잔액 재계산: 초기금액 + 수입총합 - 지출총합
                    const totalIncome = wallet.expenses
                        .filter(e => e.type === 'income')
                        .reduce((sum, e) => sum + e.amount, 0);
                    const totalExpense = wallet.expenses
                        .filter(e => e.type === 'expense')
                        .reduce((sum, e) => sum + e.amount, 0);

                    updatedWallets[existingWalletIndex] = {
                        ...wallet,
                        initialAmount: amount,
                        remainingAmount: amount + totalIncome - totalExpense,
                        symbol: symbol
                    };

                    set({ wallets: updatedWallets });
                } else {
                    // 새 지갑 생성
                    const newWallet: CurrencyWallet = {
                        id: Date.now().toString(),
                        currency,
                        symbol,
                        initialAmount: amount,
                        remainingAmount: amount,
                        expenses: []
                    };
                    set({ wallets: [...wallets, newWallet] });
                }
            },

            addExpense: (currency, amount, description, date) => {
                const { wallets } = get();
                const walletIndex = wallets.findIndex(w => w.currency === currency);

                if (walletIndex === -1) return;

                const updatedWallets = [...wallets];
                const wallet = updatedWallets[walletIndex];

                const newExpense: Expense = {
                    id: Date.now().toString(),
                    type: 'expense',
                    amount,
                    description,
                    date: date ? date.toISOString() : new Date().toISOString()
                };

                updatedWallets[walletIndex] = {
                    ...wallet,
                    expenses: [newExpense, ...wallet.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // 날짜순 정렬
                    remainingAmount: wallet.remainingAmount - amount
                };

                set({ wallets: updatedWallets });
            },

            addIncome: (currency, amount, description, date) => {
                const { wallets } = get();
                const walletIndex = wallets.findIndex(w => w.currency === currency);
                if (walletIndex === -1) return;

                const updatedWallets = [...wallets];
                const wallet = updatedWallets[walletIndex];

                const newIncome: Expense = {
                    id: Date.now().toString(),
                    type: 'income',
                    amount,
                    description,
                    date: date ? date.toISOString() : new Date().toISOString()
                };

                updatedWallets[walletIndex] = {
                    ...wallet,
                    expenses: [newIncome, ...wallet.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // 날짜순 정렬
                    remainingAmount: wallet.remainingAmount + amount
                };

                set({ wallets: updatedWallets });
            },

            deleteTransaction: (currency, transactionId) => {
                const { wallets } = get();
                const walletIndex = wallets.findIndex(w => w.currency === currency);
                if (walletIndex === -1) return;

                const updatedWallets = [...wallets];
                const wallet = updatedWallets[walletIndex];

                const txToDelete = wallet.expenses.find(e => e.id === transactionId);
                if (!txToDelete) return;

                const amountDiff = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;

                updatedWallets[walletIndex] = {
                    ...wallet,
                    expenses: wallet.expenses.filter(e => e.id !== transactionId),
                    remainingAmount: wallet.remainingAmount + amountDiff
                };

                set({ wallets: updatedWallets });
            },

            resetWallet: (currency) => {
                const { wallets } = get();
                const walletIndex = wallets.findIndex(w => w.currency === currency);

                if (walletIndex === -1) return;

                const updatedWallets = [...wallets];
                // 초기 금액으로 리셋하고 지출 내역 삭제
                updatedWallets[walletIndex] = {
                    ...updatedWallets[walletIndex],
                    remainingAmount: updatedWallets[walletIndex].initialAmount,
                    expenses: []
                };

                set({ wallets: updatedWallets });
            },

            deleteWallet: (currency) => {
                const { wallets } = get();
                set({ wallets: wallets.filter(w => w.currency !== currency) });
            }
        }),
        {
            name: 'daygo-expense-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
