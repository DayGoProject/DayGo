import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.7; // 화면 너비의 70%

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
    const [shouldRender, setShouldRender] = useState(visible);
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // [코다리 부장] 메뉴 아이템별 애니메이션 값 생성! (쫀득한 등장을 위해) 🍡
    const itemAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current; // Items count increased
    const router = useRouter();

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            // 열기 애니메이션: 배경 -> 메뉴 슬라이드 -> 아이템들이 타다닥!
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.cubic),
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0.5,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                // 아이템 Stagger 애니메이션 (0.05초 간격으로 불투명도 & 위치 이동)
                Animated.stagger(50, itemAnims.map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 40
                    })
                ))
            ]).start();
        } else {
            // 닫기 애니메이션: 역순으로 빠르게 정리
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                // 아이템들도 초기화
                ...itemAnims.map(anim =>
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true
                    })
                )
            ]).start(() => {
                setShouldRender(false);
            });
        }
    }, [visible]);

    if (!shouldRender) return null;

    const handleNavigation = (path: string) => {
        onClose();
        // [코다리 부장] 메뉴 닫히는 시간(250ms)보다 조금 여유있게 이동!
        setTimeout(() => {
            router.push(path as any);
        }, 300);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onClose();
            // RootLayout의 Guard가 자동으로 /login으로 보낼 것입니다.
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const menuItems = [
        { id: 'profile', icon: 'person-outline', label: '내 프로필 (준비중)' },
        {
            id: 'expenses',
            icon: 'calculator-outline',
            label: '경비 계산기',
            action: () => handleNavigation('/expenses')
        },
        {
            id: 'itinerary',
            icon: 'map-outline',
            label: '일정표',
            action: () => handleNavigation('/itinerary')
        },
        // { id: 'notice', icon: 'megaphone-outline', label: '공지사항 (준비중)' },
        {
            id: 'settings',
            icon: 'settings-outline',
            label: '설정',
            action: () => handleNavigation('/(tabs)/settings')
        },
        {
            id: 'logout',
            icon: 'log-out-outline',
            label: '로그아웃',
            action: handleLogout
        },
        { id: 'version', icon: 'information-circle-outline', label: '앱 버전 v1.0.1' },
    ];

    return (
        <View style={[styles.container, StyleSheet.absoluteFill]}>
            {/* 배경 오버레이 (클릭 시 닫힘) */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            {/* 슬라이딩 메뉴 */}
            <Animated.View
                style={[
                    styles.menuContainer,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <SafeAreaView style={styles.menuContent} edges={['top', 'bottom']}>
                    {/* 메뉴 헤더 */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Daygo</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* 메뉴 목록 */}
                    <View style={styles.menuList}>
                        {menuItems.map((item, index) => (
                            <Animated.View
                                key={index}
                                style={{
                                    opacity: itemAnims[index],
                                    transform: [{
                                        translateX: itemAnims[index].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-50, 0] // 왼쪽에서 스르륵 들어오는 효과
                                        })
                                    }]
                                }}
                            >
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={item.action}
                                >
                                    <Ionicons name={item.icon as any} size={24} color="#666" style={styles.menuIcon} />
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>

                    {/* 하단 푸터 */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2026 Daygo Travel</Text>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
        elevation: 10, // Android elevation
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundColor: 'black',
    },
    menuContainer: {
        width: MENU_WIDTH,
        height: '100%',
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuContent: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF9A56', // 브랜드 컬러
    },
    closeButton: {
        padding: 5,
    },
    menuList: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 16,
        color: '#333',
    },
    footer: {
        marginTop: 'auto',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});
