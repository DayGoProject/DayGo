import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getKoreanHolidays } from '@/lib/holidays';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// Reuse Korean configuration or ensure it's set
LocaleConfig.locales['kr'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

interface DateSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentDate?: Date;
}

type Step = 'date' | 'time';

export function DateSelectionModal({ visible, onClose, onSelect, currentDate = new Date() }: DateSelectionModalProps) {
    const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
    const [step, setStep] = useState<Step>('date');
    const [showTimePickerAndroid, setShowTimePickerAndroid] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (visible) {
            setSelectedDate(new Date(currentDate));
            setStep('date');
            setShowTimePickerAndroid(false);
        }
    }, [visible, currentDate]);

    // Calendar marks
    const holidays = useMemo(() => {
        return getKoreanHolidays(selectedDate.getFullYear());
    }, [selectedDate.getFullYear()]);

    const markedDates = useMemo(() => {
        const marks: any = { ...holidays };
        const dateString = format(selectedDate, 'yyyy-MM-dd');

        marks[dateString] = {
            ...marks[dateString],
            selected: true,
            selectedColor: '#007AFF',
            selectedTextColor: 'white'
        };
        return marks;
    }, [selectedDate, holidays]);

    const onDayPress = (day: any) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(day.year);
        newDate.setMonth(day.month - 1);
        newDate.setDate(day.day);
        setSelectedDate(newDate);
    };

    const handleDateConfirm = () => {
        setStep('time');
    };

    const onChangeTime = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePickerAndroid(false);
        }

        if (date) {
            const newDate = new Date(selectedDate);
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
            setSelectedDate(newDate);
        }
    };

    const handleConfirm = () => {
        onSelect(selectedDate);
        onClose();
    };

    const handleBack = () => {
        setStep('date');
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, step === 'time' && styles.modalViewSmall]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {step === 'date' ? '날짜 선택' : '시간 선택'}
                        </Text>
                    </View>

                    {step === 'date' ? (
                        <View style={styles.calendarContainer}>
                            <Calendar
                                key={selectedDate.getFullYear()}
                                current={format(selectedDate, 'yyyy-MM-dd')}
                                onDayPress={onDayPress}
                                monthFormat={'yyyy년 MM월'}
                                markingType={'custom'}
                                markedDates={markedDates}
                                theme={{
                                    todayTextColor: '#007AFF',
                                    selectedDayBackgroundColor: '#007AFF',
                                    arrowColor: '#007AFF',
                                    textDayFontSize: 14,
                                    textMonthFontSize: 16,
                                    textDayHeaderFontSize: 14
                                }}
                                dayComponent={({ date, state, marking }: any) => {
                                    const isSelected = marking?.selected;
                                    const d = new Date(date.dateString);
                                    const isSunday = d.getDay() === 0;
                                    const isHoliday = !!marking?.displayHolidayName;
                                    const holidayName = marking?.displayHolidayName;

                                    let textColor = '#333';
                                    if (state === 'disabled') textColor = '#d9e1e8';
                                    else if (isSelected) textColor = 'white';
                                    else if (isSunday || isHoliday) textColor = '#FF3B30';

                                    // Today check
                                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                                    const isToday = date.dateString === todayStr;
                                    if (isToday && !isSelected) textColor = '#007AFF';

                                    return (
                                        <TouchableOpacity
                                            onPress={() => onDayPress(date)}
                                            style={[
                                                styles.dayContainer,
                                                isSelected && styles.selectedDay
                                            ]}
                                        >
                                            <Text style={{ color: textColor, fontWeight: '600' }}>{date.day}</Text>
                                            {holidayName && (
                                                <Text style={{ fontSize: 8, color: isSelected ? 'white' : '#FF3B30', width: '100%', textAlign: 'center' }} numberOfLines={1}>
                                                    {holidayName}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    ) : (
                        <View style={styles.timeContainer}>
                            <View style={styles.selectedDateDisplay}>
                                <Text style={styles.selectedDateText}>
                                    {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}
                                </Text>
                            </View>

                            {Platform.OS === 'ios' ? (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={onChangeTime}
                                    style={styles.timePicker}
                                    textColor="#000000"
                                />
                            ) : (
                                <View style={styles.androidTimeContainer}>
                                    <TouchableOpacity
                                        style={styles.androidTimeButton}
                                        onPress={() => setShowTimePickerAndroid(true)}
                                    >
                                        <Text style={styles.androidTimeText}>
                                            {format(selectedDate, 'a h:mm', { locale: ko })}
                                        </Text>
                                        <Text style={styles.androidTimeHint}>터치하여 시간 변경</Text>
                                    </TouchableOpacity>

                                    {showTimePickerAndroid && (
                                        <DateTimePicker
                                            value={selectedDate}
                                            mode="time"
                                            display="spinner"
                                            is24Hour={false}
                                            onChange={onChangeTime}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        {step === 'date' ? (
                            <>
                                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose}>
                                    <Text style={styles.buttonText}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.buttonConfirm]} onPress={handleDateConfirm}>
                                    <Text style={styles.buttonText}>다음</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={handleBack}>
                                    <Text style={styles.buttonText}>이전</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.buttonConfirm]} onPress={handleConfirm}>
                                    <Text style={styles.buttonText}>완료</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
        maxHeight: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalViewSmall: {
        // height: 'auto', 
    },
    header: {
        marginBottom: 15,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    calendarContainer: {
        marginBottom: 20,
    },
    dayContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    selectedDay: {
        backgroundColor: '#007AFF',
    },
    timeContainer: {
        marginBottom: 20,
        alignItems: 'center',
        paddingVertical: 20,
        minHeight: 200,
        justifyContent: 'center',
    },
    selectedDateDisplay: {
        marginBottom: 30,
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
    },
    selectedDateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    timePicker: {
        height: 180,
        width: '100%',
    },
    androidTimeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    androidTimeButton: {
        paddingVertical: 20,
        paddingHorizontal: 40,
        backgroundColor: '#F0F8FF',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    androidTimeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    androidTimeHint: {
        fontSize: 12,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    buttonCancel: {
        backgroundColor: '#9E9E9E',
    },
    buttonConfirm: {
        backgroundColor: '#007AFF',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
