/**
 * Dummy-Modul für @mediapipe/pose.
 *
 * @tensorflow-models/pose-detection bundelt BEIDE Backends (MediaPipe + TF.js).
 * Metro löst alle require()-Pfade auf, auch wenn wir nur runtime:'tfjs' nutzen.
 * @mediapipe/pose ist ein reines Web/WASM-Paket und kann nicht nativ laufen.
 * Dieses Dummy verhindert den "Unable to resolve module" Bundling-Fehler.
 */
export const Pose = null;
export const POSE_CONNECTIONS = [];
export const POSE_LANDMARKS = {};
export const POSE_LANDMARKS_LEFT = {};
export const POSE_LANDMARKS_RIGHT = {};
export const POSE_LANDMARKS_NEUTRAL = {};
export const VERSION = '0.0.0-dummy';
export default {
    Pose,
    POSE_CONNECTIONS,
    POSE_LANDMARKS,
    VERSION,
};
