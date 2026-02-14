import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScheduleItem } from '@/types';
import { Colors, Shadows, Layout } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface ScheduleTimelineProps {
    schedules: ScheduleItem[];
    onItemPress: (item: ScheduleItem) => void;
}

export function ScheduleTimeline({ schedules, onItemPress }: ScheduleTimelineProps) {
    // Sort items by time
    const currentItems = useMemo(() => {
        try {
            if (!Array.isArray(schedules)) return [];
            return schedules.filter(item => {
                if (!item || typeof item.time !== 'string' || !item.time.includes(':')) return false;
                return true;
            }).sort((a, b) => a.time.localeCompare(b.time));
        } catch (e) {
            console.error('Error filtering schedules:', e);
            return [];
        }
    }, [schedules]);

    if (currentItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={Colors.border} />
                <Text style={styles.emptyText}>
                    등록된 일정이 없습니다.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {currentItems.map((item, index) => {
                const isLast = index === currentItems.length - 1;
                return (
                    <View key={item.id} style={styles.row}>
                        {/* Time Column */}
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{item.time}</Text>
                            {item.endTime && (
                                <Text style={styles.endTimeText}>{item.endTime}</Text>
                            )}
                        </View>

                        {/* Timeline Column */}
                        <View style={styles.lineWrapper}>
                            <View style={[styles.dot, { backgroundColor: item.color || Colors.primary }]} />
                            {!isLast && <View style={styles.line} />}
                        </View>

                        {/* Content Column */}
                        <TouchableOpacity
                            style={styles.cardContainer}
                            // onPress={() => onItemPress(item)} // [코다리] 단순 클릭은 무시 (또는 상세 보기로 확장 가능)
                            onLongPress={() => onItemPress(item)} // [코다리] 길게 눌러서 삭제
                            delayLongPress={500}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.card, { borderLeftColor: item.color || Colors.primary }]}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                {item.description && (
                                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        opacity: 0.6,
    },
    emptyText: {
        marginTop: 10,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4, // Space handled by minHeight or padding
        minHeight: 80,
    },
    timeContainer: {
        width: 50,
        alignItems: 'flex-end',
        paddingRight: 12,
        paddingTop: 0,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    endTimeText: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    lineWrapper: {
        width: 20,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
        ...Shadows.small,
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.border,
        marginVertical: 4,
    },
    cardContainer: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 4,
        ...Shadows.small,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});
