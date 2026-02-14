import { create } from 'zustand';

interface UIStore {
    isSideMenuVisible: boolean;
    openSideMenu: () => void;
    closeSideMenu: () => void;
    toggleSideMenu: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isSideMenuVisible: false,
    openSideMenu: () => set({ isSideMenuVisible: true }),
    closeSideMenu: () => set({ isSideMenuVisible: false }),
    toggleSideMenu: () => set((state) => ({ isSideMenuVisible: !state.isSideMenuVisible })),
}));
