import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContentItem } from '@/types';
import { Colors, Shadows, Layout } from '@/lib/theme';

interface Props {
    item: ContentItem;
    tripId: string;
    dayId: string;
    onUpdateDescription: (text: string) => void;
    onImagePress: (uri: string) => void;
    onFilePress: (uri: string) => void;
    onSharePress: (uri: string) => void;
    onLongPress: () => void;
}

export default function ContentItemCard({ item, tripId, dayId, onUpdateDescription, onImagePress, onFilePress, onSharePress, onLongPress }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.description || '');

    const handleSave = () => {
        onUpdateDescription(text);
        setIsEditing(false);
    };

    return (
        <View style={styles.container}>
            {/* Content Display */}
            <TouchableOpacity
                style={styles.contentArea}
                onPress={() => {
                    if (item.type === 'photo') {
                        onImagePress(item.uri);
                    } else if (item.type === 'link') {
                        // Open link directly
                        require('expo-linking').openURL(item.uri);
                    } else {
                        onFilePress(item.uri);
                    }
                }}
                onLongPress={onLongPress}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                {item.type === 'photo' ? (
                    <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
                ) : item.type === 'link' ? (
                    <View style={[styles.image, styles.linkIcon]}>
                        <Ionicons name="link-outline" size={32} color={Colors.primary} />
                    </View>
                ) : (
                    <View style={[styles.image, styles.fileIcon]}>
                        <Ionicons name="document-text-outline" size={32} color={Colors.primary} />
                        <Text style={styles.fileExt} numberOfLines={1}>
                            {item.title.split('.').pop()?.toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.meta}>
                        {item.type === 'photo' ? '사진' : item.type === 'link' ? '링크' : '파일'} • {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Copy & Share Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={async () => {
                            try {
                                const Clipboard = require('expo-clipboard');
                                if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
                                    await Clipboard.setStringAsync(item.uri);
                                    Alert.alert('알림', item.type === 'link' ? '링크가 복사되었습니다.' : '경로가 복사되었습니다.');
                                } else {
                                    Alert.alert('알림', '복사 기능을 사용할 수 없습니다. 앱을 최신 버전으로 업데이트 해주세요.');
                                }
                            } catch (e) {
                                console.error('Clipboard error:', e);
                                Alert.alert('오류', '복사 기능을 사용할 수 없습니다. (모듈 없음)');
                            }
                        }}
                    >
                        <Ionicons name="copy-outline" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onSharePress(item.uri)}
                    >
                        <Ionicons name="share-outline" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Memo Area */}
            <View style={styles.memoContainer}>
                <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.editIcon}
                >
                    <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.textContainer}>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={text}
                            onChangeText={setText}
                            placeholder="메모를 입력하세요..."
                            placeholderTextColor={Colors.textTertiary}
                            multiline
                            autoFocus
                        />
                    ) : (
                        <Text style={[styles.text, !text && styles.placeholderText]}>
                            {text || '메모를 입력하세요...'}
                        </Text>
                    )}
                </View>

                {isEditing && (
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.saveButtonText}>저장</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: Layout.radius.m,
        marginBottom: Layout.spacing.m,
        ...Shadows.small,
        overflow: 'hidden',
    },
    contentArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.m,
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: Layout.radius.s,
        backgroundColor: Colors.surfaceAlt,
    },
    fileIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    linkIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#FFF4ED',
    },
    fileExt: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginTop: 4,
    },
    info: {
        flex: 1,
        marginLeft: Layout.spacing.m,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    meta: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    memoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surfaceAlt,
        padding: Layout.spacing.m,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    editIcon: {
        marginRight: Layout.spacing.s,
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
        minHeight: 20,
        justifyContent: 'center',
    },
    input: {
        fontSize: 14,
        color: Colors.textPrimary,
        padding: 0,
        lineHeight: 20,
    },
    text: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    placeholderText: {
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    saveButton: {
        marginLeft: Layout.spacing.s,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
});
