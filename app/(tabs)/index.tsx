import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar, Animated, Easing } from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useTripStore } from '@/store/tripStore';
import { AddTripModal } from '@/components/AddTripModal';
import { EditTripModal } from '@/components/EditTripModal';
import { ActionSheet } from '@/components/ActionSheet';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { Trip } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Layout } from '@/lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/components/AlertProvider';

export default function TripsScreen() {
    const navigation = useNavigation();
    const { trips, isLoading, loadTrips, addTrip, deleteTrip, updateTripDates } = useTripStore();
    const { openSideMenu } = useUIStore(); // [코다리 부장] 전역 스토어 사용!
    const { showAlert } = useAlert();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    // const [isSideMenuVisible, setIsSideMenuVisible] = useState(false); // 로컬 상태 제거

    // [코다리 부장] 헤더에 햄버거 메뉴 버튼 추가! 🍔 (왼쪽 상단)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={openSideMenu} style={{ marginLeft: 16 }}>
                    <Ionicons name="menu" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, openSideMenu]);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            loadTrips();
        }, [loadTrips])
    );

    useEffect(() => {
        if (!isLoading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start();
        }
    }, [isLoading, fadeAnim]);

    const handleAddTrip = async (title: string, startDate: string, endDate: string) => {
        await addTrip(title, startDate, endDate);
    };

    const handleLongPress = (trip: Trip) => {
        setSelectedTrip(trip);
        setIsMenuVisible(true);
    };

    // const handleDeleteTrip = ... (삭제됨: ActionSheet에서 직접 처리)

    const handleUpdateTrip = async (title: string, startDate: string, endDate: string) => {
        if (selectedTrip) {
            await updateTripDates(selectedTrip.id, title, startDate, endDate);
            setIsEditModalVisible(false);
        }
    };

    // [코다리 부장] 커버 이미지: 사용자 선택 우선, 없으면 그라데이션!
    const getCoverImage = (trip: Trip) => {
        // 사용자가 선택한 배경 이미지 우선
        if (trip.coverImageUri) {
            return { uri: trip.coverImageUri };
        }
        // 선택 안 했으면 null (그라데이션 표시)
        return null;
    };

    const renderTripCard = ({ item, index }: { item: Trip, index: number }) => {
        const coverImage = getCoverImage(item);

        // Individual card animation (staggered effect workaround)
        // Since FlatList renders items lazily, complex staggered animations are tricky.
        // We'll use a simple fade-in based on index delay if we were using a list of Animated.Views,
        // but sticking to a simple global fade or just item fade is safer for now.
        // Let's make each item fade in on mount.

        return (
            <FadeInView delay={index * 100}>
                <TouchableOpacity
                    style={styles.cardContainer}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/trip/${item.id}`)}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={500}
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

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)']}
                        style={styles.cardGradient}
                    />

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.days.length}일간</Text>
                            </View>
                        </View>

                        <View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDate}>{item.startDate} — {item.endDate}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </FadeInView>
        );
    };

    if (isLoading && trips.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />



            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>여행 자료를 관리해볼까요?</Text>
                    <Text style={styles.headerTitle}>나의 여행</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {trips.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <FadeInView>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="airplane" size={48} color={Colors.primary} />
                        </View>
                    </FadeInView>
                    <Text style={styles.emptyTitle}>아직 여행이 없습니다</Text>
                    <Text style={styles.emptySubtitle}>
                        새로운 여행 계획을 추가해보세요.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Text style={styles.emptyButtonText}>새 여행 만들기</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTripCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <AddTripModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onAdd={handleAddTrip}
            />

            <EditTripModal
                visible={isEditModalVisible}
                trip={selectedTrip}
                onClose={() => setIsEditModalVisible(false)}
                onUpdate={handleUpdateTrip}
            />

            {/* [코다리 부장] 커스텀 액션 시트 추가! (우아하게~) */}
            <ActionSheet
                visible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
                title={`'${selectedTrip?.title}' 여행 관리`}
                actions={[
                    {
                        id: 'edit',
                        label: '여행 수정',
                        icon: 'create-outline',
                        onPress: () => {
                            // setIsMenuVisible(false); // ActionSheet 내부에서 처리됨
                            setIsEditModalVisible(true);
                        }
                    },
                    {
                        id: 'delete',
                        label: '여행 삭제',
                        icon: 'trash-outline',
                        isDestructive: true,
                        onPress: () => {
                            // [코다리 부장] 삭제 전 한 번 더 물어보기 (실수 방지!)
                            showAlert(
                                '여행 삭제',
                                `'${selectedTrip?.title}' 여행을 정말 삭제하시겠습니까?`,
                                [
                                    { text: '취소', style: 'cancel' },
                                    {
                                        text: '삭제',
                                        style: 'destructive',
                                        onPress: async () => {
                                            if (selectedTrip) {
                                                await deleteTrip(selectedTrip.id);
                                            }
                                        }
                                    }
                                ]
                            );
                        }
                    }
                ]}
            />
        </SafeAreaView>
    );
}

// Simple FadeIn Component using standard Animated
const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            })
        ]).start();
    }, [delay, fadeAnim, translateY]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.l,
        paddingVertical: Layout.spacing.m,
        marginBottom: Layout.spacing.s,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    listContainer: {
        paddingHorizontal: Layout.spacing.l,
        paddingBottom: 100,
    },
    cardContainer: {
        height: 220,
        backgroundColor: Colors.surface,
        borderRadius: Layout.radius.l,
        marginBottom: Layout.spacing.l,
        overflow: 'hidden',
        ...Shadows.medium,
    },
    cardCover: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        padding: Layout.spacing.l,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    cardDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.xxl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Layout.spacing.l,
        ...Shadows.medium,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Layout.spacing.xs,
    },
    emptySubtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Layout.spacing.xl,
        lineHeight: 22,
    },
    emptyButton: {
        paddingHorizontal: Layout.spacing.xl,
        paddingVertical: 14,
        backgroundColor: Colors.primary,
        borderRadius: Layout.radius.m,
        ...Shadows.small,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },

});
