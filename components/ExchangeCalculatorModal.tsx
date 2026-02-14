import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { CurrencyWallet } from '@/types';
import { useAlert } from '@/components/AlertProvider';

interface ExchangeCalculatorModalProps {
    visible: boolean;
    onClose: () => void;
    wallet: CurrencyWallet | null;
}

const SUPPORTED_CURRENCIES = [
    { code: 'KRW', symbol: '₩', name: '대한민국 원' },
    { code: 'USD', symbol: '$', name: '미국 달러' },
    { code: 'JPY', symbol: '¥', name: '일본 엔' },
    { code: 'EUR', symbol: '€', name: '유로' },
    { code: 'CNY', symbol: '¥', name: '중국 위안' },
    { code: 'GBP', symbol: '£', name: '영국 파운드' },
    { code: 'VND', symbol: '₫', name: '베트남 동' },
    { code: 'THB', symbol: '฿', name: '태국 바트' },
    { code: 'TWD', symbol: 'NT$', name: '대만 달러' },
];

export function ExchangeCalculatorModal({ visible, onClose, wallet }: ExchangeCalculatorModalProps) {
    const [targetCurrency, setTargetCurrency] = useState(SUPPORTED_CURRENCIES[0]); // Default KRW
    const [exchangeRate, setExchangeRate] = useState('');
    const [convertedRemaining, setConvertedRemaining] = useState(0);
    const [convertedSpent, setConvertedSpent] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { showAlert } = useAlert();

    // Remove the automatic fetch effect
    // useEffect(() => {
    //     if (visible && wallet) {
    //          if (wallet.currency !== targetCurrency.code) {
    //              fetchExchangeRate(wallet.currency, targetCurrency.code);
    //          } else {
    //              setExchangeRate('1');
    //              setConvertedRemaining(wallet.remainingAmount);
    //              const totalSpent = wallet.expenses
    //                 .filter(e => e.type === 'expense')
    //                 .reduce((sum, e) => sum + e.amount, 0);
    //              setConvertedSpent(totalSpent);
    //          }
    //     } ...
    // }, [visible, wallet, targetCurrency]); 

    // Reset fields on close, but don't auto-fetch on open
    useEffect(() => {
        if (!visible) {
            setExchangeRate('');
            setConvertedRemaining(0);
            setConvertedSpent(0);
            setTargetCurrency(SUPPORTED_CURRENCIES[0]); // Reset to KRW on close
            setIsLoading(false);
        }
    }, [visible]);

    // Recalculate when target currency changes (but don't fetch rate automatically)
    useEffect(() => {
        if (visible && wallet) {
            if (wallet.currency === targetCurrency.code) {
                setExchangeRate('1');
                setConvertedRemaining(wallet.remainingAmount);
                const totalSpent = wallet.expenses
                    .filter(e => e.type === 'expense')
                    .reduce((sum, e) => sum + e.amount, 0);
                setConvertedSpent(totalSpent);
            } else {
                // Keep the current exchange rate if valid, or clear it if it doesn't make sense?
                // User might want to keep the rate while switching currency (less likely)
                // Let's clear it to force input or fetch
                setExchangeRate('');
                setConvertedRemaining(0);
                setConvertedSpent(0);
            }
        }
    }, [targetCurrency, visible, wallet]);

    const handleFetchRate = async () => {
        if (!wallet) return;

        setIsLoading(true);
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${wallet.currency}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const rate = data.rates[targetCurrency.code];

            if (rate) {
                setExchangeRate(rate.toString());
                // Calculate immediately
                setConvertedRemaining(Math.round(wallet.remainingAmount * rate));
                const totalSpent = wallet.expenses
                    .filter(e => e.type === 'expense')
                    .reduce((sum, e) => sum + e.amount, 0);
                setConvertedSpent(Math.round(totalSpent * rate));
            } else {
                throw new Error('Rate not found');
            }
        } catch (error) {
            console.error('Failed to fetch exchange rate:', error);
            showAlert(
                "연결 실패",
                "인터넷 연결을 확인하거나 나중에 다시 시도해주세요.",
                [{ text: "확인" }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateChange = (text: string) => {
        const value = text.replace(/[^0-9.]/g, '');
        setExchangeRate(value);

        const rate = parseFloat(value);
        if (!isNaN(rate) && wallet) {
            setConvertedRemaining(Math.round(wallet.remainingAmount * rate));
            const totalSpent = wallet.expenses
                .filter(e => e.type === 'expense')
                .reduce((sum, e) => sum + e.amount, 0);
            setConvertedSpent(Math.round(totalSpent * rate));
        } else {
            setConvertedRemaining(0);
            setConvertedSpent(0);
        }
    };

    if (!wallet) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.title}>환율 계산기</Text>
                            <TouchableOpacity
                                onPress={() => showAlert(
                                    "환율 정보 안내",
                                    "앱에서 제공하는 환율은 국제 시장 기준(Open Exchange Rates)입니다.\n\n네이버 등 국내 포털에서 보여주는 은행 고시 환율(수수료 포함)과는 약간의 차이가 있을 수 있습니다.\n\n정확한 계산이 필요하다면 '적용 환율'을 직접 수정해주세요.",
                                    [{ text: "확인" }]
                                )}
                                style={{ marginLeft: 8 }}
                            >
                                <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Source Wallet Info */}
                    <Text style={styles.sectionLabel}>현재 지갑 ({wallet.currency})</Text>
                    <View style={styles.sourceInfo}>
                        <Text style={styles.infoText}>잔액: {wallet.symbol} {wallet.remainingAmount.toLocaleString()}</Text>
                    </View>

                    {/* Target Currency Selection */}
                    <Text style={styles.label}>변환할 화폐 선택</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                        {SUPPORTED_CURRENCIES.map((curr) => (
                            <TouchableOpacity
                                key={curr.code}
                                style={[
                                    styles.currencyChip,
                                    targetCurrency.code === curr.code && styles.currencyChipSelected,
                                    wallet.currency === curr.code && styles.currencyChipDisabled
                                ]}
                                onPress={() => wallet.currency !== curr.code && setTargetCurrency(curr)}
                                disabled={wallet.currency === curr.code}
                            >
                                <Text style={[
                                    styles.currencyText,
                                    targetCurrency.code === curr.code && styles.currencyTextSelected,
                                    wallet.currency === curr.code && styles.currencyTextDisabled
                                ]}>
                                    {curr.symbol} {curr.code}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Exchange Rate Input */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.s }}>
                        <Text style={styles.label}>적용 환율</Text>
                        <TouchableOpacity
                            onPress={handleFetchRate}
                            style={styles.fetchButton}
                            disabled={isLoading || wallet.currency === targetCurrency.code}
                        >
                            <Ionicons name="refresh" size={14} color="white" style={{ marginRight: 4 }} />
                            <Text style={styles.fetchButtonText}>실시간 환율 적용</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.rateHint}>
                            1 {wallet.currency} =
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={exchangeRate}
                            onChangeText={handleRateChange}
                            placeholder="0.0"
                            keyboardType="decimal-pad"
                            placeholderTextColor={Colors.textTertiary}
                        />
                        <Text style={styles.rateSuffix}>{targetCurrency.code}</Text>
                    </View>
                    <Text style={styles.helperText}>
                        {isLoading ? '환율 정보를 가져오는 중입니다...' :
                            (wallet.currency === 'JPY' || wallet.currency === 'VND'
                                ? `(Tip: 100단위 통화는 1${wallet.currency}당 가격을 입력하세요)`
                                : '(실시간 환율 버튼을 누르거나 직접 입력하세요)')}
                    </Text>

                    {/* Result Card */}
                    <View style={styles.resultCard}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>환산 잔액</Text>
                            <Text style={styles.resultValue}>
                                {targetCurrency.symbol} {convertedRemaining.toLocaleString()}
                            </Text>
                        </View>
                        <View style={[styles.resultRow, { marginTop: 12 }]}>
                            <Text style={styles.resultLabel}>환산 지출총액</Text>
                            <Text style={[styles.resultValue, { color: Colors.error }]}>
                                {targetCurrency.symbol} {convertedSpent.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Layout.radius.xl,
        borderTopRightRadius: Layout.radius.xl,
        padding: Layout.spacing.xl,
        ...Shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.l,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    sourceInfo: {
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: Layout.spacing.l,
    },
    infoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    fetchButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    fetchButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    currencyScroll: {
        marginBottom: Layout.spacing.l,
        flexGrow: 0,
    },
    currencyChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    currencyChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    currencyChipDisabled: {
        opacity: 0.5,
        backgroundColor: '#eee',
    },
    currencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    currencyTextSelected: {
        color: '#FFF',
    },
    currencyTextDisabled: {
        color: '#aaa',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
        paddingBottom: 4,
    },
    rateHint: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        textAlign: 'right',
        marginRight: 8,
    },
    rateSuffix: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    helperText: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 6,
        marginBottom: Layout.spacing.xl,
        textAlign: 'right',
    },
    resultCard: {
        backgroundColor: 'rgba(255, 154, 86, 0.1)',
        padding: 20,
        borderRadius: 16,
        marginTop: 8,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    resultValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
});
