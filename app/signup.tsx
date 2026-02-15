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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { getAuthErrorMessage } from '@/lib/auth-utils';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();
    const { setUser } = useAuthStore();

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
            setUser(userCredential.user);
            router.replace('/(tabs)');
        } catch (error: any) {
            // [코다리 부장] 터미널 로그를 삭제하여 깔끔하게 만들었습니다! 🧹
            const message = getAuthErrorMessage(error);
            Alert.alert('회원가입 실패', message);
        }
    };

    const handleSocialSignup = async (provider: string) => {
        // [코다리 부장] 소셜 회원가입도 로그인과 동일한 '알멩이'를 사용합니다!
        Alert.alert('알림', `${provider === 'kakao' ? '카카오' : provider === 'naver' ? '네이버' : '애플/구글'} 로그인은 설정이 필요합니다. 곧 연동 가이드를 드릴게요!`);
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

                        <Text style={styles.socialLabel}>간편 회원가입</Text>

                        <View style={styles.socialGroup}>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#FEE500' }]}
                                onPress={() => handleSocialSignup('kakao')}
                            >
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3669/3669973.png' }}
                                    style={{ width: 24, height: 24 }}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#03C75A' }]}
                                onPress={() => handleSocialSignup('naver')}
                            >
                                <Text style={[styles.socialIconText, { color: '#FFF' }]}>N</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialIcon, { backgroundColor: '#000000' }]}
                                onPress={() => handleSocialSignup('apple')}
                            >
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
                                    style={{ width: 22, height: 22, tintColor: '#FFF' }}
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
