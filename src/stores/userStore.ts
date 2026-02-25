import { create } from 'zustand';
import { User, JointType, BodySide } from '../types';

interface UserState {
    user: User | null;
    role: 'patient' | 'professional' | null;
    isAuthenticated: boolean;
    setRole: (role: 'patient' | 'professional') => void;
    login: (user: User) => void;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    role: null,
    isAuthenticated: false,

    setRole: (role) => set({ role }),

    login: (user) => set({ user, isAuthenticated: true }),

    logout: () => set({ user: null, role: null, isAuthenticated: false }),

    updateProfile: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null
    }))
}));

interface SettingsState {
    defaultJoint: JointType;
    defaultSide: BodySide;
    offlineMode: boolean;
    stabilityThreshold: number;
    stabilityFrames: number;
    setDefaultJoint: (joint: JointType) => void;
    setDefaultSide: (side: BodySide) => void;
    toggleOfflineMode: () => void;
    setStabilityThreshold: (val: number) => void;
    setStabilityFrames: (val: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    defaultJoint: 'knee',
    defaultSide: 'right',
    offlineMode: false,
    stabilityThreshold: 4,
    stabilityFrames: 10,

    setDefaultJoint: (joint) => set({ defaultJoint: joint }),
    setDefaultSide: (side) => set({ defaultSide: side }),
    toggleOfflineMode: () => set((state) => ({ offlineMode: !state.offlineMode })),
    setStabilityThreshold: (val) => set({ stabilityThreshold: val }),
    setStabilityFrames: (val) => set({ stabilityFrames: val })
}));
