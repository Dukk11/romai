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
    const bcZ = (c.z || 0) - (b.z || 0);

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

        case 'elbow_flexion':
            // Ellenbogen: 180° = gestreckt (0° Flexion)
            return Math.max(0, 180 - rawAngle);

        case 'elbow_extension':
            // Extension: Gestreckt ist Neutral-0.
            return 180 - rawAngle;

        case 'wrist_flexion': // Palmarflexion (Hand nach unten)
        case 'wrist_extension': // Dorsalextension (Hand nach oben)
            // Handgelenk: 180° = gerade (0° in Neutral-0), abknicken reduziert den Innenwinkel.
            return Math.abs(180 - rawAngle);

        case 'ankle_dorsiflexion':
        case 'ankle_plantarflexion':
            // Sprunggelenk: Unterschenkel zu Fuß (ca. 90° = Neutral-0)
            // Abweichungen von 90° sind die ROM-Werte
            return Math.abs(90 - rawAngle);

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
    threshold: number = 4,    // Max. Abweichung in Grad (erhöht für leichtere Erkennung)
    minFrames: number = 10    // (reduziert für schnellere Erkennung)
): boolean {
    if (angleBuffer.length < minFrames) return false;
    const recent = angleBuffer.slice(-minFrames);
    const avg = recent.reduce((s, a) => s + a, 0) / recent.length;
    return recent.every(a => Math.abs(a - avg) <= threshold);
}

/**
 * Berechnet die Beckenneigung aus den Hüft-Keypoints.
 * Wird zur Erkennung von Ausweichbewegungen bei Hüft-/Kniemessungen verwendet.
 *
 * @param leftHip Linker Hüftpunkt (mit x, y Koordinaten)
 * @param rightHip Rechter Hüftpunkt (mit x, y Koordinaten)
 * @returns Neigungswinkel in Grad (0 = gerade, positiv = links höher)
 */
export function calculatePelvicTilt(
    leftHip: { x: number; y: number },
    rightHip: { x: number; y: number }
): number {
    const dx = rightHip.x - leftHip.x;
    const dy = rightHip.y - leftHip.y;
    if (dx === 0) return dy > 0 ? 90 : -90;
    const angleRad = Math.atan2(dy, dx);
    return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Formatiert einen Winkelwert in die Neutral-0-Methode.
 * Klinischer Standard: Extension / 0 / Flexion (z.B. "0-0-130" für 130° Knieflexion)
 */
export function formatNeutralZero(
    angle: number,
    jointType: string,
    movementType: string
): string {
    switch (`${jointType}_${movementType}`) {
        case 'knee_flexion':
            return `0-0-${angle}`;
        case 'knee_extension':
            return angle >= 0 ? `${angle}-0-0` : `0-${Math.abs(angle)}-0`;
        case 'hip_flexion':
            return `0-0-${angle}`;
        case 'hip_abduction':
            return `0-0-${angle}`;
        case 'shoulder_flexion':
            return `0-0-${angle}`;
        case 'shoulder_abduction':
            return `0-0-${angle}`;
        case 'elbow_flexion':
            return `0-0-${angle}`;
        case 'elbow_extension':
            return angle >= 0 ? `${angle}-0-0` : `0-${Math.abs(angle)}-0`;
        case 'ankle_dorsiflexion':
            return `${angle}-0-0`;
        case 'ankle_plantarflexion':
            return `0-0-${angle}`;
        default:
            return `${angle}°`;
    }
}
