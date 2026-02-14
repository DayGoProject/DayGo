import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Platform, Modal, TextInput, Dimensions, KeyboardAvoidingView, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useTripStore } from '@/store/tripStore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Trip, ContentItem } from '@/types';
import { saveFileToLocal, generateFileName, getMimeType } from '@/lib/fileSystem';
import ContentItemCard from '@/components/ContentItemCard';
import ChecklistTab from '@/components/ChecklistTab';
import { ActionSheet } from '@/components/ActionSheet';
import { Colors, Layout, Shadows } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '@/components/AlertProvider';

const HEADER_HEIGHT = 140; // Fixed reduced height

export default function TripDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { trips, loadTrips, addContentItem, updateContentItem, deleteContentItem, deleteTrip, updateTripDates, setCoverImage, isLoading } = useTripStore(); // [코다리 부장] setCoverImage 추가!
    const { showAlert } = useAlert();

    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [selectedDay, setSelectedDay] = useState(1); // 1~N: Day, -1: Checklist
    const [isUploading, setIsUploading] = useState(false);

    // 이미지 뷰어 상태
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);

    // 이미지 업로드 확인 상태
    const [tempImageUri, setTempImageUri] = useState<string | null>(null);



    // ...

    // 메뉴 모달 상태
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [isAddSheetVisible, setIsAddSheetVisible] = useState(false); // [코다리 부장] 추가 메뉴 시트 상태

    // 날짜 수정 모달 상태
    const [isDateEditVisible, setIsDateEditVisible] = useState(false);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    // [코다리 부장] 배경 선택 상태 (갤러리 선택 + 확인 화면)
    const [tempCoverImageUri, setTempCoverImageUri] = useState<string | null>(null);

    // [코다리 부장] 링크 추가 모달 상태
    const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');

    // Scroll Animation - using standard Animated
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trips.length === 0) {
            loadTrips();
        }
    }, [loadTrips, trips.length]);

    useEffect(() => {
        if (id && trips.length > 0) {
            const foundTrip = trips.find(t => t.id === id);
            if (foundTrip) {
                setCurrentTrip(foundTrip);
                setEditStartDate(foundTrip.startDate);
                setEditEndDate(foundTrip.endDate);
            }
        }
    }, [id, trips]);

    // ... (Keep existing helper functions)
    const handleFileOpen = async (uri: string) => {
        try {
            if (Platform.OS === 'android') {
                // Try best effort
                try {
                    const contentUri = await FileSystem.getContentUriAsync(uri);
                    const mimeType = getMimeType(uri);
                    const IntentLauncher = require('expo-intent-launcher');
                    if (IntentLauncher?.startActivityAsync) {
                        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, type: mimeType, flags: 1 });
                        return;
                    }
                } catch (e) { }
                await Sharing.shareAsync(uri, { mimeType: getMimeType(uri), dialogTitle: '파일 열기' });
            } else {
                try { await Linking.openURL(uri); } catch { await Sharing.shareAsync(uri, { UTI: getMimeType(uri) }); }
            }
        } catch (e) { showAlert('오류', '파일을 열 수 없습니다.'); }
    };

    const handleShare = async (uri: string) => {
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: getMimeType(uri), dialogTitle: '파일 공유' });
        else showAlert('알림', '공유 미지원');
    };

    const handleDeleteTrip = () => {
        if (!currentTrip) return;
        // setIsMenuVisible(false); // ActionSheet handles close
        showAlert('삭제', '정말로 이 여행을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: async () => { await deleteTrip(currentTrip.id); router.back(); } }
        ]);
    };

    const handleUpdateDates = () => {
        if (!currentTrip) return;
        setIsDateEditVisible(false);
        showAlert('수정', '내용이 초기화됩니다. 계속?', [{ text: '취소' }, { text: '수정', style: 'destructive', onPress: async () => { await updateTripDates(currentTrip.id, currentTrip.title, editStartDate, editEndDate); } }]);
    };

    const confirmImageUpload = async () => {
        if (!tempImageUri || !currentTrip) return;
        const currentDayObj = currentTrip.days.find(d => d.dayNumber === selectedDay);
        if (!currentDayObj) return;
        try {
            setIsUploading(true);
            setTempImageUri(null);
            const fileName = generateFileName(tempImageUri);
            const savedUri = await saveFileToLocal(tempImageUri, fileName);
            await addContentItem(currentTrip.id, currentDayObj.id, { title: `${selectedDay}일차 사진`, type: 'photo', uri: savedUri });
            setIsUploading(false);
        } catch { setIsUploading(false); }
    };

    const handleDeleteContent = (itemId: string, itemTitle: string) => {
        if (!currentTrip) return;
        const currentDayObj = currentTrip.days.find(d => d.dayNumber === selectedDay);
        if (!currentDayObj) return;
        showAlert('삭제', `'${itemTitle}' 삭제?`, [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: async () => await deleteContentItem(currentTrip.id, currentDayObj.id, itemId) }
        ]);
    };

    const handleAddPhoto = async () => {
        setIsAddSheetVisible(false); // [코다리 부장] 시트 먼저 닫기!
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) setTempImageUri(result.assets[0].uri);
    };

    const handleAddFile = async () => {
        setIsAddSheetVisible(false); // [코다리 부장] 시트 먼저 닫기!
        const currentDayObj = currentTrip?.days.find(d => d.dayNumber === selectedDay);
        if (!currentDayObj || !currentTrip) return;
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled) {
            setIsUploading(true);
            const fileName = generateFileName(result.assets[0].uri);
            const savedUri = await saveFileToLocal(result.assets[0].uri, fileName);
            await addContentItem(currentTrip.id, currentDayObj.id, { title: result.assets[0].name, type: 'file', uri: savedUri });
            setIsUploading(false);
        }
    };

    const showAddOptions = () => {
        setIsAddSheetVisible(true);
    };

    // [코다리 부장] 링크 추가 로직 - Alert.prompt 대신 모달 사용! (안드로이드 호환성)
    // [코다리 부장] 링크 추가 로직 - Alert.prompt 대신 모달 사용! (안드로이드 호환성)
    const handleAddLink = () => {
        setIsAddSheetVisible(false); // [코다리 부장] 시트 먼저 닫기!
        setLinkUrl('');
        setLinkTitle('');
        setIsLinkModalVisible(true);
    };

    const handleSaveLink = async () => {
        if (!linkUrl.trim()) {
            showAlert('알림', 'URL을 입력해주세요.');
            return;
        }

        const currentDayObj = currentTrip?.days.find(d => d.dayNumber === selectedDay);
        if (!currentDayObj || !currentTrip) return;

        const formattedUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;

        await addContentItem(currentTrip.id, currentDayObj.id, {
            title: linkTitle.trim() || linkUrl.trim(), // 제목 없으면 URL 사용
            type: 'link',
            uri: formattedUrl
        });

        setIsLinkModalVisible(false);
    };

    // [코다리 부장] 배경 선택: 갤러리 열기
    const handleSelectCoverImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) setTempCoverImageUri(result.assets[0].uri);
    };

    // [코다리 부장] 배경 확인: 선택한 이미지를 배경으로 설정
    const confirmCoverImage = async () => {
        if (!tempCoverImageUri || !currentTrip) return;
        await setCoverImage(currentTrip.id, tempCoverImageUri);
        setTempCoverImageUri(null);
    };

    // [코다리 부장] 배경 삭제: 그라데이션으로 복귀!
    const handleRemoveCoverImage = async () => {
        if (!currentTrip) return;
        showAlert('배경 삭제', '배경 이미지를 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: async () => await setCoverImage(currentTrip.id, '') }
        ]);
    };


    if (isLoading || !currentTrip) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const currentDay = currentTrip.days.find(d => d.dayNumber === selectedDay);
    // [코다리 부장] 사용자가 선택한 커버 이미지 우선, 없으면 null (그라데이션 표시)
    const coverImage = currentTrip.coverImageUri || null;

    // [코다리 부장] 모든 사진 목록 (배경 선택용)
    const allPhotos = currentTrip.days.flatMap(d => d.items.filter(i => i.type === 'photo'));

    // Parallax Interpolation
    // Fixed behavior: No bounce, always at top (Y=0)
    const headerTranslateY = scrollY.interpolate({
        inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
        outputRange: [0, 0, 0],
        extrapolate: 'clamp'
    });

    // Scale image only when pulling down (negative scroll) to avoid white gap
    const headerScale = scrollY.interpolate({
        inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
        outputRange: [2, 1, 1],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Custom Header with Sticky/Parallax */}
            <Animated.View style={[
                styles.headerContainer,
                {
                    height: HEADER_HEIGHT,
                    transform: [{ translateY: headerTranslateY }, { scale: headerScale }]
                }
            ]}>
                {coverImage ? (
                    <Image source={{ uri: coverImage }} style={styles.headerImage} resizeMode="cover" />
                ) : (
                    <LinearGradient colors={['#FF9A56', '#FFD4A3']} style={styles.headerImage} />
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)']} style={styles.headerGradient} />

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{currentTrip.title}</Text>
                    <Text style={styles.headerDate}>{currentTrip.startDate} - {currentTrip.endDate}</Text>
                </View>
            </Animated.View>

            {/* Back & Menu Buttons */}
            <SafeAreaView style={styles.navBar} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.navButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                </TouchableOpacity>
            </SafeAreaView>

            <Animated.ScrollView
                style={styles.scrollView}
                // Push content down by HEADER_HEIGHT so it starts below the fixed header
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 100 }}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bodyContainer}>
                    {/* Tabs - Significantly Compacted */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, selectedDay === -1 && styles.tabActive, styles.checklistTab]}
                            onPress={() => setSelectedDay(-1)}
                        >
                            <Ionicons name="checkbox-outline" size={14} color={selectedDay === -1 ? 'white' : '#8D6E63'} style={{ marginRight: 4 }} />
                            <Text style={[styles.tabText, selectedDay === -1 && styles.tabTextActive, { color: selectedDay === -1 ? 'white' : '#8D6E63' }]}>준비물</Text>
                        </TouchableOpacity>

                        {currentTrip.days.map((day) => (
                            <TouchableOpacity
                                key={day.id}
                                style={[styles.tab, selectedDay === day.dayNumber && styles.tabActive]}
                                onPress={() => setSelectedDay(day.dayNumber)}
                            >
                                <Text style={[styles.tabText, selectedDay === day.dayNumber && styles.tabTextActive]}>
                                    {day.dayNumber}일차
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {selectedDay === -1 ? (
                            <ChecklistTab trip={currentTrip} />
                        ) : (
                            <View>
                                {currentDay?.items.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="document-attach-outline" size={48} color={Colors.textTertiary} />
                                        <Text style={styles.emptyText}>아직 등록된 자료가 없습니다</Text>
                                        <TouchableOpacity style={styles.addFirstButton} onPress={showAddOptions}>
                                            <Text style={styles.addFirstButtonText}>첫 번째 자료 첨부하기</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    currentDay?.items.map((item, index) => (
                                        <FadeInView key={item.id} delay={index * 50}>
                                            <ContentItemCard
                                                item={item}
                                                tripId={currentTrip.id}
                                                dayId={currentDay.id}
                                                onUpdateDescription={(text) => {
                                                    if (currentTrip && currentDay) updateContentItem(currentTrip.id, currentDay.id, item.id, text);
                                                }}
                                                onImagePress={(uri) => { setSelectedImage(uri); setIsImageViewerVisible(true); }}
                                                onFilePress={handleFileOpen}
                                                onSharePress={handleShare}
                                                onLongPress={() => handleDeleteContent(item.id, item.title)}
                                            />
                                        </FadeInView>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Animated.ScrollView>

            {/* FAB */}
            {selectedDay !== -1 && (
                <FadeInView delay={200} style={styles.fabContainer}>
                    <TouchableOpacity style={styles.fab} onPress={showAddOptions}>
                        <Ionicons name="add" size={30} color="white" />
                    </TouchableOpacity>
                </FadeInView>
            )}

            {/* Modals and other components remain the same... */}
            <Modal visible={isImageViewerVisible} transparent={true} onRequestClose={() => setIsImageViewerVisible(false)}>
                <View style={styles.imageViewContainer}>
                    <TouchableOpacity style={styles.closeImageButton} onPress={() => setIsImageViewerVisible(false)}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />}
                </View>
            </Modal>

            <Modal visible={!!tempImageUri} transparent={false} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
                    <View style={styles.checkHeader}>
                        <TouchableOpacity onPress={() => setTempImageUri(null)}><Text style={styles.checkHeaderText}>취소</Text></TouchableOpacity>
                        <TouchableOpacity onPress={confirmImageUpload}><Text style={[styles.checkHeaderText, { color: Colors.primary, fontWeight: 'bold' }]}>업로드</Text></TouchableOpacity>
                    </View>
                    {tempImageUri && <Image source={{ uri: tempImageUri }} style={{ flex: 1 }} resizeMode="contain" />}
                </SafeAreaView>
            </Modal>

            {/* [코다리 부장] 추가 옵션 액션 시트 */}
            <ActionSheet
                visible={isAddSheetVisible}
                onClose={() => setIsAddSheetVisible(false)}
                title="자료 첨부하기"
                actions={[
                    {
                        id: 'photo',
                        label: '사진 추가',
                        icon: 'image-outline',
                        onPress: handleAddPhoto
                    },
                    {
                        id: 'file',
                        label: '파일 추가',
                        icon: 'document-attach-outline',
                        onPress: handleAddFile
                    },
                    {
                        id: 'link',
                        label: '링크 추가',
                        icon: 'link-outline',
                        onPress: handleAddLink
                    }
                ]}
            />

            {/* [코다리 부장] 메뉴 액션 시트 */}
            <ActionSheet
                visible={isMenuVisible}
                onClose={() => setIsMenuVisible(false)}
                title="여행 설정"
                actions={[
                    {
                        id: 'edit_date',
                        label: '날짜 수정',
                        icon: 'calendar-outline',
                        onPress: () => {
                            // setIsMenuVisible(false);
                            setIsDateEditVisible(true);
                        }
                    },
                    {
                        id: 'select_cover',
                        label: '배경 선택',
                        icon: 'image-outline',
                        onPress: () => {
                            // setIsMenuVisible(false);
                            handleSelectCoverImage();
                        }
                    },
                    {
                        id: 'remove_cover',
                        label: '배경 초기화',
                        icon: 'refresh-outline',
                        onPress: () => {
                            // setIsMenuVisible(false);
                            handleRemoveCoverImage();
                        }
                    },
                    {
                        id: 'delete_trip',
                        label: '여행 삭제',
                        icon: 'trash-outline',
                        isDestructive: true,
                        onPress: handleDeleteTrip
                    }
                ]}
            />

            <Modal visible={isDateEditVisible} transparent={true} animationType="slide">
                <View style={styles.dateEditOverlay}>
                    <View style={styles.dateEditBox}>
                        <TextInput style={styles.input} value={editStartDate} onChangeText={setEditStartDate} placeholder="시작일" />
                        <TextInput style={styles.input} value={editEndDate} onChangeText={setEditEndDate} placeholder="종료일" />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setIsDateEditVisible(false)} style={styles.modalBtn}><Text>취소</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateDates} style={[styles.modalBtn, { backgroundColor: Colors.primary }]}><Text style={{ color: 'white' }}>수정</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* [코다리 부장] 배경 확인 모달 (갤러리 선택 후) */}
            <Modal visible={!!tempCoverImageUri} transparent={false} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
                    <View style={styles.checkHeader}>
                        <TouchableOpacity onPress={() => setTempCoverImageUri(null)}><Text style={styles.checkHeaderText}>취소</Text></TouchableOpacity>
                        <TouchableOpacity onPress={confirmCoverImage}><Text style={[styles.checkHeaderText, { color: Colors.primary, fontWeight: 'bold' }]}>확인</Text></TouchableOpacity>
                    </View>
                    {tempCoverImageUri && <Image source={{ uri: tempCoverImageUri }} style={{ flex: 1 }} resizeMode="contain" />}
                </SafeAreaView>
            </Modal>

            {/* [코다리 부장] 링크 추가 모달 */}
            <Modal visible={isLinkModalVisible} transparent={true} animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>링크 추가</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>URL</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={linkUrl}
                                onChangeText={setLinkUrl}
                                placeholder="https://example.com"
                                placeholderTextColor={Colors.textTertiary}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>제목 (선택사항)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={linkTitle}
                                onChangeText={setLinkTitle}
                                placeholder="예: 호텔 예약 확인"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={() => setIsLinkModalVisible(false)}
                                style={[styles.modalBtn, styles.cancelBtn]}
                            >
                                <Text style={styles.cancelBtnText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveLink}
                                style={[styles.modalBtn, styles.confirmBtn]}
                            >
                                <Text style={styles.confirmBtnText}>추가</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
}

// Reuse FadeInView
const FadeInView = ({ children, delay = 0, style = {} }: { children: React.ReactNode, delay?: number, style?: any }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: delay,
            useNativeDriver: true,
        }).start();
    }, [delay, fadeAnim]);

    return (
        <Animated.View style={[{ opacity: fadeAnim }, style]}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        zIndex: 1,
    },
    headerImage: { width: '100%', height: '100%' },
    headerGradient: { ...StyleSheet.absoluteFillObject },
    headerContent: {
        position: 'absolute',
        bottom: 16, // Adjusted slightly
        left: 20,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 10 },
    headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    navButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20, // 둥근 버튼
    },
    scrollView: {
        flex: 1,
    },
    bodyContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 16, // [코다리 부장] minHeight 제거로 자연스러운 높이!
    },
    tabContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8, // Restored - spacing below tabs
        flexGrow: 0,
    },
    tab: {
        flexDirection: 'row', // Force horizontal layout
        alignItems: 'center', // Center items vertically
        justifyContent: 'center', // Center items horizontally
        paddingVertical: 6, // Compact vertical padding
        paddingHorizontal: 12, // Compact horizontal padding
        borderRadius: 12,
        backgroundColor: Colors.surface,
        marginRight: 6,
        height: 28, // Explicit height constraint
        ...Shadows.small,
    },
    checklistTab: {
        backgroundColor: '#D7CCC8', // Soft brown for checklist
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        lineHeight: 14, // Tight line height to reduce button height
    },
    tabTextActive: {
        color: 'white',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 0, // NO top padding - content right below tabs
        paddingBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80, // [코다리 부장] 화면 중앙에 오도록 조정!
        opacity: 0.7,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 15,
        color: Colors.textSecondary,
    },
    addFirstButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        ...Shadows.small,
    },
    addFirstButtonText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 100, // Ensure FAB is on top
    },
    fab: {
        width: 56, // Slightly smaller FAB
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
    },
    imageViewContainer: { flex: 1, backgroundColor: 'black' },
    fullScreenImage: { width: '100%', height: '100%' },
    closeImageButton: { position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 10 },

    // Check Modal
    checkHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    checkHeaderText: { color: 'white', fontSize: 16 },

    // Modals
    dateEditOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    dateEditBox: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 24, ...Shadows.large },
    dateEditTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 12, marginBottom: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },

    // New Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        ...Shadows.large,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    cancelBtn: {
        backgroundColor: '#F5F5F5',
    },
    confirmBtn: {
        backgroundColor: Colors.primary,
    },
    cancelBtnText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    confirmBtnText: {
        color: 'white',
        fontWeight: '600',
    },
});
