import 'react-native-url-polyfill/auto';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { checkForAppUpdates } from '@/lib/updateChecker';

/**
 * 루트 레이아웃
 * 전체 앱의 최상위 레이아웃 컴포넌트
 */
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

/**
 * 루트 레이아웃
 * 전체 앱의 최상위 레이아웃 컴포넌트
 */
export default function RootLayout() {
    // 앱 시작 시 업데이트 확인
    useEffect(() => {
        console.log('Update checker initialized'); // Update trigger v1
        checkForAppUpdates();
    }, []);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <Slot />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
