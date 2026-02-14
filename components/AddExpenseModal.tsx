import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { CurrencyWallet } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DateSelectionModal } from '@/components/DateSelectionModal';

interface AddExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    wallet: CurrencyWallet | null;
    onAddExpense: (amount: number, description: string, date: Date) => void;
}

export function AddExpenseModal({ visible, onClose, wallet, onAddExpense }: AddExpenseModalProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSave = () => {
        const value = parseFloat(amount.replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
            onAddExpense(value, description.trim() || '지출', date);
            setAmount('');
            setDescription('');
            setDate(new Date());
            onClose();
        }
    };

    const handleAmountChange = (text: string) => {
        let raw = text.replace(/,/g, '');
        const dots = raw.match(/\./g);
        if (dots && dots.length > 1) return;

        const parts = raw.split('.');
        let intPart = parts[0].replace(/[^0-9]/g, '');
        let decPart = parts.length > 1 ? parts[1].replace(/[^0-9]/g, '') : null;

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

    const handleDateSelect = (selectedDate: Date) => {
        setDate(selectedDate);
        setShowDatePicker(false);
    };

    if (!wallet) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>지출 추가 ({wallet.currency})</Text>

                    <Text style={styles.label}>금액</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>{wallet.symbol}</Text>
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

                    <Text style={styles.label}>날짜 및 시간</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={Colors.textPrimary} style={{ marginRight: 8 }} />
                        <Text style={styles.dateText}>
                            {format(date, 'M월 d일 (EEE) a h:mm', { locale: ko })}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>내용 (선택)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="예: 점심 식사, 기념품"
                        placeholderTextColor={Colors.textTertiary}
                    />

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
                            <Text style={styles.textStyle}>추가</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <DateSelectionModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={handleDateSelect}
                currentDate={date}
            />
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
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
        marginBottom: 20,
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
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    dateText: {
        fontSize: 16,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 30,
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
