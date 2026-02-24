import { useState, useCallback } from 'react';
import { calculateAngle, calculateROM, isStablePosition, isValidPose } from '../utils/angleCalculation';
import { JOINT_CONFIGS } from '../constants/joints';
import { PoseLandmark, JointType, MovementType } from '../types';

export function usePoseEstimation(jointType: JointType, movementType: MovementType, side: 'left' | 'right') {
    const [currentAngle, setCurrentAngle] = useState(0);
    const [isStable, setIsStable] = useState(false);
    const [recentAngles, setRecentAngles] = useState<number[]>([]);

    const configKey = `${jointType}_${side}`;
    const config = JOINT_CONFIGS[configKey];
    const indices = config?.landmarkTriple || [0, 0, 0];

    const processPose = useCallback((landmarks: PoseLandmark[]) => {
        if (!isValidPose(landmarks, indices)) return;

        const angle = calculateAngle(
            landmarks[indices[0]],
            landmarks[indices[1]],
            landmarks[indices[2]]
        );

        const rom = calculateROM(angle, jointType, movementType);

        setRecentAngles(prev => {
            const updated = [...prev, rom].slice(-30); // Behalte die letzten 30 Frames (~1 Sekunde)
            setIsStable(isStablePosition(updated));
            return updated;
        });

        setCurrentAngle(rom);
    }, [indices, jointType, movementType]);

    return {
        currentAngle,
        isStable,
        // Zum Testen ohne echte Kamera / JSI Plugin
        simulatePose: (landmarks: PoseLandmark[]) => processPose(landmarks)
    };
}
