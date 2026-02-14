import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlertModal } from '@/components/CustomAlertModal';
import { Colors } from '@/lib/theme';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextType {
    showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [buttons, setButtons] = useState<AlertButton[]>([]);

    // Helper state for CustomAlertModal props
    const [primaryButtonText, setPrimaryButtonText] = useState('확인');
    const [secondaryButtonText, setSecondaryButtonText] = useState<string | undefined>(undefined);
    const [primaryButtonColor, setPrimaryButtonColor] = useState(Colors.primary);
    const [onPrimaryPress, setOnPrimaryPress] = useState<() => void>(() => { });
    const [onSecondaryPress, setOnSecondaryPress] = useState<(() => void) | undefined>(undefined);

    const showAlert = useCallback((title: string, message: string, buttons: AlertButton[] = [{ text: '확인' }]) => {
        setTitle(title);
        setMessage(message);
        setButtons(buttons);

        // Map generic Alert buttons to CustomAlertModal props (Primary/Secondary)
        // Logic:
        // 1. Find 'cancel' style button -> Secondary
        // 2. Find 'destructive' style button -> Primary (Red)
        // 3. Else -> Primary (Default Color)

        let primaryBtn = buttons.find(b => b.style !== 'cancel');
        let secondaryBtn = buttons.find(b => b.style === 'cancel');

        // If no non-cancel button, take the first one as primary
        if (!primaryBtn && buttons.length > 0) {
            primaryBtn = buttons[0];
            secondaryBtn = undefined;
        }
        // If multiple buttons and no explicit cancel, assume last is primary? 
        // Alert.alert convention on Android: Negative, Neutral, Positive.
        // Let's stick to simple logic: 
        // If 2 buttons: First is usually Cancel/Secondary (in my CustomModal logic), Second is Confirm.
        // BUT Alert.alert usually puts Confirm Last.

        // Let's try to identify by style first.
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        const destructiveBtn = buttons.find(b => b.style === 'destructive');
        const otherBtns = buttons.filter(b => b.style !== 'cancel' && b.style !== 'destructive');

        // Setup Primary
        let targetPrimary = destructiveBtn || otherBtns[otherBtns.length - 1] || cancelBtn; // Fallback

        // Setup Secondary (if exists and is different from primary)
        let targetSecondary = cancelBtn || (buttons.length > 1 ? buttons.find(b => b !== targetPrimary) : undefined);

        if (targetPrimary) {
            setPrimaryButtonText(targetPrimary.text);
            setPrimaryButtonColor(targetPrimary.style === 'destructive' ? Colors.error : Colors.primary);
            setOnPrimaryPress(() => () => {
                targetPrimary?.onPress?.();
                setVisible(false);
            });
        }

        if (targetSecondary && targetSecondary !== targetPrimary) {
            setSecondaryButtonText(targetSecondary.text);
            setOnSecondaryPress(() => () => {
                targetSecondary?.onPress?.();
                setVisible(false);
            });
        } else {
            setSecondaryButtonText(undefined);
            setOnSecondaryPress(undefined);
        }

        setVisible(true);
    }, []);

    const handleClose = () => {
        setVisible(false);
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <CustomAlertModal
                visible={visible}
                title={title}
                message={message}
                primaryButtonText={primaryButtonText}
                secondaryButtonText={secondaryButtonText}
                primaryButtonColor={primaryButtonColor}
                onPrimaryPress={onPrimaryPress}
                onSecondaryPress={onSecondaryPress}
                onClose={handleClose}
            />
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
