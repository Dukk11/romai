import { Milestone } from '../types';

export const KNEE_TEP_MILESTONES: Milestone[] = [
    // Flexion Meilensteine
    { weekPostOp: 1, jointType: 'knee', movementType: 'flexion', targetAngle: 70, label: 'Woche 1: 70° Flexion', priority: 'critical' },
    { weekPostOp: 2, jointType: 'knee', movementType: 'flexion', targetAngle: 80, label: 'Woche 2: 80° Flexion', priority: 'critical' },
    { weekPostOp: 4, jointType: 'knee', movementType: 'flexion', targetAngle: 90, label: 'Woche 4: 90° Flexion', priority: 'critical' },
    { weekPostOp: 6, jointType: 'knee', movementType: 'flexion', targetAngle: 100, label: 'Woche 6: 100° Flexion', priority: 'target' },
    { weekPostOp: 8, jointType: 'knee', movementType: 'flexion', targetAngle: 110, label: 'Woche 8: 110° Flexion', priority: 'target' },
    { weekPostOp: 12, jointType: 'knee', movementType: 'flexion', targetAngle: 120, label: 'Woche 12: 120° Flexion', priority: 'stretch' },

    // Extension Meilensteine
    { weekPostOp: 1, jointType: 'knee', movementType: 'extension', targetAngle: 10, label: 'Woche 1: <10° Extensionsdefizit', priority: 'critical' },
    { weekPostOp: 4, jointType: 'knee', movementType: 'extension', targetAngle: 5, label: 'Woche 4: <5° Extensionsdefizit', priority: 'critical' },
    { weekPostOp: 8, jointType: 'knee', movementType: 'extension', targetAngle: 0, label: 'Woche 8: Volle Extension', priority: 'target' },
];

export const SHOULDER_OP_MILESTONES: Milestone[] = [
    { weekPostOp: 2, jointType: 'shoulder', movementType: 'flexion', targetAngle: 90, label: 'Woche 2: 90° Flexion (passiv)', priority: 'critical' },
    { weekPostOp: 6, jointType: 'shoulder', movementType: 'flexion', targetAngle: 120, label: 'Woche 6: 120° Flexion', priority: 'target' },
    { weekPostOp: 6, jointType: 'shoulder', movementType: 'abduction', targetAngle: 90, label: 'Woche 6: 90° Abduktion', priority: 'target' },
    { weekPostOp: 12, jointType: 'shoulder', movementType: 'flexion', targetAngle: 160, label: 'Woche 12: 160° Flexion', priority: 'stretch' },
    { weekPostOp: 12, jointType: 'shoulder', movementType: 'abduction', targetAngle: 150, label: 'Woche 12: 150° Abduktion', priority: 'stretch' },
];

/**
 * Alert-Logik: Erkennt Stagnation und Regression
 */
export function checkForAlerts(
    measurements: { angle: number; timestamp: string }[],
    jointType: string,
    movementType: string
): { type: string; message: string; severity: string } | null {
    if (measurements.length < 5) return null;

    const recent = measurements.slice(0, 5); // neueste 5
    const angles = recent.map(m => m.angle);

    // Stagnation: Keine Verbesserung über 5 Messungen
    const range = Math.max(...angles) - Math.min(...angles);
    if (range < 3) {
        return {
            type: 'stagnation',
            message: `Ihre ${movementType === 'flexion' ? 'Beugung' : 'Streckung'} stagniert seit ${recent.length} Messungen. Sprechen Sie mit Ihrem Therapeuten.`,
            severity: 'warning',
        };
    }

    // Regression: Abnahme von ≥5° über 3 Tage
    if (measurements.length >= 3) {
        const newest = measurements[0].angle;
        const thirdOldest = measurements[2].angle;
        if (thirdOldest - newest >= 5) {
            return {
                type: 'regression',
                message: `Ihre ${movementType === 'flexion' ? 'Beugung' : 'Streckung'} hat sich um ${Math.round(thirdOldest - newest)}° verschlechtert. Bitte kontaktieren Sie Ihren Arzt.`,
                severity: 'critical',
            };
        }
    }

    return null;
}
