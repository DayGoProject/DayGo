import { create } from 'zustand';
import { Trip, Day, ContentItem, ChecklistItem, ScheduleItem } from '@/types';
import { storage } from '@/lib/storage';

interface TripState {
    trips: Trip[];
    currentTrip: Trip | null;
    isLoading: boolean;
    error: string | null;

    // 액션
    loadTrips: () => Promise<void>;
    setCurrentTrip: (id: string) => void;
    addTrip: (title: string, startDate: string, endDate: string) => Promise<void>;
    addContentItem: (tripId: string, dayId: string, item: Omit<ContentItem, 'id' | 'createdAt' | 'dayId'>) => Promise<void>;
    updateContentItem: (tripId: string, dayId: string, itemId: string, description: string) => Promise<void>;
    deleteContentItem: (tripId: string, dayId: string, itemId: string) => Promise<void>;
    addChecklistItem: (tripId: string, text: string) => Promise<void>;
    toggleChecklistItem: (tripId: string, itemId: string) => Promise<void>;
    removeChecklistItem: (tripId: string, itemId: string) => Promise<void>;
    updateChecklistItem: (tripId: string, itemId: string, text: string) => Promise<void>;
    setCoverImage: (tripId: string, imageUri: string) => Promise<void>; // [코다리 부장] 배경 선택!
    deleteTrip: (tripId: string) => Promise<void>;
    updateTripDates: (tripId: string, title: string, startDate: string, endDate: string) => Promise<void>;

    // [코다리 부장] 일정표 액션 추가!
    addScheduleItem: (tripId: string, dayId: string, item: Omit<ScheduleItem, 'id' | 'dayId'>) => Promise<void>;
    deleteScheduleItem: (tripId: string, dayId: string, itemId: string) => Promise<void>;
}

/**
 * 여행 상태 관리 스토어 (Zustand)
 * 전역 상태를 관리하고 비즈니스 로직을 처리합니다.
 * [코다리 부장] 여기서 앱의 모든 데이터를 든든하게 관리합니다! 🛡️
 */
export const useTripStore = create<TripState>((set, get) => ({
    trips: [],
    currentTrip: null,
    isLoading: false,
    error: null,

    loadTrips: async () => {
        set({ isLoading: true, error: null });
        try {
            const trips = await storage.getTrips();
            set({ trips, isLoading: false });
        } catch {
            set({ error: '여행 목록을 불러오는데 실패했습니다', isLoading: false });
        }
    },

    setCurrentTrip: (id: string) => {
        const { trips } = get();
        const trip = trips.find((t) => t.id === id) || null;
        set({ currentTrip: trip });
    },

    addTrip: async (title: string, startDate: string, endDate: string) => {
        set({ isLoading: true, error: null });
        try {
            // 여행 기간 계산하여 일차(Day) 자동 생성
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const newTripId = Date.now().toString(); // 임시 ID 생성

            const days: Day[] = Array.from({ length: diffDays }, (_, i) => {
                const date = new Date(start);
                date.setDate(date.getDate() + i);
                return {
                    id: `${newTripId}_day_${i + 1}`,
                    tripId: newTripId,
                    dayNumber: i + 1,
                    date: date.toISOString().split('T')[0],
                    items: [],
                };
            });

            const newTrip: Trip = {
                id: newTripId,
                title,
                startDate,
                endDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                days,
                checklist: [],
            };

            await storage.addTrip(newTrip);
            const trips = await storage.getTrips();
            set({ trips, isLoading: false });
        } catch {
            set({ error: '여행을 생성하는데 실패했습니다', isLoading: false });
        }
    },

    addContentItem: async (tripId: string, dayId: string, itemData) => {
        set({ isLoading: true, error: null });
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);

            if (tripIndex === -1) throw new Error('여행을 찾을 수 없습니다');

            const updatedTrip = { ...trips[tripIndex] };
            const dayIndex = updatedTrip.days.findIndex((d) => d.id === dayId);

            if (dayIndex === -1) throw new Error('해당 날짜를 찾을 수 없습니다');

            const newItem: ContentItem = {
                id: Date.now().toString(),
                dayId,
                ...itemData,
                createdAt: new Date().toISOString(),
            };

            updatedTrip.days[dayIndex].items.unshift(newItem); // [코다리 부장] 새 항목을 맨 위에 추가!
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            // 상태 업데이트
            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
                isLoading: false
            });
        } catch {
            set({ error: '자료를 추가하는데 실패했습니다', isLoading: false });
        }
    },

    updateContentItem: async (tripId: string, dayId: string, itemId: string, description: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            const dayIndex = updatedTrip.days.findIndex((d) => d.id === dayId);
            if (dayIndex === -1) return;

            const itemIndex = updatedTrip.days[dayIndex].items.findIndex((i) => i.id === itemId);
            if (itemIndex === -1) return;

            // 설명 업데이트
            updatedTrip.days[dayIndex].items[itemIndex].description = description;
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
        }
    },

    deleteContentItem: async (tripId: string, dayId: string, itemId: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            const dayIndex = updatedTrip.days.findIndex((d) => d.id === dayId);
            if (dayIndex === -1) return;

            // 항목 삭제
            updatedTrip.days[dayIndex].items = updatedTrip.days[dayIndex].items.filter((i) => i.id !== itemId);
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
            set({ error: '항목 삭제 실패' });
        }
    },

    addChecklistItem: async (tripId: string, text: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };

            // 기존 데이터에 checklist가 없는 경우를 대비
            if (!updatedTrip.checklist) updatedTrip.checklist = [];

            const newItem: ChecklistItem = {
                id: Date.now().toString(),
                tripId,
                text,
                isChecked: false,
                createdAt: new Date().toISOString(),
            };

            updatedTrip.checklist.push(newItem);
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
            set({ error: '체크리스트 추가 실패' });
        }
    },

    toggleChecklistItem: async (tripId: string, itemId: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            if (!updatedTrip.checklist) return;

            const itemIndex = updatedTrip.checklist.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return;

            updatedTrip.checklist[itemIndex].isChecked = !updatedTrip.checklist[itemIndex].isChecked;
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
        }
    },

    removeChecklistItem: async (tripId: string, itemId: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            if (!updatedTrip.checklist) return;

            updatedTrip.checklist = updatedTrip.checklist.filter(i => i.id !== itemId);
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
        }
    },

    updateChecklistItem: async (tripId: string, itemId: string, text: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            if (!updatedTrip.checklist) return;

            const itemIndex = updatedTrip.checklist.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return;

            updatedTrip.checklist[itemIndex].text = text;
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
            set({ error: '체크리스트 수정 실패' });
        }
    },

    // [코다리 부장] 커버 이미지 설정 기능!
    setCoverImage: async (tripId: string, imageUri: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            updatedTrip.coverImageUri = imageUri;
            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch {
            set({ error: '배경 이미지 설정 실패' });
        }
    },

    deleteTrip: async (tripId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { trips } = get();
            await storage.deleteTrip(tripId);

            const newTrips = trips.filter(t => t.id !== tripId);

            set({
                trips: newTrips,
                currentTrip: null,
                isLoading: false
            });
        } catch (e) {
            set({ error: '여행 삭제 실패', isLoading: false });
        }
    },

    updateTripDates: async (tripId: string, title: string, startDate: string, endDate: string) => {
        set({ isLoading: true, error: null });
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const existingTrip = trips[tripIndex];

            // 날짜가 변경되었는지 확인
            const isDateChanged = existingTrip.startDate !== startDate || existingTrip.endDate !== endDate;

            let updatedTrip: Trip;

            if (isDateChanged) {
                // 날짜가 변경된 경우: Days 재생성 (내용 초기화)
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                const days: Day[] = Array.from({ length: diffDays }, (_, i) => {
                    const date = new Date(start);
                    date.setDate(date.getDate() + i);
                    return {
                        id: `${tripId}_day_${i + 1}_${Date.now()}`,
                        tripId: tripId,
                        dayNumber: i + 1,
                        date: date.toISOString().split('T')[0],
                        items: [],
                    };
                });

                updatedTrip = {
                    ...existingTrip,
                    title,
                    startDate,
                    endDate,
                    days,
                    updatedAt: new Date().toISOString(),
                };
            } else {
                // 날짜가 변경되지 않은 경우: 제목만 업데이트 (내용 유지)
                updatedTrip = {
                    ...existingTrip,
                    title,
                    updatedAt: new Date().toISOString(),
                };
            }

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip, // 현재 보고 있는 여행이면 업데이트
                isLoading: false
            });
        } catch (e) {
            set({ error: '여행 수정 실패', isLoading: false });
        }
    },

    addScheduleItem: async (tripId: string, dayId: string, itemData) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            // Deep clone structure for immutability
            const updatedTrip = { ...trips[tripIndex] };
            updatedTrip.days = [...updatedTrip.days]; // New days array reference

            const dayIndex = updatedTrip.days.findIndex((d) => d.id === dayId);
            if (dayIndex === -1) return;

            const existingSchedules = updatedTrip.days[dayIndex].schedules || [];

            const newItem: ScheduleItem = {
                id: Date.now().toString(),
                dayId,
                ...itemData,
            };

            // New Day object reference and New Schedules array reference
            updatedTrip.days[dayIndex] = {
                ...updatedTrip.days[dayIndex],
                schedules: [...existingSchedules, newItem].sort((a, b) => a.time.localeCompare(b.time))
            };

            updatedTrip.updatedAt = new Date().toISOString();

            await storage.updateTrip(updatedTrip);

            const newTrips = [...trips];
            newTrips[tripIndex] = updatedTrip;

            set({
                trips: newTrips,
                currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
            });
        } catch (e) {
            console.error(e);
            set({ error: '일정 추가 실패' });
        }
    },

    deleteScheduleItem: async (tripId: string, dayId: string, itemId: string) => {
        try {
            const { trips } = get();
            const tripIndex = trips.findIndex((t) => t.id === tripId);
            if (tripIndex === -1) return;

            const updatedTrip = { ...trips[tripIndex] };
            updatedTrip.days = [...updatedTrip.days]; // New days array reference

            const dayIndex = updatedTrip.days.findIndex((d) => d.id === dayId);
            if (dayIndex === -1) return;

            if (updatedTrip.days[dayIndex].schedules) {
                // New Day object reference and New Schedules array reference
                updatedTrip.days[dayIndex] = {
                    ...updatedTrip.days[dayIndex],
                    schedules: updatedTrip.days[dayIndex].schedules.filter(s => s.id !== itemId)
                };

                updatedTrip.updatedAt = new Date().toISOString();

                await storage.updateTrip(updatedTrip);

                const newTrips = [...trips];
                newTrips[tripIndex] = updatedTrip;

                set({
                    trips: newTrips,
                    currentTrip: updatedTrip.id === get().currentTrip?.id ? updatedTrip : get().currentTrip,
                });
            }
        } catch (e) {
            console.error(e);
            set({ error: '일정 삭제 실패' });
        }
    },
}));
