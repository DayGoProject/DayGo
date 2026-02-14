import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { useTripStore } from '@/store/tripStore';
import { Day, Trip } from '@/types';
import { DayScheduleModal } from '@/components/DayScheduleModal';
import { AddScheduleModal } from '@/components/AddScheduleModal';
import { useFocusEffect } from 'expo-router';
import { ko } from 'date-fns/locale';
import { eachDayOfInterval, parseISO, format, isSameDay, isWithinInterval, compareAsc } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

// Calendar Config (Korean)
LocaleConfig.locales['kr'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

const SCREEN_WIDTH = Dimensions.get('window').width;

// [코다리] 여행별 색상 팔레트
const TRIP_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

export default function ItineraryScreen() {
    const router = useRouter();
    const { trips, loadTrips, addScheduleItem } = useTripStore();

    // States
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [isDayModalVisible, setIsDayModalVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM-dd')); // [코다리] 현재 보고 있는 달

    useFocusEffect(
        useCallback(() => {
            loadTrips();
        }, [])
    );

    // [코다리] Store 업데이트 시 selectedDay 자동 동기화 (즉시 반영)
    React.useEffect(() => {
        if (selectedTripId && selectedDay) {
            const trip = trips.find(t => t.id === selectedTripId);
            if (trip) {
                const day = trip.days.find(d => d.id === selectedDay.id);
                if (day) {
                    setSelectedDay(day);
                }
            }
        }
    }, [trips]);

    // [코다리] 날짜별 여행 정보 (Layering 계산)
    const dayTripMap = useMemo(() => {
        const map: { [date: string]: { trip: Trip, color: string, position: number, isStart: boolean, isEnd: boolean }[] } = {};

        if (!Array.isArray(trips)) return map;

        // 1. 여행을 시작일 순서로 정렬 (겹침 처리의 기준이 됨)
        const sortedTrips = [...trips]
            .filter(t => t.startDate && t.endDate)
            .sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)));

        // 2. 각 날짜별로 여행 할당 및 Position(층) 계산
        // 간단한 Greedy 방식: 가능한 가장 낮은 층(0부터)을 할당
        // dateString -> occupied positions Set
        const occupiedPositions: { [date: string]: Set<number> } = {};

        sortedTrips.forEach((trip, index) => {
            const start = parseISO(trip.startDate);
            const end = parseISO(trip.endDate);
            const days = eachDayOfInterval({ start, end });
            const color = TRIP_COLORS[index % TRIP_COLORS.length];

            // 이 여행이 사용할 Position 찾기
            let position = 0;
            while (true) {
                let collision = false;
                for (const date of days) {
                    const dateString = format(date, 'yyyy-MM-dd');
                    if (occupiedPositions[dateString] && occupiedPositions[dateString].has(position)) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) break;
                position++;
            }

            // 할당
            days.forEach((date) => {
                const dateString = format(date, 'yyyy-MM-dd');
                if (!map[dateString]) map[dateString] = [];
                if (!occupiedPositions[dateString]) occupiedPositions[dateString] = new Set();

                map[dateString].push({
                    trip,
                    color,
                    position,
                    isStart: isSameDay(date, start),
                    isEnd: isSameDay(date, end),
                });
                occupiedPositions[dateString].add(position);
            });
        });

        return map;
    }, [trips]);


    const handleDayPress = (day: DateData) => {
        try {
            if (!day || !day.dateString) return;
            setSelectedDate(day.dateString);

            // Find which trip and day this date belongs to
            let foundTrip: Trip | undefined;
            let foundDay: Day | undefined;

            if (Array.isArray(trips)) {
                for (const trip of trips) {
                    if (!trip || !trip.days) continue;
                    const d = trip.days.find(d => d.date === day.dateString);
                    if (d) {
                        foundTrip = trip;
                        foundDay = d;
                        break;
                    }
                }
            }

            if (foundTrip && foundDay) {
                setSelectedTripId(foundTrip.id);
                setSelectedDay(foundDay);
                setIsDayModalVisible(true);
            }
        } catch (e) {
            console.error('Error in handleDayPress:', e);
        }
    };

    const handleAddSchedule = async (title: string, time: string, description: string, color: string, endTime?: string) => {
        try {
            if (selectedTripId && selectedDay) {
                await addScheduleItem(selectedTripId, selectedDay.id, {
                    title,
                    time, // HH:mm
                    endTime, // [코다리 부장] 종료 시간 추가!
                    description,
                    color
                });
            }
        } catch (e) {
            console.error('Error adding schedule item:', e);
        }
    };

    // [코다리] Custom Day Component 🎨
    const renderDay = ({ date, state }: { date: DateData, state: string }) => {
        const dateString = date.dateString;
        const dayTrips = dayTripMap[dateString] || [];
        const isSelected = selectedDate === dateString;
        const isToday = state === 'today';
        const isDisabled = state === 'disabled';

        return (
            <TouchableOpacity
                style={[styles.dayContainer, { height: 50, width: '100%' }]} // 높이 고정
                onPress={() => handleDayPress(date)}
                activeOpacity={0.7}
            >
                {/* 선택 표시 (원) */}
                {isSelected && (
                    <View style={styles.selectedIndicator} />
                )}

                {/* 날짜 텍스트 */}
                <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isSelected && styles.selectedDayText,
                    isDisabled && styles.disabledText
                ]}>
                    {date.day}
                </Text>

                {/* 여행 띠 (Stacked Lines) */}
                <View style={styles.tripsContainer}>
                    {dayTrips.map((info, idx) => (
                        <View
                            key={`${info.trip.id}-${info.position}`} // Unique key for each line
                            style={[
                                styles.tripLine,
                                {
                                    backgroundColor: info.color,
                                    // position에 따라 높이 조절 (0층이 가장 아래)
                                    bottom: info.position * 6, // 간격 6px
                                    left: info.isStart ? 4 : 0, // 시작일은 약간 띄움
                                    right: info.isEnd ? 4 : 0, // 종료일도 띄움
                                    // 세로줄 스타일 (시작/끝)
                                    borderTopLeftRadius: info.isStart ? 0 : 0,
                                    borderBottomLeftRadius: info.isStart ? 0 : 0,
                                }
                            ]}
                        >
                            {/* 시작일 수직선 */}
                            {info.isStart && (
                                <View style={[styles.verticalBar, { backgroundColor: info.color, left: -4 }]} />
                            )}
                            {/* 종료일 수직선 */}
                            {info.isEnd && (
                                <View style={[styles.verticalBar, { backgroundColor: info.color, right: -4 }]} />
                            )}
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        );
    };

    // [코다리] 여행 카드 렌더링 (하단 리스트용)
    const renderTripCard = ({ item }: { item: Trip }) => {
        const coverImage = item.coverImageUri ? { uri: item.coverImageUri } : null;

        return (
            <TouchableOpacity
                style={styles.tripCard}
                onPress={() => {
                    // 달력 이동 및 날짜 선택
                    setCurrentMonth(item.startDate);
                    setSelectedDate(item.startDate);
                }}
            >
                {coverImage ? (
                    <Image source={coverImage} style={styles.cardCover} resizeMode="cover" />
                ) : (
                    <LinearGradient
                        colors={['#FF9A56', '#FFD4A3']}
                        style={styles.cardCover}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}
                <View style={styles.cardOverlay} />
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.startDate} ~ {item.endDate}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>일정표</Text>
            </View>

            <View style={styles.content}>
                <Calendar
                    key={currentMonth} // [코다리] month가 바뀌면 강제 리렌더링 (Calendar 버그 방지)
                    current={currentMonth}
                    onDayPress={handleDayPress}
                    dayComponent={renderDay} // [코다리] 커스텀 렌더링 적용!
                    monthFormat={'yyyy년 M월'}
                    theme={{
                        // 기본 테마는 커스텀 컴포넌트 사용 시 일부 무시될 수 있음
                        todayTextColor: Colors.primary,
                        arrowColor: Colors.primary,
                        textMonthFontWeight: 'bold',
                        textMonthFontSize: 18,
                    }}
                    enableSwipeMonths={true}
                />

                <View style={styles.listSection}>
                    <Text style={styles.listTitle}>내 여행 일정</Text>
                    {trips.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>등록된 여행이 없습니다.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={trips}
                            renderItem={renderTripCard}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            </View>

            {/* Modals */}
            {selectedDay && selectedTripId && (
                <DayScheduleModal
                    visible={isDayModalVisible}
                    onClose={() => setIsDayModalVisible(false)}
                    currentDay={selectedDay}
                    days={trips.find(t => t.id === selectedTripId)?.days || []}
                    tripId={selectedTripId}
                    onAddSchedule={() => setIsAddModalVisible(true)}
                    onDaySelect={(day) => setSelectedDay(day)}
                />
            )}

            <AddScheduleModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onSave={handleAddSchedule}
            />

        </View>
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
        padding: Layout.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        marginRight: Layout.spacing.m,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    listSection: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: Colors.background,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 12,
        paddingHorizontal: Layout.spacing.l,
    },
    listContent: {
        paddingHorizontal: Layout.spacing.l,
        paddingBottom: 20,
    },
    tripCard: {
        width: 160,
        height: 100,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
        ...Shadows.small,
    },
    cardCover: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    cardTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    cardDate: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    // [코다리] Custom Day Component Styles
    dayContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 4,
    },
    dayText: {
        textAlign: 'center',
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '500',
        marginBottom: 2,
    },
    todayText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        opacity: 0.15, // 은은한 배경
    },
    selectedDayText: {
        color: Colors.primary,
        fontWeight: '900',
    },
    disabledText: {
        color: '#d9e1e8',
    },
    tripsContainer: {
        width: '100%',
        height: 20, // 띠 영역 높이
        marginTop: 2,
    },
    tripLine: {
        position: 'absolute',
        height: 4,
        width: '100%',
    },
    verticalBar: {
        position: 'absolute',
        top: -2, // 위로 살짝 튀어나옴
        bottom: -2, // 아래로 살짝 튀어나옴
        width: 4,
        borderRadius: 2,
    }
});
