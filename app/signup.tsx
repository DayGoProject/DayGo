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
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { getAuthErrorMessage } from '@/lib/auth-utils';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();
    const { setUser } = useAuthStore();

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '131878944867-n3s5j10pb5vok8qulhkha134ubtjf013.apps.googleusercontent.com',
        iosClientId: '131878944867-ugk3c9p2i0djhidicvabbc1vr5ds802t.apps.googleusercontent.com',
        androidClientId: '131878944867-l3vv8rdpb014r4qc20sr4eoatjc4j7aa.apps.googleusercontent.com',
        redirectUri: 'https://auth.expo.io/@ktnote/daygo',
    });

    useEffect(() => {
        if (request?.redirectUri) {
            console.log('[DayGo Debug] Final Signup Approved URI:', request.redirectUri);
        }
    }, [request]);

    // 구글 로그인/가입 결과 감시
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);

            signInWithCredential(auth, credential)
                .then((userCredential) => {
                    setUser(userCredential.user);
                    router.replace('/(tabs)');
                })
                .catch((error) => {
                    const message = getAuthErrorMessage(error);
                    Alert.alert('구글 가입 오류', message);
                });
        }
    }, [response]);

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('알림', '모든 정보를 입력해 주세요.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // [코다리 부장] 가짜 계정 방지를 위해 인증 메일을 즉시 보냅니다! 📧🛡️
            await sendEmailVerification(userCredential.user);

            Alert.alert(
                '인증 메일 발송',
                '입력하신 이메일로 인증 링크를 보냈습니다. 이메일을 확인한 후 로그인해 주세요!',
                [{ text: '확인', onPress: () => router.replace('/login') }]
            );
        } catch (error: any) {
            // [코다리 부장] 터미널 로그를 삭제하여 깔끔하게 만들었습니다! 🧹
            const message = getAuthErrorMessage(error);
            Alert.alert('회원가입 실패', message);
        }
    };

    const handleSocialSignup = async (provider: 'google') => {
        // [코다리 부장] 이제 진짜 '구글 엔진'이 가동됩니다! 🚀🇬
        if (provider === 'google') {
            try {
                await promptAsync();
            } catch (error: any) {
                Alert.alert('가입 오류', '구글 가입창을 열 수 없습니다.');
            }
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.backgroundImage}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>DayGo</Text>
                        <Text style={styles.headerSubtitle}>영남알프스 9봉 완등 시스템{"\n"}지금 바로 시작하세요</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>회원가입</Text>

                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                placeholder="이메일 주소"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#999"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호 (6자 이상)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호 확인"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholderTextColor="#999"
                            />
                        </View>

                        <TouchableOpacity style={styles.mainButton} onPress={handleSignup} activeOpacity={0.8}>
                            <Text style={styles.mainButtonText}>가입하기</Text>
                        </TouchableOpacity>

                        <Text style={styles.socialLabel}>Google 계정으로 시작하기</Text>

                        <View style={styles.socialGroup}>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD' }]}
                                onPress={() => handleSocialSignup('google')}
                            >
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                                    style={{ width: 24, height: 24 }}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/login')}>
                            <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
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
        backgroundColor: 'rgba(0,0,0,0.3)',
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
    card: {
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
        marginBottom: 25,
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
    mainButton: {
        height: 55,
        backgroundColor: '#FF8C00',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    mainButtonText: {
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
    linkButton: {
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: '#333333',
        textDecorationLine: 'underline',
    },
});
