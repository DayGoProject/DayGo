import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Modal,
    Pressable,
    Platform,
    Alert
} from 'react-native';
import { Trip } from '@/types';
import { TripCalendarModal } from '@/components/TripCalendarModal';
import { useAlert } from '@/components/AlertProvider';

interface EditTripModalProps {
    visible: boolean;
    trip: Trip | null;
    onClose: () => void;
    onUpdate: (title: string, startDate: string, endDate: string) => Promise<void>;
}

export function EditTripModal({ visible, trip, onClose, onUpdate }: EditTripModalProps) {
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        if (trip) {
            setTitle(trip.title);
            setStartDate(new Date(trip.startDate));
            setEndDate(new Date(trip.endDate));
        }
    }, [trip, visible]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('여행 제목을 입력해주세요!');
            return;
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        if (startDate > endDate) {
            alert('종료일은 시작일보다 빠를 수 없습니다!');
            return;
        }

        // 날짜 변경 여부 확인
        const isDateChanged =
            trip?.startDate !== startStr ||
            trip?.endDate !== endStr;

        if (isDateChanged) {
            // 날짜 변경 시 경고
            if (Platform.OS === 'web') {
                const confirmed = confirm(
                    '날짜를 수정하면 일차별 내용(사진, 파일)이 초기화됩니다.\n준비물 목록만 유지됩니다.\n계속하시겠습니까?'
                );
                if (!confirmed) return;
            } else {
                showAlert(
                    '날짜 수정 주의',
                    '날짜를 수정하면 일차별 내용(사진, 파일)이 초기화됩니다.\n준비물 목록만 유지됩니다.\n계속하시겠습니까?',
                    [
                        { text: '취소', style: 'cancel' },
                        {
                            text: '수정 및 초기화',
                            style: 'destructive',
                            onPress: async () => {
                                await onUpdate(title, startStr, endStr);
                                onClose();
                            }
                        }
                    ]
                );
                return; // Alert 비동기 처리 대기
            }
        }

        // 날짜 변경 없음 or 웹 확인 완료
        await onUpdate(title, startStr, endStr);
        onClose();
    };

    const handleDateRangeSelect = (start: string, end: string) => {
        setStartDate(new Date(start));
        setEndDate(new Date(end));
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
                    <Text style={styles.modalTitle}>여행 정보 수정</Text>

                    <Text style={styles.label}>여행 이름</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 파리 여행"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>기간 설정</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setIsCalendarVisible(true)}
                    >
                        <View style={styles.dateField}>
                            <Text style={styles.dateLabel}>가는 날</Text>
                            <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.dateArrow}>→</Text>
                        <View style={styles.dateField}>
                            <Text style={styles.dateLabel}>오는 날</Text>
                            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyle}>취소</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonSave]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.textStyle}>수정 완료</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <TripCalendarModal
                visible={isCalendarVisible}
                onClose={() => setIsCalendarVisible(false)}
                onSelectRange={handleDateRangeSelect}
                startDate={startDate.toISOString().split('T')[0]}
                endDate={endDate.toISOString().split('T')[0]}
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
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    dateField: {
        flex: 1,
    },
    dateArrow: {
        paddingHorizontal: 10,
    },
    dateLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dateButton: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
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
        backgroundColor: '#007AFF',
    },
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 20,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});
