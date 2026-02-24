import { PoseLandmark } from '../types';

/**
 * Berechnet den Winkel zwischen drei Punkten (in Grad).
 * Der Winkel wird am mittleren Punkt (B) gemessen.
 *
 *    A
 *     \
 *      \ angle
 *       B ---------> C
 *
 * @param a Erster Punkt (z.B. Hüfte)
 * @param b Mittelpunkt / Gelenk (z.B. Knie)
 * @param c Dritter Punkt (z.B. Sprunggelenk)
 * @returns Winkel in Grad (0-180)
 */
export function calculateAngle(
    a: PoseLandmark,
    b: PoseLandmark,
    c: PoseLandmark
): number {
    // Vektoren BA und BC
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;

    // Skalarprodukt und Beträge
    const dotProduct = baX * bcX + baY * bcY;
    const magnitudeBA = Math.sqrt(baX * baX + baY * baY);
    const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY);

    // Winkel in Radiant → Grad
    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;

    const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC)));
    const angleRad = Math.acos(cosAngle);
    const angleDeg = (angleRad * 180) / Math.PI;

    return Math.round(angleDeg * 10) / 10; // 1 Dezimalstelle
}

/**
 * Berechnet den ROM-Winkel für ein bestimmtes Gelenk.
 * Konvertiert den rohen Winkel in den klinisch relevanten ROM-Wert.
 *
 * Für Knie-Flexion: 180° = gestreckt (0° Flexion), kleinerer Winkel = mehr Flexion
 */
export function calculateROM(
    rawAngle: number,
    jointType: string,
    movementType: string
): number {
    switch (`${jointType}_${movementType}`) {
        case 'knee_flexion':
            // Knie: 180° = gestreckt (0° Flexion), kleinerer Winkel = mehr Flexion
            return Math.max(0, 180 - rawAngle);

        case 'knee_extension':
            // Extension: 180° = voll gestreckt (0° Extensionsdefizit)
            // Werte > 180° = Hyperextension (positiv)
            return 180 - rawAngle;

        case 'shoulder_flexion':
        case 'shoulder_abduction':
            // Schulter: Winkel zwischen Rumpf und Arm
            return rawAngle;

        case 'hip_flexion':
            return Math.max(0, 180 - rawAngle);

        default:
            return rawAngle;
    }
}

/**
 * Prüft ob die Pose-Confidence für eine valide Messung ausreicht.
 * Mindestens 0.7 für alle drei Landmarks.
 */
export function isValidPose(
    landmarks: PoseLandmark[],
    indices: [number, number, number],
    minConfidence: number = 0.7
): boolean {
    return indices.every(i =>
        landmarks[i] &&
        landmarks[i].visibility >= minConfidence
    );
}

/**
 * Glättet Winkelmessungen über einen Zeitfenster (Moving Average).
 * Verhindert Sprünge durch einzelne fehlerhafte Frames.
 */
export function smoothAngle(
    angleBuffer: number[],
    windowSize: number = 5
): number {
    if (angleBuffer.length === 0) return 0;
    const window = angleBuffer.slice(-windowSize);
    return window.reduce((sum, a) => sum + a, 0) / window.length;
}

/**
 * Erkennt die stabile Endposition (Patient hält still).
 * Gibt true zurück wenn der Winkel sich über N Frames kaum ändert.
 */
export function isStablePosition(
    angleBuffer: number[],
    threshold: number = 2,    // Max. Abweichung in Grad
    minFrames: number = 15    // ~0.5s bei 30fps
): boolean {
    if (angleBuffer.length < minFrames) return false;
    const recent = angleBuffer.slice(-minFrames);
    const avg = recent.reduce((s, a) => s + a, 0) / recent.length;
    return recent.every(a => Math.abs(a - avg) <= threshold);
}
