import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';

interface SetBudgetModalProps {
    visible: boolean;
    onClose: () => void;
    onSetBudget: (currency: string, symbol: string, amount: number) => void;
}

const CURRENCIES = [
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

export function SetBudgetModal({ visible, onClose, onSetBudget }: SetBudgetModalProps) {
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
    const [amount, setAmount] = useState('');

    const handleSave = () => {
        const value = parseFloat(amount.replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
            onSetBudget(selectedCurrency.code, selectedCurrency.symbol, value);
            setAmount('');
            onClose();
        }
    };

    const handleAmountChange = (text: string) => {
        // Remove existing commas to get raw number
        let raw = text.replace(/,/g, '');

        // Prevent multiple dots
        const dots = raw.match(/\./g);
        if (dots && dots.length > 1) return;

        // Split integer and decimal parts
        const parts = raw.split('.');
        let intPart = parts[0].replace(/[^0-9]/g, '');
        let decPart = parts.length > 1 ? parts[1].replace(/[^0-9]/g, '') : null;

        // Limit decimal places to 2
        if (decPart !== null) {
            decPart = decPart.slice(0, 2);
        }

        let formatted = '';
        if (intPart) {
            formatted = parseInt(intPart, 10).toLocaleString();
        }

        if (decPart !== null) {
            if (!intPart) formatted = '0';
            formatted += '.' + decPart;
        }

        setAmount(formatted);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>예산 설정</Text>

                    <Text style={styles.label}>화폐 선택</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                        {CURRENCIES.map((curr) => (
                            <TouchableOpacity
                                key={curr.code}
                                style={[
                                    styles.currencyChip,
                                    selectedCurrency.code === curr.code && styles.currencyChipSelected
                                ]}
                                onPress={() => setSelectedCurrency(curr)}
                            >
                                <Text style={[
                                    styles.currencyText,
                                    selectedCurrency.code === curr.code && styles.currencyTextSelected
                                ]}>
                                    {curr.symbol} {curr.code}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>초기 금액 ({selectedCurrency.name})</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={handleAmountChange}
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor={Colors.textTertiary}
                            autoFocus
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyle}>취소</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonSave, !amount && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={!amount}
                        >
                            <Text style={styles.textStyle}>저장하기</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 10,
        marginTop: 10,
    },
    currencyScroll: {
        marginBottom: 20,
        flexGrow: 0,
    },
    currencyChip: {
        paddingHorizontal: 16,
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
    currencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    currencyTextSelected: {
        color: '#FFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
        marginBottom: 30,
        paddingBottom: 8,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        flex: 0.48,
    },
    buttonCancel: {
        backgroundColor: '#9E9E9E',
    },
    buttonSave: {
        backgroundColor: Colors.primary,
    },
    buttonDisabled: {
        backgroundColor: Colors.border,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
