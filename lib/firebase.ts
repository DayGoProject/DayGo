import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth, Auth } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Firebase 콘솔에서 발급받은 실제 설정값으로 교체해 주세요.
const firebaseConfig = {
    apiKey: "AIzaSyB4GUXNNd_WeSmyaUUnpHhgf4mupYi0_vI",
    authDomain: "daygo-cb129.firebaseapp.com",
    projectId: "daygo-cb129",
    storageBucket: "daygo-cb129.firebasestorage.app",
    messagingSenderId: "131878944867",
    appId: "1:131878944867:web:d5d384bb699b07951af856",
    measurementId: "G-G0D3N9704K"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화 (React Native 환경에서 자동 로그인을 위해 AsyncStorage 사용)
const auth: Auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { auth };
export default app;
