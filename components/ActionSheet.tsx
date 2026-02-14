import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout } from '@/lib/theme';

const { width } = Dimensions.get('window');

export interface ActionItem {
    id: string;
    label: string;
    icon?: string;
    color?: string; // 기본값: textPrimary
    onPress: () => void;
    isDestructive?: boolean;
}

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    actions: ActionItem[];
}

export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
    const slideAnim = useRef(new Animated.Value(300)).current; // 아래에서 시작
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="none"
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.background, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.sheetContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {title && <Text style={styles.title}>{title}</Text>}

                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={action.id}
                            style={[
                                styles.actionButton,
                                index === actions.length - 1 && styles.lastButton
                            ]}
                            onPress={() => {
                                onClose();
                                // 애니메이션 시간 고려하여 약간의 지연 후 실행? 
                                // 아니요, 바로 실행이 더 빠릿함. 필요시 setTimeout은 호출측에서.
                                requestAnimationFrame(action.onPress);
                            }}
                        >
                            {action.icon && (
                                <Ionicons
                                    name={action.icon as any}
                                    size={24}
                                    color={action.isDestructive ? Colors.error : (action.color || Colors.textSecondary)}
                                    style={styles.icon}
                                />
                            )}
                            <Text style={[
                                styles.actionLabel,
                                action.isDestructive && styles.destructiveLabel,
                                action.color ? { color: action.color } : {}
                            ]}>
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelLabel}>취소</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40, // 홈 인디케이터 여유 공간
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    lastButton: {
        borderBottomWidth: 0,
    },
    icon: {
        marginRight: 16,
    },
    actionLabel: {
        fontSize: 18,
        color: Colors.textPrimary,
    },
    destructiveLabel: {
        color: Colors.error,
    },
    cancelButton: {
        marginTop: 10,
        paddingVertical: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },
});
