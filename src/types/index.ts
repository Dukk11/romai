// === JOINTS ===
export type JointType = 'knee' | 'shoulder' | 'hip' | 'elbow' | 'ankle' | 'wrist' | 'fingers';

export type MovementType =
  | 'flexion' | 'extension'
  | 'abduction' | 'adduction'
  | 'internal_rotation' | 'external_rotation'
  | 'dorsiflexion' | 'plantarflexion'
  | 'pronation' | 'supination';

export type BodySide = 'left' | 'right';

export interface JointConfig {
  id: JointType;
  label: string;          // "Knie", "Schulter" etc.
  movements: MovementConfig[];
  icon: string;           // Emoji oder Icon-Name
  landmarkTriple: [number, number, number]; // MediaPipe Landmark-Indices
}

export interface MovementConfig {
  type: MovementType;
  label: string;           // "Flexion", "Extension" etc.
  normalRange: [number, number]; // [min, max] in Grad für gesundes Gelenk
  cameraPosition: 'sagittal' | 'frontal'; // Wie das Smartphone stehen soll
  instructions: string[];   // Anleitungsschritte
}

// === MEASUREMENTS ===
export interface Measurement {
  id: string;                 // UUID
  jointType: JointType;
  movementType: MovementType;
  bodySide: BodySide;
  angle: number;              // Gemessener Winkel in Grad
  neutralZeroFormat?: string; // Neu: "130-0-5" (Neutral-0-Methode)
  confidence: number;         // Pose Estimation Confidence (0-1)
  timestamp: string;          // ISO 8601
  videoFrameUri?: string;     // Lokaler Pfad zum Standbild
  notes?: string;             // Patientennotiz
  painLevel?: number;         // VAS 0-10
  syncStatus: 'pending' | 'synced' | 'failed';
  userId: string;
}

export interface MeasurementSession {
  id: string;
  measurements: Measurement[];
  startTime: string;
  endTime: string;
  jointType: JointType;
  bodySide: BodySide;
}

// === USER ===
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  diagnosis?: string;         // Freitext oder ICD-10
  operationDate?: string;     // Datum der OP
  operationType?: string;
  targetJoint?: JointType;
  targetSide?: BodySide;
  treatingPhysician?: string;
  physiotherapist?: string;
}

// === MILESTONES ===
export interface Milestone {
  weekPostOp: number;
  jointType: JointType;
  movementType: MovementType;
  targetAngle: number;
  label: string;             // z.B. "6 Wochen: 90° Flexion"
  priority: 'critical' | 'target' | 'stretch';
}

// === ALERTS ===
export interface Alert {
  id: string;
  type: 'stagnation' | 'regression' | 'milestone_reached' | 'milestone_missed';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  relatedMeasurements: string[]; // Measurement IDs
}

// === POSE ESTIMATION ===
export interface PoseLandmark {
  x: number;       // 0-1 normalisiert
  y: number;       // 0-1 normalisiert
  z: number;       // Tiefe (relativ)
  visibility: number; // 0-1
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  timestamp: number;
}
