import { create } from 'zustand';
import { Measurement, JointType, MovementType, BodySide } from '../types';

interface MeasurementState {
    currentJoint: JointType | null;
    currentMovement: MovementType | null;
    currentSide: BodySide | null;
    recentMeasurements: Measurement[];
    setMeasurementContext: (joint: JointType, movement: MovementType, side: BodySide) => void;
    addMeasurement: (m: Measurement) => void;
    setMeasurements: (measurements: Measurement[]) => void;
    clearContext: () => void;
}

export const useMeasurementStore = create<MeasurementState>((set) => ({
    currentJoint: null,
    currentMovement: null,
    currentSide: null,
    recentMeasurements: [],

    setMeasurementContext: (joint, movement, side) => set({
        currentJoint: joint,
        currentMovement: movement,
        currentSide: side
    }),

    addMeasurement: (m) => set((state) => ({
        recentMeasurements: [m, ...state.recentMeasurements]
    })),

    setMeasurements: (measurements) => set({
        recentMeasurements: measurements
    }),

    clearContext: () => set({
        currentJoint: null,
        currentMovement: null,
        currentSide: null
    })
}));
