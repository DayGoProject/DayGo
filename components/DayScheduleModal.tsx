import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { Day, ScheduleItem } from '@/types';
import { ScheduleTimeline } from './ScheduleTimeline';
import { useTripStore } from '@/store/tripStore';
import { useAlert } from '@/components/AlertProvider'; // Using the new global alert!

interface DayScheduleModalProps {
    visible: boolean;
    onClose: () => void;
    currentDay: Day;
    days: Day[];
    tripId: string;
    onAddSchedule: () => void;
    onDaySelect: (day: Day) => void;
}

export function DayScheduleModal({ visible, onClose, currentDay, days, tripId, onAddSchedule, onDaySelect }: DayScheduleModalProps) {
    const { deleteScheduleItem } = useTripStore();
    const { showAlert } = useAlert();

    const schedules = currentDay?.schedules || [];

    const handleDelete = (item: ScheduleItem) => {
        showAlert(
            "일정 삭제",
            `'${item.title}' 일정을 삭제하시겠습니까?`,
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        await deleteScheduleItem(tripId, currentDay.id, item.id);
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {!currentDay ? (
                    <View style={styles.emptyState}>
                        <Text>잘못된 데이터입니다.</Text>
                        <TouchableOpacity onPress={onClose}><Text>닫기</Text></TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>{currentDay.date}</Text>
                                <Text style={styles.headerSubtitle}>Day {currentDay.dayNumber}</Text>
                            </View>
                            <View style={{ width: 32 }} />
                        </View>

                        {/* Day Selector */}
                        <View style={styles.daySelectorContainer}>
                            <FlatList
                                data={days}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.daySelectorContent}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.dayChip,
                                            item.id === currentDay.id && styles.dayChipActive
                                        ]}
                                        onPress={() => onDaySelect(item)}
                                    >
                                        <Text style={[
                                            styles.dayChipText,
                                            item.id === currentDay.id && styles.dayChipTextActive
                                        ]}>
                                            Day {item.dayNumber}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <ScrollView style={styles.content}>
                            {/* New Timeline View */}
                            <ScheduleTimeline
                                schedules={schedules}
                                onItemPress={(item) => handleDelete(item)}
                            />
                        </ScrollView>

                        {/* Floating Add Button */}
                        <TouchableOpacity style={styles.fab} onPress={onAddSchedule}>
                            <Ionicons name="add" size={30} color="white" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Modal>
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
    closeButton: {
        padding: 4,
    },
    addButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginTop: 12, // [코다리] 텍스트 확실하게 아래로
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    daySelectorContainer: {
        height: 50,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    daySelectorContent: {
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.m,
    },
    dayChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
    },
    dayChipActive: {
        backgroundColor: Colors.primary,
    },
    dayChipText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    dayChipTextActive: {
        color: 'white',
    },
    content: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
});
