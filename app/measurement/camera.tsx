import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { calculateROM, smoothAngle, isStablePosition } from '../../src/utils/angleCalculation';
import { Colors } from '../../src/constants/colors';
import { JOINT_CONFIGS } from '../../src/constants/joints';
import { useSettingsStore } from '../../src/stores/userStore';

const { width, height } = Dimensions.get('window');

/**
 * Kamera-Screen für die Gelenk-Winkelmessung.
 *
 * AKTUELLER STATUS: Simulationsmodus
 * - Die Pose-Erkennung nutzt aktuell simulierte Werte
 * - TODO: BlazePose/MoveNet über react-native-vision-camera Frame Processor Plugin integrieren
 * - Die gesamte Mess-Pipeline (Stabilität, Smoothing, Auto-Freeze) ist bereits produktionsreif
 */
export default function CameraScreen({ route, navigation }: any) {
    const { jointKey } = route?.params || { jointKey: 'knee_right' };
    const jointConfig = JOINT_CONFIGS[jointKey] || JOINT_CONFIGS['knee_right'];
    const activeMovement = jointConfig.movements[0];
    const { stabilityThreshold, stabilityFrames } = useSettingsStore();

    // Vision Camera Hooks
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');

    const [currentAngle, setCurrentAngle] = useState(0);
    const [isStable, setIsStable] = useState(false);
    const [measurementDone, setMeasurementDone] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [isAligned, setIsAligned] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [frameCount, setFrameCount] = useState(0);

    const angleBufferRef = useRef<number[]>([]);
    const isFrozenRef = useRef(false);
    const isAlignedRef = useRef(false);
    const measurementDoneRef = useRef(false);

    // Refs synchron halten mit State
    useEffect(() => { isFrozenRef.current = isFrozen; }, [isFrozen]);
    useEffect(() => { isAlignedRef.current = isAligned; }, [isAligned]);
    useEffect(() => { measurementDoneRef.current = measurementDone; }, [measurementDone]);

    // State-Update vom Worklet-Thread
    const updateMeasurementState = useCallback((rawAngle: number) => {
        if (isFrozenRef.current || measurementDoneRef.current) return;

        // Alignment-Phase: Erster erkannter Frame aktiviert das Tracking
        if (!isAlignedRef.current) {
            setIsAligned(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }

        const romAngle = calculateROM(rawAngle, jointConfig.id, activeMovement.type);

        // Buffer-Management
        angleBufferRef.current.push(romAngle);
        if (angleBufferRef.current.length > 20) {
            angleBufferRef.current.shift();
        }

        const smoothed = smoothAngle(angleBufferRef.current, 5);
        setCurrentAngle(Math.round(smoothed));
        setFrameCount(prev => prev + 1);

        // Stabilitätsprüfung
        const currentlyStable = isStablePosition(angleBufferRef.current, stabilityThreshold, stabilityFrames);

        setIsStable((prevStable) => {
            if (!prevStable && currentlyStable) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            return currentlyStable;
        });
    }, [jointConfig.id, activeMovement.type, stabilityThreshold, stabilityFrames]);

    // Frame Processor (Worklet-Thread)
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        // TODO: Hier BlazePose/MoveNet Frame Processor Plugin einsetzen
        // Beispiel: const poses = detectPose(frame);
        // const angle = calculateAngleFromKeypoints(poses[0], jointConfig.landmarkTriple);

        // SIMULATION: Realistischere Werte mit langsamer Drift statt Random-Sprüngen
        const baseAngle = 90;
        const noise = (Math.random() - 0.5) * 6; // +/- 3° Rauschen
        const simulatedAngle = baseAngle + noise;

        runOnJS(updateMeasurementState)(simulatedAngle);
    }, [updateMeasurementState]);

    // Auto-Freeze bei stabiler Position
    useEffect(() => {
        if (isStable && !isFrozen) {
            const timer = setTimeout(() => {
                triggerConfirmation();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isStable, isFrozen]);

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Wir benötigen Zugang zur Kamera.</Text>
                <TouchableOpacity style={styles.saveButton} onPress={requestPermission}>
                    <Text style={styles.saveButtonText}>Berechtigung erteilen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (device == null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Keine Kamera gefunden</Text>
            </View>
        );
    }

    const triggerConfirmation = () => {
        setIsFrozen(true);
        setValidationError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const confirmAndSave = () => {
        try {
            setMeasurementDone(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const bodySide = jointKey.includes('left') ? 'left' : jointKey.includes('right') ? 'right' : 'left';

            navigation.replace('Result', {
                angle: currentAngle,
                jointType: jointConfig.id,
                movementType: activeMovement.type,
                bodySide: bodySide,
                jointLabel: jointConfig.label
            });
        } catch (error: any) {
            Alert.alert("Navigationsfehler", error?.message);
        }
    };

    const retakeMeasurement = () => {
        setIsFrozen(false);
        setIsStable(false);
        angleBufferRef.current = [];
        setFrameCount(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const getTrafficLightColor = () => {
        if (!isAligned) return Colors.error[500];
        if (!isStable) return Colors.warning[500];
        return Colors.success[500];
    };

    const renderGhostOverlay = () => {
        const color = getTrafficLightColor();
        const sw = "6";

        if (jointKey.includes('knee') || jointKey.includes('hip') || jointKey.includes('ankle')) {
            return (
                <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <Line x1={width / 2} y1={height * 0.3} x2={width / 2} y2={height * 0.6} stroke={color} strokeWidth={sw} strokeDasharray="10, 10" />
                    <Line x1={width / 2} y1={height * 0.6} x2={width / 2} y2={height * 0.9} stroke={color} strokeWidth={sw} strokeDasharray="10, 10" />
                    <Circle cx={width / 2} cy={height * 0.6} r="16" fill="transparent" stroke={color} strokeWidth="4" />
                </Svg>
            );
        } else {
            return (
                <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <Line x1={width / 2} y1={height * 0.3} x2={width / 2} y2={height * 0.5} stroke={color} strokeWidth={sw} strokeDasharray="10, 10" />
                    <Line x1={width * 0.7} y1={height * 0.5} x2={width / 2} y2={height * 0.5} stroke={color} strokeWidth={sw} strokeDasharray="10, 10" />
                    <Circle cx={width / 2} cy={height * 0.5} r="16" fill="transparent" stroke={color} strokeWidth="4" />
                </Svg>
            );
        }
    };

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={!isFrozen}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
            />

            {/* Ghost-Overlay für Positionierung */}
            {!isAligned && (
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 10 }]}>
                    {renderGhostOverlay()}
                </View>
            )}

            {/* Winkelanzeige */}
            <View style={[styles.angleDisplay, { top: height * 0.42, left: 16, right: 16 }]}>
                {isAligned ? (
                    <View style={styles.angleContainer}>
                        <Text style={[
                            styles.angleValue,
                            {
                                color: (currentAngle >= activeMovement.normalRange[0] && currentAngle <= activeMovement.normalRange[1])
                                    ? Colors.success[500]
                                    : Colors.warning[500]
                            }
                        ]}>
                            {currentAngle}°
                        </Text>
                        <Text style={styles.angleTarget}>
                            Ziel: {activeMovement.normalRange[1]}°
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.angleLoading}>
                        Warte auf Pose-Erkennung...
                    </Text>
                )}
            </View>

            {/* Simulation Badge */}
            <View style={styles.simBadge}>
                <Text style={styles.simText}>DEMO-MODUS</Text>
            </View>

            {/* Anleitungstext */}
            {!isFrozen && (
                <View style={styles.instructionBanner}>
                    <Text style={styles.instructionTitle}>{jointConfig.label}</Text>
                    {activeMovement.instructions.map((inst: string, idx: number) => (
                        <Text key={idx} style={styles.instructionText}>
                            {idx + 1}. {inst}
                        </Text>
                    ))}
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                {isFrozen ? (
                    <View style={styles.confirmationBox}>
                        <Text style={styles.confirmationTitle}>{currentAngle}° erfasst</Text>
                        <Text style={styles.confirmationSubtitle}>
                            {activeMovement.label} - Wert eintragen?
                        </Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.retakeButton} onPress={retakeMeasurement}>
                                <Text style={styles.retakeButtonText}>Wiederholen</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={confirmAndSave}>
                                <Text style={styles.confirmButtonText}>Eintragen</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                        {!isAligned ? (
                            <View style={styles.statusBoxWarning}>
                                <Text style={styles.statusTextWarning}>Bitte Gelenkmittelpunkt im Bild positionieren...</Text>
                            </View>
                        ) : validationError ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{validationError}</Text>
                            </View>
                        ) : (
                            <View style={styles.statusBox}>
                                <Text style={[styles.statusText, isStable ? styles.statusSuccess : {}]}>
                                    {isStable ? 'Stabile Position erkannt' : `Messung läuft... (${frameCount} Frames)`}
                                </Text>
                            </View>
                        )}

                        {/* Manueller Auslöser als Fallback */}
                        {isAligned && !isStable && frameCount > 20 && (
                            <TouchableOpacity style={styles.manualCaptureButton} onPress={triggerConfirmation}>
                                <Text style={styles.manualCaptureText}>Manuell erfassen</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    text: { color: 'white', fontSize: 18, textAlign: 'center', marginTop: 100 },
    instructionBanner: {
        position: 'absolute', top: 60, left: 16, right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)', padding: 16, borderRadius: 12,
    },
    instructionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    instructionText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, textAlign: 'left', marginBottom: 4 },
    angleDisplay: { position: 'absolute', alignItems: 'center' },
    angleContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
    angleValue: { fontSize: 56, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
    angleTarget: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    angleLoading: { fontSize: 18, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    simBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(231,76,60,0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    simText: { color: 'white', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    footer: { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center' },
    statusBox: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 12 },
    statusBoxWarning: { backgroundColor: Colors.warning[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 12 },
    errorBox: { backgroundColor: Colors.error[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 12 },
    statusText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    statusTextWarning: { color: Colors.surface, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    errorText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    statusSuccess: { color: Colors.success[500] },
    saveButton: { backgroundColor: Colors.primary[500], paddingVertical: 18, paddingHorizontal: 48, borderRadius: 32, width: '100%', alignItems: 'center', marginTop: 20, marginHorizontal: 16 },
    saveButtonText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' },
    manualCaptureButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    manualCaptureText: { color: 'white', fontSize: 15, fontWeight: '600' },
    confirmationBox: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 24, width: '100%', alignItems: 'center' },
    confirmationTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary[900], marginBottom: 8 },
    confirmationSubtitle: { fontSize: 16, color: Colors.primary[700], marginBottom: 24, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
    retakeButton: { flex: 1, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary[200], paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    retakeButtonText: { color: Colors.primary[700], fontSize: 16, fontWeight: 'bold' },
    confirmButton: { flex: 1, backgroundColor: Colors.success[500], paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    confirmButtonText: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' }
});
