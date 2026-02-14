import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from '@/store/expenseStore';
import { SetBudgetModal } from '@/components/SetBudgetModal';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddFundsModal } from '@/components/AddFundsModal';
import { ExchangeCalculatorModal } from '@/components/ExchangeCalculatorModal';
import { CurrencyWallet, Expense } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAlert } from '@/components/AlertProvider';

export default function ExpensesScreen() {
    const router = useRouter();
    const { wallets, setBudget, addExpense, addIncome, deleteTransaction, resetWallet, deleteWallet } = useExpenseStore();
    const { showAlert } = useAlert();

    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
    const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
    const [isAddFundsModalVisible, setIsAddFundsModalVisible] = useState(false);
    const [isCalculatorModalVisible, setIsCalculatorModalVisible] = useState(false);

    const activeWallet = wallets[selectedWalletIndex];

    const formatAmount = (amount: number) => {
        return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    const handleSetBudget = (currency: string, symbol: string, amount: number) => {
        setBudget(currency, symbol, amount);
        // If it's a new wallet, switch to it (simple check if it exists currently)
        // Since state updates are async, we might not see it immediately in 'wallets' here
        // But for simplicity, we can try to find if it was already there.
        // If we want to switch to the new one, we can do it after a small delay or effect.
        // For now, just setting budget is enough.
        // We can optimize by checking if it existed before.
        const exists = wallets.some(w => w.currency === currency);
        if (!exists) {
            // It will be added at the end
            setTimeout(() => setSelectedWalletIndex(wallets.length), 100);
        }
    };

    // logic restart to include setBudget and fix deleteTransaction


    const handleDeleteTransaction = (expense: Expense) => {
        showAlert(
            expense.type === 'income' ? '수입/잔액 취소' : '지출 삭제',
            '이 내역을 삭제하시겠습니까?',
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "삭제",
                    onPress: () => {
                        if (activeWallet) {
                            deleteTransaction(activeWallet.currency, expense.id);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleResetWallet = () => {
        showAlert(
            "지갑 초기화",
            "이 지갑의 모든 내역을 초기화하시겠습니까? 초기 금액은 유지됩니다.",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "초기화",
                    onPress: () => {
                        if (activeWallet) {
                            resetWallet(activeWallet.currency);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleDeleteWallet = () => {
        showAlert(
            "지갑 삭제",
            "이 지갑을 삭제하시겠습니까? 모든 내역이 영구적으로 삭제됩니다.",
            [
                {
                    text: "취소",
                    style: "cancel"
                },
                {
                    text: "삭제",
                    onPress: () => {
                        if (activeWallet) {
                            deleteWallet(activeWallet.currency);
                            setSelectedWalletIndex(0); // Reset selected index after deletion
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderWalletCard = ({ item, index }: { item: CurrencyWallet, index: number }) => {
        const isSelected = index === selectedWalletIndex;

        const totalIncome = item.expenses
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + e.amount, 0);
        const totalBudget = item.initialAmount + totalIncome;

        return (
            <TouchableOpacity
                style={[styles.walletCard, isSelected && styles.walletCardSelected]}
                onPress={() => setSelectedWalletIndex(index)}
                activeOpacity={0.8}
            >
                <View style={styles.walletHeader}>
                    <Text style={[styles.currencyCode, isSelected && styles.textWhite]}>{item.currency}</Text>
                    <Text style={[styles.currencySymbol, isSelected && styles.textWhite]}>{item.symbol}</Text>
                </View>
                <View style={styles.balanceContainer}>
                    <Text style={[styles.balanceLabel, isSelected && styles.textWhiteOpacity]}>남은 금액</Text>
                    <Text style={[styles.balanceAmount, isSelected && styles.textWhite]}>
                        {item.symbol} {formatAmount(item.remainingAmount)}
                    </Text>
                </View>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${Math.max(0, Math.min(100, (item.remainingAmount / totalBudget) * 100))}%` },
                                isSelected ? { backgroundColor: 'white' } : { backgroundColor: Colors.primary }
                            ]}
                        />
                    </View>
                    <Text style={[styles.initialAmount, isSelected && styles.textWhiteOpacity]}>
                        /{formatAmount(totalBudget)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderExpenseItem = ({ item }: { item: Expense }) => (
        <TouchableOpacity
            style={styles.expenseItem}
            onLongPress={() => handleDeleteTransaction(item)}
            delayLongPress={500}
        >
            <View style={styles.expenseInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.type === 'income' && <Ionicons name="add-circle" size={16} color="#4CAF50" style={{ marginRight: 4 }} />}
                    <Text style={styles.expenseDesc}>{item.description}</Text>
                </View>
                <Text style={styles.expenseDate}>
                    {format(new Date(item.date), 'M월 d일 HH:mm', { locale: ko })}
                </Text>
            </View>
            <Text style={[styles.expenseAmount, item.type === 'income' && { color: '#4CAF50' }]}>
                {item.type === 'income' ? '+' : '-'} {activeWallet?.symbol} {formatAmount(item.amount)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 헤더 */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>경비 계산기</Text>
                </View>
                {activeWallet && (
                    <TouchableOpacity onPress={() => setIsCalculatorModalVisible(true)} style={styles.calcButton}>
                        <Ionicons name="calculator" size={24} color={Colors.textPrimary} />
                        <Text style={styles.calcButtonText}>변환</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 지갑 목록 - 지갑이 있을 때만 표시 */}
            {wallets.length > 0 && (
                <View>
                    <FlatList
                        data={wallets}
                        renderItem={renderWalletCard}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.walletList}
                        ListFooterComponent={
                            <TouchableOpacity
                                style={styles.addWalletButton}
                                onPress={() => setIsBudgetModalVisible(true)}
                            >
                                <Ionicons name="add" size={32} color={Colors.primary} />
                                <Text style={styles.addWalletText}>예산 추가</Text>
                            </TouchableOpacity>
                        }
                    />
                </View>
            )}

            {activeWallet ? (
                <View style={styles.content}>
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>내역 ({activeWallet.expenses.length})</Text>
                        <View style={styles.listActions}>
                            <TouchableOpacity onPress={() => setIsAddFundsModalVisible(true)} style={[styles.actionButton, styles.addFundsButton]}>
                                <Ionicons name="cash-outline" size={16} color="white" style={{ marginRight: 4 }} />
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>잔액 추가</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleResetWallet} style={[styles.actionButton, { marginLeft: 8 }]}>
                                <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteWallet} style={[styles.actionButton, { marginLeft: 8 }]}>
                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {activeWallet.expenses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                            <Text style={styles.emptyText}>아직 내역이 없습니다.</Text>
                            <Text style={styles.emptySubText}>+ 버튼을 눌러 지출을 기록해보세요.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={activeWallet.expenses}
                            renderItem={renderExpenseItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.expenseList}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => setIsExpenseModalVisible(true)}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.emptyWalletState}>
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <Ionicons name="wallet-outline" size={80} color={Colors.primary} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyWalletText}>등록된 예산이 없습니다.</Text>
                        <Text style={styles.emptyWalletSubText}>새로운 여행 예산을 등록해보세요.</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bigAddButton}
                        onPress={() => setIsBudgetModalVisible(true)}
                    >
                        <Ionicons name="add-circle" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.bigAddButtonText}>예산 추가하기</Text>
                    </TouchableOpacity>
                </View>
            )}

            <SetBudgetModal
                visible={isBudgetModalVisible}
                onClose={() => setIsBudgetModalVisible(false)}
                onSetBudget={handleSetBudget}
            />

            <AddExpenseModal
                visible={isExpenseModalVisible}
                onClose={() => setIsExpenseModalVisible(false)}
                wallet={activeWallet}
                onAddExpense={(amount, desc, date) => activeWallet && addExpense(activeWallet.currency, amount, desc, date)}
            />

            <AddFundsModal
                visible={isAddFundsModalVisible}
                onClose={() => setIsAddFundsModalVisible(false)}
                wallet={activeWallet}
                onAddFunds={(amount, desc, date) => activeWallet && addIncome(activeWallet.currency, amount, desc, date)}
            />

            <ExchangeCalculatorModal
                visible={isCalculatorModalVisible}
                onClose={() => setIsCalculatorModalVisible(false)}
                wallet={activeWallet}
            />
        </SafeAreaView>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Layout.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    calcButton: {
        alignItems: 'center',
        padding: 4,
    },
    calcButtonText: {
        fontSize: 10,
        color: Colors.textPrimary,
        fontWeight: '600',
        marginTop: -2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    walletList: {
        padding: Layout.spacing.l,
        paddingRight: Layout.spacing.xl,
    },
    walletCard: {
        width: 280,
        height: 160,
        backgroundColor: Colors.surface,
        borderRadius: Layout.radius.xl,
        padding: Layout.spacing.l,
        marginRight: Layout.spacing.l,
        justifyContent: 'space-between',
        ...Shadows.medium,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    walletCardSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    addWalletButton: {
        width: 100,
        height: 160,
        backgroundColor: 'rgba(255, 154, 86, 0.1)',
        borderRadius: Layout.radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    addWalletText: {
        color: Colors.primary,
        marginTop: 8,
        fontWeight: '600',
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currencyCode: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    balanceContainer: {
        marginVertical: 10,
    },
    balanceLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginRight: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    initialAmount: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    textWhite: {
        color: 'white',
    },
    textWhiteOpacity: {
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...Shadows.small,
        marginTop: -20, // Overlap slightly for better look
        paddingTop: 20
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Layout.spacing.l,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
    },
    addFundsButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    expenseList: {
        paddingHorizontal: Layout.spacing.l,
        paddingBottom: 100,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...Shadows.small,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    expenseDate: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.error,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingBottom: 150, // Move up
    },
    emptyText: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    emptyWalletState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Move up
        paddingHorizontal: Layout.spacing.xl,
    },
    emptyWalletText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: 20,
    },
    emptyWalletSubText: {
        marginTop: 8,
        color: Colors.textSecondary,
    },
    bigAddButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: Layout.radius.xl,
        width: '100%',
        ...Shadows.medium,
    },
    bigAddButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
