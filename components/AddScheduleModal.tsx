import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, Platform, TouchableOpacity } from 'react-native';
import { Colors } from '@/lib/theme';
import { useAlert } from '@/components/AlertProvider'; // Use global alert
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string, time: string, description: string, color: string, endTime?: string) => Promise<void>;
}

export function AddScheduleModal({ visible, onClose, onSave }: AddScheduleModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [useEndTime, setUseEndTime] = useState(false); // [코다리] 종료 시간 사용 여부 토글
    const [color, setColor] = useState(Colors.primary);

    // Control picker visibility manually
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Simple color palette
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9D4EDD', '#FF9F43'];

    const { showAlert } = useAlert();

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setShowStartPicker(false);
            setShowEndPicker(false);

            const now = new Date();
            setStartTime(now);
            // Default End Time = Start Time + 1 hour
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            setEndTime(oneHourLater);
            setUseEndTime(false); // 초기값은 미사용

            setTitle('');
            setDescription('');
            setColor(Colors.primary);
        }
    }, [visible]);

    const handleSave = async () => {
        if (!title.trim()) {
            showAlert("입력 오류", "일정 제목을 입력해주세요.");
            return;
        }

        // Validate End Time > Start Time? 
        if (useEndTime && endTime < startTime) {
            showAlert("시간 오류", "종료 시간은 시작 시간보다 늦어야 합니다.");
            return;
        }

        const startTimeStr = startTime.toTimeString().split(' ')[0].substring(0, 5); // "HH:mm"
        const endTimeStr = useEndTime ? endTime.toTimeString().split(' ')[0].substring(0, 5) : undefined;

        await onSave(title, startTimeStr, description, color, endTimeStr);

        onClose();
    };

    const onChangeStartTime = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowStartPicker(false);
        if (selectedDate) {
            setStartTime(selectedDate);
            // Auto-adjust End Time if it becomes earlier than Start Time
            if (selectedDate > endTime) {
                const newEnd = new Date(selectedDate.getTime() + 60 * 60 * 1000);
                setEndTime(newEnd);
            }
        }
    };

    const onChangeEndTime = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowEndPicker(false);
        if (selectedDate) setEndTime(selectedDate);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>새 일정 추가</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.label}>시간 설정</Text>
                        <TouchableOpacity
                            onPress={() => setUseEndTime(!useEndTime)}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: 12, color: useEndTime ? Colors.primary : Colors.textSecondary, fontWeight: 'bold' }}>
                                {useEndTime ? '종료 시간 사용 중 ✓' : '+ 종료 시간 추가'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timeRow}>
                        {/* Start Time */}
                        <View style={{ flex: 1, marginRight: useEndTime ? 8 : 0 }}>
                            <Text style={styles.subLabel}>시작</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.timeInputTab, showStartPicker && styles.timeInputActive]}
                                onPress={() => { setShowStartPicker(!showStartPicker); setShowEndPicker(false); }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.timeInputText}>{formatTime(startTime)}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {useEndTime && (
                            <>
                                <Text style={{ alignSelf: 'center', marginTop: 16, fontWeight: 'bold' }}>~</Text>

                                {/* End Time */}
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.subLabel}>종료</Text>
                                    <TouchableOpacity
                                        style={[styles.input, styles.timeInputTab, showEndPicker && styles.timeInputActive]}
                                        onPress={() => { setShowEndPicker(!showEndPicker); setShowStartPicker(false); }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.timeInputText}>{formatTime(endTime)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Pickers */}
                    {showStartPicker && (
                        <View style={styles.timePickerContainer}>
                            <Text style={styles.pickerLabel}>시작 시간 선택</Text>
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                is24Hour={false}
                                onChange={onChangeStartTime}
                                style={Platform.OS === 'ios' ? { width: '100%', height: 120 } : undefined}
                                textColor={Colors.textPrimary}
                            />
                        </View>
                    )}

                    {showEndPicker && (
                        <View style={styles.timePickerContainer}>
                            <Text style={styles.pickerLabel}>종료 시간 선택</Text>
                            <DateTimePicker
                                value={endTime}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                is24Hour={false}
                                onChange={onChangeEndTime}
                                style={Platform.OS === 'ios' ? { width: '100%', height: 120 } : undefined}
                                textColor={Colors.textPrimary}
                            />
                        </View>
                    )}


                    <Text style={styles.label}>제목</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 점심 식사"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>설명 (선택)</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="메모를 입력하세요"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <Text style={styles.label}>색상 태그</Text>
                    <View style={styles.colorContainer}>
                        {colors.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
                                onPress={() => setColor(c)}
                            />
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyle}>취소</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonSave]}
                            onPress={handleSave}
                        >
                            <Text style={styles.textStyle}>저장</Text>
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
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'stretch',
        width: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: Colors.textPrimary,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    subLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    timePickerContainer: {
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'center',
        width: '100%',
        backgroundColor: '#F9F9F9',
        borderRadius: 10,
        paddingVertical: 10,
    },
    pickerLabel: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    colorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    colorSelected: {
        borderColor: 'black',
        borderWidth: 2,
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
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    timeInputTab: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#FCFCFC',
    },
    timeInputActive: {
        borderColor: Colors.primary,
        backgroundColor: '#F0F8FF',
    },
    timeInputIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    timeInputText: {
        fontSize: 16,
        color: Colors.textPrimary,
        fontWeight: 'bold',
    },
});
