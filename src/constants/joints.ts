import { JointConfig } from '../types';

export const JOINT_CONFIGS: Record<string, JointConfig> = {
    // Kniegelenk-Streckung/Beugung: 10 - 0 - 130
    knee_left: {
        id: 'knee',
        label: 'Knie (links)',
        icon: '🦵',
        landmarkTriple: [23, 25, 27], // Hüfte → Knie → Sprunggelenk
        movements: [
            {
                type: 'flexion',
                label: 'Flexion (Beugung)',
                normalRange: [0, 150], // Updated: 0-150
                cameraPosition: 'sagittal',
                instructions: ['Stehen Sie seitlich zur Kamera', 'Ein Bein leicht nach hinten', 'Beugen Sie das Knie so weit wie möglich'],
            },
            {
                type: 'extension',
                label: 'Extension (Streckung)',
                normalRange: [0, 10],
                cameraPosition: 'sagittal',
                instructions: ['Setzen Sie sich', 'Bein ausstrecken', 'Knie durchdrücken'],
            },
        ],
    },
    knee_right: {
        id: 'knee',
        label: 'Knie (rechts)',
        icon: '🦵',
        landmarkTriple: [24, 26, 28],
        movements: [
            {
                type: 'flexion',
                label: 'Flexion (Beugung)',
                normalRange: [0, 150], // Updated: 0-150
                cameraPosition: 'sagittal',
                instructions: ['Stehen Sie seitlich zur Kamera', 'Ein Bein leicht nach hinten', 'Beugen Sie das Knie so weit wie möglich'],
            },
            {
                type: 'extension',
                label: 'Extension (Streckung)',
                normalRange: [0, 10],
                cameraPosition: 'sagittal',
                instructions: ['Setzen Sie sich', 'Bein ausstrecken', 'Knie durchdrücken'],
            },
        ],
    },

    // Hüftgelenk-Streckung/Beugung: 10 - 0 - 130
    // Hüftgelenk-Abspreizung/Anführung: 40 - 0 - 30
    hip_left: {
        id: 'hip',
        label: 'Hüfte (links)',
        icon: '🚶',
        landmarkTriple: [11, 23, 25], // Schulter → Hüfte → Knie
        movements: [
            {
                type: 'flexion',
                label: 'Flexion (Beugung)',
                normalRange: [0, 120], // Updated: 0-120
                cameraPosition: 'sagittal',
                instructions: ['Liegen Sie auf dem Rücken', 'Ziehen Sie das Knie in Richtung Brust'],
            },
            {
                type: 'abduction',
                label: 'Abduktion (Abspreizung)',
                normalRange: [0, 40],
                cameraPosition: 'frontal',
                instructions: ['Liegen Sie auf dem Rücken', 'Spreizen Sie das Bein gestreckt zur Seite'],
            }
        ],
    },
    hip_right: {
        id: 'hip',
        label: 'Hüfte (rechts)',
        icon: '🚶',
        landmarkTriple: [12, 24, 26],
        movements: [
            {
                type: 'flexion',
                label: 'Flexion (Beugung)',
                normalRange: [0, 120], // Updated: 0-120
                cameraPosition: 'sagittal',
                instructions: ['Liegen Sie auf dem Rücken', 'Ziehen Sie das Knie in Richtung Brust'],
            },
            {
                type: 'abduction',
                label: 'Abduktion (Abspreizung)',
                normalRange: [0, 40],
                cameraPosition: 'frontal',
                instructions: ['Liegen Sie auf dem Rücken', 'Spreizen Sie das Bein gestreckt zur Seite'],
            }
        ],
    },

    // Schultergelenk (Standardwerte ca. 170 Anteversion, 90 Abduktion)
    shoulder_left: {
        id: 'shoulder',
        label: 'Schulter (links)',
        icon: '💪',
        landmarkTriple: [23, 11, 13],
        movements: [
            {
                type: 'flexion',
                label: 'Anteversion',
                normalRange: [0, 180], // Updated: 0-180
                cameraPosition: 'sagittal',
                instructions: ['Arm gestreckt nach vorne oben heben'],
            },
            {
                type: 'abduction',
                label: 'Abduktion',
                normalRange: [0, 180],
                cameraPosition: 'frontal',
                instructions: ['Arm seitlich nach oben heben'],
            },
        ],
    },
    shoulder_right: {
        id: 'shoulder',
        label: 'Schulter (rechts)',
        icon: '💪',
        landmarkTriple: [24, 12, 14],
        movements: [
            {
                type: 'flexion',
                label: 'Anteversion',
                normalRange: [0, 180], // Updated: 0-180
                cameraPosition: 'sagittal',
                instructions: ['Arm gestreckt nach vorne oben heben'],
            },
            {
                type: 'abduction',
                label: 'Abduktion',
                normalRange: [0, 180],
                cameraPosition: 'frontal',
                instructions: ['Arm seitlich nach oben heben'],
            },
        ],
    },

    // NEU: Ellenbogengelenk (Streckung/Beugung: 10 - 0 - 150)
    elbow_left: {
        id: 'elbow',
        label: 'Ellenbogen (links)',
        icon: '🦾',
        landmarkTriple: [11, 13, 15], // Schulter -> Ellenbogen -> Handgelenk
        movements: [
            {
                type: 'flexion',
                label: 'Beugung',
                normalRange: [0, 150],
                cameraPosition: 'sagittal',
                instructions: ['Arm seitlich am Körper', 'Beugen Sie den Unterarm maximal an'],
            },
            {
                type: 'extension',
                label: 'Streckung',
                normalRange: [0, 10],
                cameraPosition: 'sagittal',
                instructions: ['Arm nach unten ausstrecken', 'Ellenbogen durchdrücken'],
            },
        ],
    },
    elbow_right: {
        id: 'elbow',
        label: 'Ellenbogen (rechts)',
        icon: '🦾',
        landmarkTriple: [12, 14, 16],
        movements: [
            {
                type: 'flexion',
                label: 'Beugung',
                normalRange: [0, 150],
                cameraPosition: 'sagittal',
                instructions: ['Arm seitlich am Körper', 'Beugen Sie den Unterarm maximal an'],
            },
            {
                type: 'extension',
                label: 'Streckung',
                normalRange: [0, 10],
                cameraPosition: 'sagittal',
                instructions: ['Arm nach unten ausstrecken', 'Ellenbogen durchdrücken'],
            },
        ],
    },

    // NEU: Handgelenk (Handrückenwärts/Hohlhandwärts: 70 - 0 - 80)
    wrist_left: {
        id: 'wrist' as const,
        label: 'Handgelenk (links)',
        icon: '🖐️',
        landmarkTriple: [13, 15, 17], // Ellenbogen -> Handgelenk -> Kleinfinger
        movements: [
            {
                type: 'flexion', // Palmarflexion
                label: 'Beugung (Hohlhandwärts)',
                normalRange: [0, 80],
                cameraPosition: 'sagittal',
                instructions: ['Unterarm auflegen', 'Hand nach unten abknicken'],
            },
            {
                type: 'extension', // Dorsalextension
                label: 'Streckung (Handrückenwärts)',
                normalRange: [0, 70],
                cameraPosition: 'sagittal',
                instructions: ['Unterarm auflegen', 'Hand nach oben anheben'],
            },
        ],
    },
    wrist_right: {
        id: 'wrist' as const,
        label: 'Handgelenk (rechts)',
        icon: '🖐️',
        landmarkTriple: [14, 16, 18],
        movements: [
            {
                type: 'flexion', // Palmarflexion
                label: 'Beugung (Hohlhandwärts)',
                normalRange: [0, 80],
                cameraPosition: 'sagittal',
                instructions: ['Unterarm auflegen', 'Hand nach unten abknicken'],
            },
            {
                type: 'extension', // Dorsalextension
                label: 'Streckung (Handrückenwärts)',
                normalRange: [0, 70],
                cameraPosition: 'sagittal',
                instructions: ['Unterarm auflegen', 'Hand nach oben anheben'],
            },
        ],
    },

    // NEU: Oberes Sprunggelenk (Heben/Senken: 20-0-50)
    ankle_left: {
        id: 'ankle',
        label: 'Sprunggelenk (links)',
        icon: '🦶',
        landmarkTriple: [25, 27, 31], // Knie -> Sprunggelenk -> Fußspitze
        movements: [
            {
                type: 'dorsiflexion',
                label: 'Heben (Dorsalextension)',
                normalRange: [0, 20], // 0-20
                cameraPosition: 'sagittal',
                instructions: ['Bein ausstrecken', 'Fußspitze hochziehen'],
            },
            {
                type: 'plantarflexion',
                label: 'Senken (Plantarflexion)',
                normalRange: [0, 45], // Updated: 0-45
                cameraPosition: 'sagittal',
                instructions: ['Bein ausstrecken', 'Fußspitze nach unten strecken'],
            },
        ],
    },
    ankle_right: {
        id: 'ankle',
        label: 'Sprunggelenk (rechts)',
        icon: '🦶',
        landmarkTriple: [26, 28, 32],
        movements: [
            {
                type: 'dorsiflexion',
                label: 'Heben (Dorsalextension)',
                normalRange: [0, 20], // 0-20
                cameraPosition: 'sagittal',
                instructions: ['Bein ausstrecken', 'Fußspitze hochziehen'],
            },
            {
                type: 'plantarflexion',
                label: 'Senken (Plantarflexion)',
                normalRange: [0, 45], // Updated: 0-45
                cameraPosition: 'sagittal',
                instructions: ['Bein ausstrecken', 'Fußspitze nach unten strecken'],
            },
        ],
    },

    // NEU: Finger (Daumen / Langfinger abstrahiert)
    fingers_left: {
        id: 'fingers',
        label: 'Finger / Hand (links)',
        icon: '🖐️',
        landmarkTriple: [15, 17, 19], // Handgelenk -> Kleinfinger -> Zeigefinger
        movements: [
            {
                type: 'flexion',
                label: 'Beugung (Faustschluss)',
                normalRange: [0, 100], // Abstrahiert für MP/PIP/DIP
                cameraPosition: 'sagittal',
                instructions: ['Hand flach ausstrecken', 'Alle Finger zur Faust einrollen'],
            },
            {
                type: 'extension',
                label: 'Streckung',
                normalRange: [0, 10], // Leichte Überstreckung der Grundgelenke
                cameraPosition: 'sagittal',
                instructions: ['Hand flach auflegen', 'Finger maximal durchstrecken'],
            },
        ],
    },
    fingers_right: {
        id: 'fingers',
        label: 'Finger / Hand (rechts)',
        icon: '🖐️',
        landmarkTriple: [16, 18, 20],
        movements: [
            {
                type: 'flexion',
                label: 'Beugung (Faustschluss)',
                normalRange: [0, 100],
                cameraPosition: 'sagittal',
                instructions: ['Hand flach ausstrecken', 'Alle Finger zur Faust einrollen'],
            },
            {
                type: 'extension',
                label: 'Streckung',
                normalRange: [0, 10],
                cameraPosition: 'sagittal',
                instructions: ['Hand flach auflegen', 'Finger maximal durchstrecken'],
            },
        ],
    }
};

// Hilfsarray für die UI Listendarstellung
export const JOINT_LIST = Object.entries(JOINT_CONFIGS).map(([key, value]) => ({
    key,
    ...value
}));
