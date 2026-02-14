import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const TRIP_ASSETS_DIR = FileSystem.documentDirectory + 'trip_assets/';

/**
 * 앱 전용 자산 디렉토리가 존재하는지 확인하고 없으면 생성합니다.
 */
export const ensureDirExists = async () => {
    if (Platform.OS === 'web') return; // 웹에서는 파일 시스템 지원 안 함
    const dirInfo = await FileSystem.getInfoAsync(TRIP_ASSETS_DIR);
    if (!dirInfo.exists) {
        console.log("Trip directory doesn't exist, creating...");
        await FileSystem.makeDirectoryAsync(TRIP_ASSETS_DIR, { intermediates: true });
    }
};

/**
 * 선택한 파일을 앱의 로컬 저장소로 복사합니다.
 * @param uri 원본 파일의 URI
 * @param fileName 저장할 파일 이름 (확장자 포함)
 * @returns 저장된 파일의 로컬 URI
 */
export const saveFileToLocal = async (uri: string, fileName: string): Promise<string> => {
    if (Platform.OS === 'web') return uri; // 웹에서는 복사 없이 원본 URI 사용

    await ensureDirExists();
    const destPath = TRIP_ASSETS_DIR + fileName;

    try {
        await FileSystem.copyAsync({
            from: uri,
            to: destPath,
        });
        return destPath;
    } catch (error) {
        console.error('파일 저장 실패:', error);
        throw error;
    }
};

/**
 * 파일 확장자를 추출합니다.
 */
export const getFileExtension = (uri: string): string => {
    return uri.split('.').pop() || '';
};

/**
 * 고유한 파일 이름을 생성합니다.
 */
export const generateFileName = (originalUri: string): string => {
    const ext = getFileExtension(originalUri);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `asset_${timestamp}_${random}.${ext}`;
};
/**
 * 파일 확장자에 따른 MIME 타입을 반환합니다.
 */
export const getMimeType = (uri: string): string => {
    const ext = getFileExtension(uri).toLowerCase();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'txt': return 'text/plain';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'zip': return 'application/zip';
        case 'mp3': return 'audio/mpeg';
        case 'mp4': return 'video/mp4';
        default: return '*/*'; // 기본값: 모든 파일
    }
};
