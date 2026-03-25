import { create } from 'zustand';

interface UIState {
    isSubRailOpen: boolean;
    activeModule: string | null;
    toggleSubRail: () => void;
    setSubRailOpen: (open: boolean) => void;
    setActiveModule: (module: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSubRailOpen: true,
    activeModule: null,
    toggleSubRail: () => set((state) => ({ isSubRailOpen: !state.isSubRailOpen })),
    setSubRailOpen: (open) => set({ isSubRailOpen: open }),
    setActiveModule: (module) => set({ activeModule: module }),
}));
