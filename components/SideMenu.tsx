import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, SafeAreaView, TouchableWithoutFeedback, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.7; // 화면 너비의 70%

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // [코다리 부장] 메뉴 아이템별 애니메이션 값 생성! (쫀득한 등장을 위해) 🍡
    const itemAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
    const router = useRouter();

    useEffect(() => {
        if (visible) {
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
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    const menuItems = [
        { id: 'profile', icon: 'person-outline', label: '내 프로필 (준비중)' },
        { id: 'notice', icon: 'megaphone-outline', label: '공지사항 (준비중)' },
        { id: 'settings', icon: 'settings-outline', label: '설정', action: () => { onClose(); router.push('/(tabs)/settings'); } },
        { id: 'version', icon: 'information-circle-outline', label: '앱 버전 v1.0.0' },
    ];

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
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
                    <SafeAreaView style={styles.menuContent}>
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
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
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
