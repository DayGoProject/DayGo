// 여행 관련 타입 정의

export type Trip = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
    days: Day[];
    checklist: ChecklistItem[];
    coverImageUri?: string; // [코다리 부장] 사용자가 선택한 커버 이미지!
};

export type ChecklistItem = {
    id: string;
    tripId: string;
    text: string;
    isChecked: boolean;
    createdAt: string;
};

export type Day = {
    id: string;
    tripId: string;
    dayNumber: number;
    date: string;
    items: ContentItem[];
    schedules?: ScheduleItem[]; // [코다리 부장] 일정표 아이템 추가!
};

export type ScheduleItem = {
    id: string;
    dayId: string;
    title: string;
    description?: string;
    time: string; // "HH:mm" (Start Time)
    endTime?: string; // "HH:mm" (End Time)
    color?: string; // UI 표시 색상
    location?: string;
};

export type ContentItem = {
    id: string;
    dayId: string;
    title: string;
    type: 'photo' | 'file' | 'link';
    uri: string; // 로컬 URI 또는 웹 링크 URL
    cloudUrl?: string; // Supabase 클라우드 URL
    description?: string; // 사용자가 입력한 설명 (메모)
    createdAt: string;
};

export type CreateTripInput = {
    title: string;
    startDate: string;
    endDate: string;
};

export type CreateContentItemInput = {
    dayId: string;
    title: string;
    type: 'photo' | 'file';
    uri: string;
};

// [코다리 부장] 경비 계산기 타입 정의 💰
export type CurrencyWallet = {
    id: string;
    currency: string; // 'KRW', 'USD', 'JPY', 'EUR', etc.
    symbol: string; // '₩', '$', '¥', '€'
    initialAmount: number;
    remainingAmount: number;
    expenses: Expense[];
};

export type Expense = {
    id: string;
    type: 'expense' | 'income'; // 지출 or 수입(잔액 추가)
    amount: number;
    description: string;
    date: string; // ISO string
    category?: string; // 식비, 교통비, 쇼핑 등 (추후 확장 가능)
};
