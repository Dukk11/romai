import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { JOINT_CONFIGS } from '../constants/joints';
import { calculateAngle, isValidPose } from './angleCalculation';

let detector: poseDetection.PoseDetector | null = null;
let isTfReady = false;

/**
 * Initializes the TensorFlow backend and loads the BlazePose model.
 */
export async function initTensorFlow() {
    if (detector) return; // Already initialized

    try {
        console.log("Initializing TFJS backend...");
        await tf.ready();
        isTfReady = true;
        console.log("TFJS Ready.");

        console.log("Loading Pose Detection Model (BlazePose)...");
        const detectorConfig = { runtime: 'tfjs', modelType: 'lite' };
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.BlazePose,
            detectorConfig
        );
        console.log("BlazePose Model Loaded!");
    } catch (e) {
        console.error("Failed to initialize TFJS or Model", e);
    }
}

/**
 * Validates if a pose contains confident landmarks required for an angle trace.
 * Calculates the exact angle using the defined 3-point joint configuration.
 */
export function estimateJointAngle(pose: poseDetection.Pose, jointKey: string): number {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) return 0;

    const config = JOINT_CONFIGS[jointKey];
    if (!config || !config.landmarkTriple) return 0;

    const [idxA, idxB, idxC] = config.landmarkTriple;

    // Convert poseDetection.Keypoint to our PoseLandmark type
    // poseDetection keypoints have {x, y, z, score, name}
    // We need {x, y, z, visibility: score}
    const landmarks = pose.keypoints.map(k => ({
        x: k.x,
        y: k.y,
        z: k.z || 0,
        visibility: k.score || 0
    }));

    // Check if the 3 required points are visible enough
    // Reduced from 0.4 to 0.1 to allow angle calculation even in sub-optimal lighting/poses
    if (!isValidPose(landmarks, [idxA, idxB, idxC], 0.1)) {
        return 0; // Not enough confidence
    }

    const angle = calculateAngle(landmarks[idxA], landmarks[idxB], landmarks[idxC]);
    return angle;
}

export { detector, isTfReady };
