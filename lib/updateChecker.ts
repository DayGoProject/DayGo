import * as Updates from 'expo-updates';
import { AlertButton } from '@/components/AlertProvider';

/**
 * 앱 업데이트 확인 및 사용자 선택 기능
 */
export async function checkForAppUpdates(showAlert: (title: string, message: string, buttons?: AlertButton[]) => void) {
    try {
        // 개발 모드에서는 업데이트 확인 안 함
        if (__DEV__) {
            return;
        }

        // 업데이트 확인
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
            // 사용자에게 업데이트 여부 물어보기
            showAlert(
                '업데이트 가능',
                '새로운 버전이 있습니다. 지금 업데이트하시겠습니까?',
                [
                    {
                        text: '나중에',
                        style: 'cancel',
                        onPress: () => console.log('업데이트 취소됨'),
                    },
                    {
                        text: '업데이트',
                        onPress: async () => {
                            try {
                                // 업데이트 다운로드
                                await Updates.fetchUpdateAsync();

                                // 앱 재시작하여 업데이트 적용
                                showAlert(
                                    '업데이트 완료',
                                    '업데이트가 완료되었습니다. 앱을 다시 시작합니다.',
                                    [
                                        {
                                            text: '확인',
                                            onPress: async () => {
                                                await Updates.reloadAsync();
                                            },
                                        },
                                    ]
                                );
                            } catch (error) {
                                console.error('업데이트 실패:', error);
                                showAlert(
                                    '업데이트 실패',
                                    '업데이트 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
                                );
                            }
                        },
                    },
                ]
            );
        } else {
            console.log('최신 버전입니다.');
        }
    } catch (error) {
        console.error('업데이트 확인 실패:', error);
    }
}
