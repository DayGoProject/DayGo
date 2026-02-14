import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip, ChecklistItem } from '@/types';
import { useTripStore } from '@/store/tripStore';
import { useAlert } from '@/components/AlertProvider';
import { Colors } from '@/lib/theme';

interface ChecklistTabProps {
    trip: Trip;
}

export default function ChecklistTab({ trip }: ChecklistTabProps) {
    // [코다리 부장] 준비물 추가/토글/삭제/수정 기능을 스토어에서 가져옵니다!
    const { addChecklistItem, toggleChecklistItem, removeChecklistItem, updateChecklistItem } = useTripStore();
    const { showAlert } = useAlert();
    const [newItemText, setNewItemText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    // [코다리 부장] 준비물 추가 함수입니다. 빈 칸은 안 돼요! 🙅‍♂️
    const handleAddItem = async () => {
        if (!newItemText.trim()) return;

        await addChecklistItem(trip.id, newItemText.trim());
        setNewItemText(''); // 입력창 비워주는 센스! ✨
    };

    // [코다리 부장] 준비물 수정 시작!
    const startEditing = (item: ChecklistItem) => {
        setEditingId(item.id);
        setEditingText(item.text);
    };

    // [코다리 부장] 준비물 수정 완료! 사용자의 요청대로 확인창 없이 바로 저장합니다.
    const handleUpdateItem = async () => {
        if (!editingId || !editingText.trim()) return;

        await updateChecklistItem(trip.id, editingId, editingText.trim());
        setEditingId(null);
        setEditingText('');
    };

    // [코다리 부장] 준비물 삭제! 커스텀 UI 알림창을 사용합니다.
    const handleDeleteItem = (itemId: string) => {
        showAlert(
            "준비물 삭제",
            "정말 이 항목을 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        await removeChecklistItem(trip.id, itemId);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: ChecklistItem }) => {
        const isEditing = editingId === item.id;

        return (
            <View style={styles.itemContainer}>
                {isEditing ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.editInput}
                            value={editingText}
                            onChangeText={setEditingText}
                            autoFocus
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={handleUpdateItem}
                            >
                                <Text style={styles.doneButtonText}>완료</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelIconButton}
                                onPress={() => setEditingId(null)}
                            >
                                <Ionicons name="close-outline" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => toggleChecklistItem(trip.id, item.id)}
                        >
                            <Ionicons
                                name={item.isChecked ? "checkbox" : "square-outline"}
                                size={24}
                                color={item.isChecked ? "#007AFF" : "#666"}
                            />
                            <Text style={[styles.itemText, item.isChecked && styles.itemTextChecked]}>
                                {item.text}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                onPress={() => startEditing(item)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="create-outline" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDeleteItem(item.id)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    };

    const checklist = trip.checklist || [];
    const sortedChecklist = [...checklist].sort((a, b) => {
        // 미완료 항목이 위로, 완료된 항목이 아래로
        if (a.isChecked === b.isChecked) return 0;
        return a.isChecked ? 1 : -1;
    });

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="준비물을 입력하세요 (예: 여권, 충전기)"
                    placeholderTextColor="#666"
                    value={newItemText}
                    onChangeText={setNewItemText}
                    onSubmitEditing={handleAddItem}
                    returnKeyType="done"
                />
                <TouchableOpacity
                    style={[styles.addButton, !newItemText.trim() && styles.addButtonDisabled]}
                    onPress={handleAddItem}
                    disabled={!newItemText.trim()}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sortedChecklist}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>아직 등록된 준비물이 없습니다.</Text>
                        <Text style={styles.emptySubText}>여행에 필요한 물건들을 적어보세요!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 44,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginRight: 10,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    checkboxContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        marginRight: 8,
    },
    itemTextChecked: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 6,
        marginLeft: 4,
    },
    editContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    editInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F0F0F0',
        borderRadius: 6,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
    },
    editActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    doneButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelIconButton: {
        padding: 4,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
    },
});
