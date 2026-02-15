import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { Colors } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { getAuthErrorMessage } from '@/lib/auth-utils';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { setUser } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('알림', '이메일과 비밀번호를 입력해 주세요.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            router.replace('/(tabs)');
        } catch (error: any) {
            // [코다리 부장] 터미널 로그를 삭제하여 깔끔하게 만들었습니다! 🧹
            const message = getAuthErrorMessage(error);
            Alert.alert('로그인 실패', message);
        }
    };

    const handleSocialLogin = async (provider: 'kakao' | 'naver' | 'apple' | 'google') => {
        // [코다리 부장] 소셜 로그인의 '알멩이'를 채우는 중입니다! 🍒
        switch (provider) {
            case 'apple':
                try {
                    const credential = await AppleAuthentication.signInAsync({
                        requestedScopes: [
                            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                            AppleAuthentication.AppleAuthenticationScope.EMAIL,
                        ],
                    });
                    // TODO: Firebase Credential로 변환하여 로그인 처리 (Firebase Console 설정 필요)
                    console.log('Apple Login Success', credential);
                    // Alert.alert('알림', '애플 로그인 성공! (Firebase 연동 대기 중)');
                } catch (e: any) {
                    if (e.code !== 'ERR_CANCELED') {
                        Alert.alert('오류', '애플 로그인 중 문제가 발생했습니다.');
                    }
                }
                break;

            case 'kakao':
            case 'naver':
            case 'google':
                Alert.alert('알림', `${provider === 'kakao' ? '카카오' : provider === 'naver' ? '네이버' : '구글'} 로그인은 각 개발자 센터의 Client ID 설정이 필요합니다. 곧 가이드를 드릴게요!`);
                break;
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' }} // 산악 여행 테마
            style={styles.backgroundImage}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>DayGo</Text>
                        <Text style={styles.headerSubtitle}>영남알프스 9봉 완등 시스템{"\n"}여행의 기록을 시작하세요</Text>
                    </View>

                    <View style={styles.loginCard}>
                        <Text style={styles.cardTitle}>로그인</Text>

                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="아이디(이메일)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotButton}>
                            <Text style={styles.forgotText}>아이디/비밀번호를 잊으셨나요?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
                            <Text style={styles.loginButtonText}>로그인</Text>
                        </TouchableOpacity>

                        <Text style={styles.socialLabel}>다른 계정으로 로그인</Text>

                        <View style={styles.socialGroup}>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#FEE500' }]}
                                onPress={() => handleSocialLogin('kakao')}
                            >
                                {/* 카카오 아이콘 */}
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3669/3669973.png' }}
                                    style={{ width: 24, height: 24 }}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#03C75A' }]}
                                onPress={() => handleSocialLogin('naver')}
                            >
                                {/* 네이버 아이콘 */}
                                <Text style={[styles.socialIconText, { color: '#FFF' }]}>N</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#000000' }]}
                                onPress={() => handleSocialLogin('apple')}
                            >
                                {/* 애플/구글 아이콘 대체 */}
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
                                    style={{ width: 22, height: 22, tintColor: '#FFF' }}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
                            <Text style={styles.signupText}>계정이 없으신가요? 회원가입</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)', // 배경 이미지 가독성 확보
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    header: {
        padding: 30,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    headerSubtitle: {
        fontSize: 18,
        color: '#FFFFFF',
        lineHeight: 26,
    },
    loginCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        paddingBottom: 50,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 20,
    },
    inputGroup: {
        gap: 12,
        marginBottom: 15,
    },
    input: {
        height: 55,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotText: {
        fontSize: 13,
        color: '#999999',
    },
    loginButton: {
        height: 55,
        backgroundColor: '#FF8C00', // 오렌지 색상
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    socialLabel: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666666',
        marginBottom: 20,
    },
    socialGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 30,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialIconText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    signupButton: {
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#333333',
        textDecorationLine: 'underline',
    },
});
