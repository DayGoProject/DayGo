import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

const YEAR_LIST = [2024, 2025, 2026, 2027, 2028, 2029];
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { getKoreanHolidays } from '@/lib/holidays';

// 한국어 설정
LocaleConfig.locales['kr'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

interface TripCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectRange: (startDate: string, endDate: string) => void;
    startDate?: string;
    endDate?: string;
}

export function TripCalendarModal({ visible, onClose, onSelectRange, startDate, endDate }: TripCalendarModalProps) {
    const [selectedStartDate, setSelectedStartDate] = React.useState<string | null>(startDate || null);
    const [selectedEndDate, setSelectedEndDate] = React.useState<string | null>(endDate || null);

    // [코다리 부장] 연도 선택 상태 (기본값: 오늘 연도)
    const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear());
    const [yearModalVisible, setYearModalVisible] = React.useState(false);

    // 공휴일 데이터 가져오기 (선택된 연도)
    const holidays = useMemo(() => {
        return getKoreanHolidays(currentYear);
    }, [currentYear]);

    // 연도 변경 핸들러
    const changeYear = (increment: number) => {
        setCurrentYear(prev => prev + increment);
    };

    // 날짜 선택 핸들러
    const onDayPress = (day: any) => {
        if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
            // 새로운 시작일 선택 (범위 초기화)
            setSelectedStartDate(day.dateString);
            setSelectedEndDate(null);
        } else if (selectedStartDate && !selectedEndDate) {
            // 종료일 선택
            if (day.dateString < selectedStartDate) {
                // 시작일보다 이전 날짜를 선택하면 시작일을 변경
                setSelectedStartDate(day.dateString);
            } else {
                setSelectedEndDate(day.dateString);
            }
        }
    };

    const handleConfirm = () => {
        if (selectedStartDate) {
            onSelectRange(selectedStartDate, selectedEndDate || selectedStartDate);
            onClose();
        }
    };

    // 마킹된 날짜 생성 (선택 범위 + 공휴일)
    const markedDates = useMemo(() => {
        const marks: any = { ...holidays };

        // 공휴일 텍스트 표시를 위한 커스텀 마킹
        // react-native-calendars 기본 구현에서는 텍스트 표시가 제한적일 수 있음
        // 여기서는 기본 마킹에 색상만 적용

        if (selectedStartDate) {
            marks[selectedStartDate] = {
                ...marks[selectedStartDate],
                startingDay: true,
                color: '#007AFF',
                textColor: 'white',
                marked: marks[selectedStartDate]?.marked
            };
        }

        if (selectedEndDate) {
            marks[selectedEndDate] = {
                ...marks[selectedEndDate],
                endingDay: true,
                color: '#007AFF',
                textColor: 'white',
                marked: marks[selectedEndDate]?.marked
            };

            // 중간 날짜 채우기
            let current = new Date(selectedStartDate!);
            const end = new Date(selectedEndDate);
            current.setDate(current.getDate() + 1);

            while (current < end) {
                const dateString = current.toISOString().split('T')[0];
                marks[dateString] = {
                    ...marks[dateString],
                    color: '#E3F2FD', // 연한 파란색
                    textColor: '#007AFF',
                    marked: marks[dateString]?.marked
                };
                current.setDate(current.getDate() + 1);
            }
        }

        return marks;
    }, [selectedStartDate, selectedEndDate, holidays]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>취소</Text>
                    </TouchableOpacity>

                    {/* [코다리 부장] 연도 선택 드롭다운 (누르면 쫘르륵!) */}
                    <TouchableOpacity
                        style={styles.yearSelectorButton}
                        onPress={() => setYearModalVisible(true)}
                    >
                        <Text style={styles.yearSelectorText}>{currentYear}년 ▾</Text>
                    </TouchableOpacity>

                    {/* 연도 선택 모달 */}
                    <Modal
                        visible={yearModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setYearModalVisible(false)}
                    >
                        <TouchableOpacity
                            style={styles.yearModalOverlay}
                            activeOpacity={1}
                            onPress={() => setYearModalVisible(false)}
                        >
                            <View style={styles.yearModalContent}>
                                <Text style={styles.yearModalTitle}>연도 선택</Text>
                                <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
                                    {YEAR_LIST.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[
                                                styles.yearItem,
                                                currentYear === year && styles.selectedYearItem
                                            ]}
                                            onPress={() => {
                                                setCurrentYear(year);
                                                setYearModalVisible(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.yearItemText,
                                                currentYear === year && styles.selectedYearItemText
                                            ]}>
                                                {year}년
                                            </Text>
                                            {currentYear === year && (
                                                <Text style={styles.selectedYearCheck}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <TouchableOpacity
                        onPress={handleConfirm}
                        style={[styles.headerButton, !selectedStartDate && styles.disabledButton]}
                        disabled={!selectedStartDate}
                    >
                        <Text style={[styles.headerButtonText, styles.confirmText, !selectedStartDate && styles.disabledText]}>
                            완료
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        {selectedStartDate || '시작일'}
                        {'  →  '}
                        {selectedEndDate || '종료일'}
                    </Text>
                </View>

                <CalendarList
                    key={currentYear} // [코다리 부장] 연도 바뀔 때마다 리스트 초기화!
                    current={`${currentYear}-01-01`}
                    markingType={'custom'}
                    markedDates={markedDates}
                    monthFormat={'yyyy년 MM월'}
                    onDayPress={onDayPress}
                    pastScrollRange={0}
                    futureScrollRange={12}
                    dayComponent={({ date, state, marking }: any) => {
                        const isSelected = marking?.selected || marking?.startingDay || marking?.endingDay;
                        const isInRange = marking?.color === '#E3F2FD'; // using color check for range middle

                        // 일요일 체크
                        const d = new Date(date.dateString);
                        const isSunday = d.getDay() === 0;

                        // 공휴일 체크
                        const isHoliday = !!marking?.displayHolidayName;
                        const holidayName = marking?.displayHolidayName;

                        // 텍스트 색상 결정
                        let textColor = '#333';
                        if (state === 'disabled') textColor = '#d9e1e8';
                        else if (isSelected) textColor = 'white';
                        else if (isInRange) textColor = '#007AFF';
                        else if (isSunday || isHoliday) textColor = '#FF3B30';

                        // 배경 스타일 결정
                        let containerStyle: any = {
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 50,
                            height: 50,
                        };

                        if (isSelected) {
                            if (marking?.startingDay) {
                                containerStyle = {
                                    ...containerStyle,
                                    backgroundColor: '#007AFF',
                                    borderTopLeftRadius: 25,
                                    borderBottomLeftRadius: 25,
                                };
                            } else if (marking?.endingDay) {
                                containerStyle = {
                                    ...containerStyle,
                                    backgroundColor: '#007AFF',
                                    borderTopRightRadius: 25,
                                    borderBottomRightRadius: 25,
                                };
                            } else {
                                // 단일 선택
                                containerStyle = {
                                    ...containerStyle,
                                    backgroundColor: '#007AFF',
                                    borderRadius: 25,
                                };
                            }
                        } else if (isInRange) {
                            containerStyle = {
                                ...containerStyle,
                                backgroundColor: '#E3F2FD',
                            };
                        }

                        // 오늘 날짜 표시 (선택되지 않았을 때만)
                        if (state === 'today' && !isSelected && !isInRange) {
                            textColor = '#007AFF';
                        }

                        return (
                            <TouchableOpacity
                                onPress={() => onDayPress(date)}
                                style={containerStyle}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 2 }}>
                                    {date.day}
                                </Text>
                                {holidayName ? (
                                    <Text
                                        style={{ fontSize: 9, color: isSelected ? 'white' : '#FF3B30' }}
                                        numberOfLines={1}
                                    >
                                        {holidayName}
                                    </Text>
                                ) : (
                                    // 높이 유지를 위한 빈 뷰 (선택 사항, 레이아웃 일관성 위해)
                                    <View style={{ height: 11 }} />
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    theme={{
                        todayTextColor: '#007AFF',
                        selectedDayBackgroundColor: '#007AFF',
                        arrowColor: '#007AFF',
                        // @ts-ignore: 커스텀 테마 속성
                        'stylesheet.calendar.header': {
                            dayHeader: {
                                marginTop: 2,
                                marginBottom: 7,
                                width: 32,
                                textAlign: 'center',
                                fontSize: 13,
                                fontWeight: 'bold',
                                color: '#b6c1cd'
                            }
                        }
                    }}
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerButton: {
        padding: 8,
    },
    headerButtonText: {
        fontSize: 16,
        color: '#666',
    },
    confirmText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: '#999',
    },
    yearSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    yearArrow: {
        padding: 10,
    },
    yearArrowText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    yearSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
    },
    yearSelectorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    yearModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearModalContent: {
        width: 250,
        height: 350,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    yearModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    yearList: {
        flex: 1,
    },
    yearItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    selectedYearItem: {
        backgroundColor: '#FFF0E6', // 연한 주황색 배경
    },
    yearItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedYearItemText: {
        color: '#FF9A56', // 주황색 텍스트
        fontWeight: 'bold',
    },
    selectedYearCheck: {
        color: '#FF9A56',
        fontWeight: 'bold',
    },
    infoContainer: {
        padding: 16,
        backgroundColor: '#F9F9F9',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
});
