import 'react-native-url-polyfill/auto';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { checkForAppUpdates } from '@/lib/updateChecker';
import { SideMenu } from '@/components/SideMenu';
import { useUIStore } from '@/store/uiStore';
import { Colors } from '@/lib/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AlertProvider, useAlert } from '@/components/AlertProvider';

function AppContent() {
    const { isSideMenuVisible, closeSideMenu } = useUIStore();
    const { showAlert } = useAlert();

    useEffect(() => {
        console.log('Update checker initialized');
        checkForAppUpdates(showAlert);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <StatusBar style="dark" />
            <Slot />
            <SideMenu
                visible={isSideMenuVisible}
                onClose={closeSideMenu}
            />
        </SafeAreaView>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AlertProvider>
                <AppContent />
            </AlertProvider>
        </SafeAreaProvider>
    );
}
