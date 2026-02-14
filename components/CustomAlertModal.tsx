import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, Shadows, Layout } from '@/lib/theme';

interface CustomAlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    primaryButtonText: string;
    secondaryButtonText?: string;
    onPrimaryPress: () => void;
    onSecondaryPress?: () => void;
    onClose?: () => void; // Optional close handler for backdrop press
    primaryButtonColor?: string; // Default to primary color, can be error color
}

export function CustomAlertModal({
    visible,
    title,
    message,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryPress,
    onSecondaryPress,
    onClose,
    primaryButtonColor = Colors.primary
}: CustomAlertModalProps) {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose || onSecondaryPress || (() => { })}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {secondaryButtonText && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonCancel]}
                                onPress={onSecondaryPress}
                            >
                                <Text style={styles.buttonCancelText}>{secondaryButtonText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonConfirm,
                                { backgroundColor: primaryButtonColor }
                            ]}
                            onPress={onPrimaryPress}
                        >
                            <Text style={styles.buttonConfirmText}>{primaryButtonText}</Text>
                        </TouchableOpacity>
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
        width: '85%',
        maxWidth: 320,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        ...Shadows.medium,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    buttonCancel: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    buttonConfirm: {
        // backgroundColor set via prop
    },
    buttonCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    buttonConfirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
