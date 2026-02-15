import 'react-native-url-polyfill/auto';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { checkForAppUpdates } from '@/lib/updateChecker';
import { SideMenu } from '@/components/SideMenu';
import { useUIStore } from '@/store/uiStore';
import { Colors } from '@/lib/theme';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AlertProvider, useAlert } from '@/components/AlertProvider';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';

function AppContent() {
    const { isSideMenuVisible, closeSideMenu } = useUIStore();
    const { showAlert } = useAlert();
    const { user, setUser, isLoading, setIsLoading } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    // 1. 앱 업데이트 확인
    useEffect(() => {
        checkForAppUpdates(showAlert);
    }, []);

    // 2. Firebase 인증 상태 감시
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    // 3. 인증 가드 (Authentication Guard)
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

        if (!user && !inAuthGroup) {
            // 로그인되지 않았는데 보호된 페이지에 있다면 회원가입 화면으로 🏔️
            router.replace('/signup');
        } else if (user && !user.emailVerified && !inAuthGroup) {
            // 로그인되었으나 이메일 인증이 안 된 경우 로그인 화면으로 유도 (알림은 전용 화면에서 담당 가능)
            router.replace('/login');
        } else if (user && user.emailVerified && inAuthGroup) {
            // 로그인과 인증이 모두 완료된 경우에만 메인으로
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

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
