import { AuthError } from 'firebase/auth';

/**
 * Firebase Auth 에러 코드를 한글 메시지로 변환합니다.
 * @param error Firebase Auth 에러 객체
 * @returns 한글 에러 메시지
 */
export const getAuthErrorMessage = (error: any): string => {
    const errorCode = error.code || '';

    switch (errorCode) {
        case 'auth/invalid-email':
            return '올바르지 않은 이메일 형식입니다.';
        case 'auth/user-disabled':
            return '해당 계정은 비활성화되었습니다.';
        case 'auth/user-not-found':
            return '등록되지 않은 이메일입니다.';
        case 'auth/wrong-password':
            return '비밀번호가 틀렸거나 올바르지 않은 계정입니다.';
        case 'auth/email-already-in-use':
            return '이미 사용 중인 이메일입니다.';
        case 'auth/weak-password':
            return '비밀번호는 최소 6자 이상이어야 합니다.';
        case 'auth/network-request-failed':
            return '네트워크 연결이 원활하지 않습니다.';
        case 'auth/too-many-requests':
            return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해 주세요.';
        case 'auth/invalid-login-credentials':
            return '아이디 또는 비밀번호가 일치하지 않습니다.';
        default:
            return '인증 처리 중 오류가 발생했습니다. (' + errorCode + ')';
    }
};
