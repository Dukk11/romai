import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, Camera } from 'expo-camera';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { initTensorFlow, detector, estimateJointAngle } from '../../src/utils/tfPoseEngine';
import { calculateROM, smoothAngle, isStablePosition, calculatePelvicTilt } from '../../src/utils/angleCalculation';
import { Colors } from '../../src/constants/colors';
import { JOINT_CONFIGS } from '../../src/constants/joints';
import { useSettingsStore } from '../../src/stores/userStore';

const { width, height } = Dimensions.get('window');

// CRITICAL: HOC must be defined outside the component to prevent unmounting on every re-render
const TensorCamera = cameraWithTensors(CameraView);

export default function CameraScreen({ route, navigation }: any) {
    const { jointKey } = route?.params || { jointKey: 'knee_right' }; // fallback
    const jointConfig = JOINT_CONFIGS[jointKey] || JOINT_CONFIGS['knee_right'];
    const activeMovement = jointConfig.movements[0]; // z.B. Flexion
    const { stabilityThreshold, stabilityFrames } = useSettingsStore();

    const [permission, requestPermission] = useCameraPermissions();
    const [currentAngle, setCurrentAngle] = useState(0);
    const [isStable, setIsStable] = useState(false);

    const [measurementDone, _setMeasurementDone] = useState(false);
    const measurementRef = React.useRef(false);
    const setMeasurementDone = (val: boolean) => { measurementRef.current = val; _setMeasurementDone(val); };

    const [isFrozen, _setIsFrozen] = useState(false);
    const frozenRef = React.useRef(false);
    const setIsFrozen = (val: boolean) => { frozenRef.current = val; _setIsFrozen(val); };

    // Live Pose Visualization State
    const [activePose, setActivePose] = useState<poseDetection.Pose | null>(null);

    // TFJS State
    const [tfReady, setTfReady] = useState(false);
    const angleBufferRef = React.useRef<number[]>([]);

    // --- Alignment & Validation Logic ---
    const [isAligned, _setIsAligned] = useState(false);
    const alignedRef = React.useRef(false);
    const setIsAligned = (val: boolean) => { alignedRef.current = val; _setIsAligned(val); };

    const [validationError, setValidationError] = useState<string | null>(null);
    const initialJointCenterRef = React.useRef<{ x: number, y: number } | null>(null);

    const [debugText, setDebugText] = useState(""); // DIAGNOSTIC STATE

    // Init ML Model
    useEffect(() => {
        const setupTF = async () => {
            await initTensorFlow();
            setTfReady(true);
        };
        setupTF();
    }, []);

    // Simulate Alignment taking a few seconds
    // We remove the auto-timeout and now rely on the actual pose detection
    // to trigger the alignment state once the user is in frame.

    // --- Real Tracking Logic ---
    const isProcessing = React.useRef(false);

    const handleCameraStream = (images: IterableIterator<tf.Tensor3D>, updateCameraContext: () => void, gl: any) => {
        const loop = async () => {
            if (measurementRef.current || !detector || frozenRef.current) {
                // If frozen or done, just burn the frames without processing to keep the stream alive but static
                const tfImg = images.next().value;
                if (tfImg) tf.dispose(tfImg);

                requestAnimationFrame(loop);
                return;
            }

            // ALWAYS fetch the next tensor to prevent blocking the stream buffer!
            const imageTensor = images.next().value;

            if (!imageTensor) {
                requestAnimationFrame(loop);
                return;
            }

            // We don't discard immediately if frozen, because we want the skeleton to
            // keep rendering its last position on screen. We just skip updates later.

            // If currently processing the previous frame, 
            // dispose this frame immediately to keep the 60fps camera feed smooth.
            if (isProcessing.current) {
                tf.dispose(imageTensor);
                requestAnimationFrame(loop);
                return;
            }

            isProcessing.current = true;
            try {
                const poses = await detector.estimatePoses(imageTensor, {
                    maxPoses: 1,
                    flipHorizontal: false
                });

                if (poses.length > 0) {
                    const pose = poses[0];
                    setActivePose(pose);

                    const triple = jointConfig.landmarkTriple;
                    const p1 = pose.keypoints[triple[0]];
                    const p2 = pose.keypoints[triple[1]];
                    const p3 = pose.keypoints[triple[2]];

                    const s1 = p1?.score || 0;
                    const s2 = p2?.score || 0;
                    const s3 = p3?.score || 0;

                    // Check basic visibility
                    if (s1 < 0.1 || s2 < 0.1 || s3 < 0.1) {
                        setDebugText(`Scores: ${s1.toFixed(2)}, ${s2.toFixed(2)}, ${s3.toFixed(2)} | FAIL (Below 0.1)`);
                        if (alignedRef.current) setIsAligned(false);
                        setValidationError(null);
                    } else {
                        const rawAngle = estimateJointAngle(pose, jointKey);

                        if (rawAngle > 0) {
                            if (!alignedRef.current) {
                                setIsAligned(true); // Updates ref too
                                if (!initialJointCenterRef.current) {
                                    initialJointCenterRef.current = { x: p2.x, y: p2.y };
                                }
                                setValidationError(null);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else if (initialJointCenterRef.current && !frozenRef.current) {
                                // Freeze Check: Only update drift and angles if NOT frozen
                                // If frozen, we just skip this block so the UI keeps displaying the last state 
                                // and the frozen overlay remains active.

                                // Drift validation
                                const dx = initialJointCenterRef.current ? p2.x - initialJointCenterRef.current.x : 0;
                                const dy = initialJointCenterRef.current ? p2.y - initialJointCenterRef.current.y : 0;
                                const drift = Math.sqrt(dx * dx + dy * dy);

                                setDebugText(`Scores: ${s1.toFixed(2)}, ${s2.toFixed(2)}, ${s3.toFixed(2)} | Raw A: ${rawAngle.toFixed(1)} | Drift: ${drift.toFixed(0)}`);

                                const DRIFT_TOLERANCE = 150; // Massively relaxed again just to be safe

                                // Drift validation
                                if (drift > DRIFT_TOLERANCE) {
                                    setValidationError("Gelenk aus dem Fokus gerutscht");
                                    setIsStable(false);
                                } else {
                                    let evasionError: string | null = null;

                                    // Compensatory movement detection (Pelvic Tilt)
                                    if (jointKey.includes('hip') || jointKey.includes('knee')) {
                                        const leftHip = pose.keypoints.find(k => k.name === 'left_hip');
                                        const rightHip = pose.keypoints.find(k => k.name === 'right_hip');

                                        if (leftHip && rightHip && (leftHip.score || 0) > 0.5 && (rightHip.score || 0) > 0.5) {
                                            const tilt = calculatePelvicTilt(leftHip, rightHip);
                                            if (Math.abs(tilt) > 15) {
                                                evasionError = `Ausweichbewegung! Becken schief (${Math.abs(tilt)}°)`;
                                            }
                                        }
                                    }

                                    if (evasionError) {
                                        setValidationError(evasionError);
                                        setIsStable(false);
                                    } else {
                                        setValidationError(null);
                                    }

                                    const romAngle = calculateROM(rawAngle, jointConfig.id, activeMovement.type);

                                    // Buffer management
                                    angleBufferRef.current.push(romAngle);
                                    if (angleBufferRef.current.length > 20) {
                                        angleBufferRef.current.shift();
                                    }

                                    const smoothed = smoothAngle(angleBufferRef.current, 5);
                                    setCurrentAngle(Math.round(smoothed));

                                    // Is Stable? Only freeze if they aren't cheating
                                    const currentlyStable = !evasionError && isStablePosition(angleBufferRef.current, stabilityThreshold, stabilityFrames);
                                    setIsStable((prevStable) => {
                                        if (!prevStable && currentlyStable) {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }
                                        return currentlyStable;
                                    });
                                }
                            }
                        } else {
                            if (alignedRef.current) setIsAligned(false);
                            setValidationError("Punkte verdeckt");
                            setDebugText(`Scores: ${s1.toFixed(2)}, ${s2.toFixed(2)}, ${s3.toFixed(2)} | Angle: FAIL (NaN or 0)`);
                        }
                    }
                }
            } catch (e) {
                console.log("Pose estimation failed frame", e);
            } finally {
                tf.dispose(imageTensor);
                isProcessing.current = false;
            }

            requestAnimationFrame(loop);
        };
        loop();
    };

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Wir benötigen Zugang zur Kamera.</Text>
                <TouchableOpacity style={styles.saveButton} onPress={requestPermission}>
                    <Text style={styles.saveButtonText}>Berechtigung erteilen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const triggerConfirmation = () => {
        setIsFrozen(true);
        setValidationError(null); // Clear any errors
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const confirmAndSave = () => {
        try {
            setMeasurementDone(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const bodySide = jointKey.includes('left') ? 'left' : jointKey.includes('right') ? 'right' : 'left'; // default to left if unknown

            // Pass the actual recorded data to the result screen to save it
            navigation.replace('Result', {
                angle: currentAngle,
                jointType: jointConfig.id,
                movementType: activeMovement.type,
                bodySide: bodySide,
                jointLabel: jointConfig.label
            });
        } catch (error: any) {
            Alert.alert("Navigationsfehler", error?.message || "Konnte ResultScreen nicht laden.");
        }
    };

    const retakeMeasurement = () => {
        setIsFrozen(false);
        setIsStable(false);
        angleBufferRef.current = [];
        initialJointCenterRef.current = null; // Reset the anchor point
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const getTrafficLightColor = () => {
        if (!isAligned) return Colors.error?.[500] || '#E74C3C'; // Red
        if (!isStable) return Colors.warning?.[500] || '#F39C12'; // Yellow
        return Colors.success?.[500] || '#27AE60'; // Green
    };

    const renderGhostOverlay = () => {
        const color = getTrafficLightColor();
        const strokeWidth = "6";

        if (jointKey.includes('knee') || jointKey.includes('hip') || jointKey.includes('ankle')) {
            return (
                <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {/* Ghost: Becken/Hüfte -> Knie -> Knöchel */}
                    <Line x1={width / 2} y1={height * 0.3} x2={width / 2} y2={height * 0.6} stroke={color} strokeWidth={strokeWidth} strokeDasharray="10, 10" />
                    <Line x1={width / 2} y1={height * 0.6} x2={width / 2} y2={height * 0.9} stroke={color} strokeWidth={strokeWidth} strokeDasharray="10, 10" />
                    <Circle cx={width / 2} cy={height * 0.6} r="16" fill="transparent" stroke={color} strokeWidth="4" />
                </Svg>
            );
        } else if (jointKey.includes('shoulder') || jointKey.includes('elbow') || jointKey.includes('wrist')) {
            return (
                <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {/* Ghost: Rumpf/Schulter -> Ellenbogen -> Hand/Unterarm */}
                    <Line x1={width / 2} y1={height * 0.4} x2={width / 2} y2={height * 0.7} stroke={color} strokeWidth={strokeWidth} strokeDasharray="10, 10" />
                    <Line x1={width / 2} y1={height * 0.4} x2={width * 0.2} y2={height * 0.4} stroke={color} strokeWidth={strokeWidth} strokeDasharray="10, 10" />
                    <Circle cx={width / 2} cy={height * 0.4} r="16" fill="transparent" stroke={color} strokeWidth="4" />
                </Svg>
            );
        }

        // Default (Arm/Leg Straight)
        return (
            <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Line x1={width / 2} y1={height * 0.2} x2={width / 2} y2={height * 0.8} stroke={color} strokeWidth={strokeWidth} strokeDasharray="10, 10" />
                <Circle cx={width / 2} cy={height * 0.5} r="16" fill="transparent" stroke={color} strokeWidth="4" />
            </Svg>
        );
    };

    const renderRealSkeleton = () => {
        if (!activePose || !activePose.keypoints) return null;

        const triple = jointConfig.landmarkTriple;
        const p1 = activePose.keypoints[triple[0]];
        const p2 = activePose.keypoints[triple[1]];
        const p3 = activePose.keypoints[triple[2]];

        const minScore = 0.2; // very low for debug visibility
        const dynamicColor = getTrafficLightColor();

        // TensorCamera output dimensions are scaled to the screen width/height.
        // We set resizeWidth=144, resizeHeight=256 to match 16:9 vertical phone aspect ratio.
        const TENSOR_WIDTH = 144;
        const TENSOR_HEIGHT = 256;

        const scaleX = width / TENSOR_WIDTH;
        const scaleY = height / TENSOR_HEIGHT;

        return (
            <Svg height={height} width={width} pointerEvents="none" style={StyleSheet.absoluteFill}>
                {/* 1. Debug: Draw ALL points to see what the ML detects */}
                {activePose.keypoints.map((k, i) => {
                    if ((k.score || 0) < minScore) return null;
                    return <Circle key={i} cx={k.x * scaleX} cy={k.y * scaleY} r="3" fill="rgba(255,255,255,0.4)" />
                })}

                {/* 2. Highlight the specific joint triple if confident enough */}
                {(p1 && p2 && p3 && ((p1.score || 0) > 0.1 && (p2.score || 0) > 0.1 && (p3.score || 0) > 0.1)) && (() => {
                    const x1 = p1.x * scaleX; const y1 = p1.y * scaleY;
                    let x2 = p2.x * scaleX; let y2 = p2.y * scaleY;
                    const x3 = p3.x * scaleX; const y3 = p3.y * scaleY;

                    // LOCK the center joint to the initial position if aligned
                    if (alignedRef.current && initialJointCenterRef.current) {
                        x2 = initialJointCenterRef.current.x * scaleX;
                        y2 = initialJointCenterRef.current.y * scaleY;
                    }

                    // Calculate Vectors for Arc
                    const v1x = x1 - x2; const v1y = y1 - y2;
                    const v2x = x3 - x2; const v2y = y3 - y2;

                    // Normalize
                    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
                    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;

                    const u1x = v1x / mag1; const u1y = v1y / mag1;
                    const u2x = v2x / mag2; const u2y = v2y / mag2;

                    // Arc radius
                    const r = 40;
                    const arcStartX = x2 + u1x * r;
                    const arcStartY = y2 + u1y * r;
                    const arcEndX = x2 + u2x * r;
                    const arcEndY = y2 + u2y * r;

                    // Determine large arc flag
                    const dot = u1x * u2x + u1y * u2y;
                    const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
                    const largeArcFlag = angleRad > Math.PI ? "1" : "0";

                    // Cross product to determine sweep direction
                    const cross = u1x * u2y - u1y * u2x;
                    const sweepFlag = cross > 0 ? "1" : "0";

                    return (
                        <>
                            {/* Protractor Arc */}
                            <Path
                                d={`M ${arcStartX} ${arcStartY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${arcEndX} ${arcEndY}`}
                                fill={`${dynamicColor}33`}
                                stroke={dynamicColor}
                                strokeWidth="3"
                            />
                            {/* Lines */}
                            <Line x1={x2} y1={y2} x2={x1} y2={y1} stroke={dynamicColor} strokeWidth="6" />
                            <Line x1={x2} y1={y2} x2={x3} y2={y3} stroke={dynamicColor} strokeWidth="6" />

                            {/* Base Points */}
                            <Circle cx={x1} cy={y1} r="10" fill="white" stroke={dynamicColor} strokeWidth="2" />
                            <Circle cx={x3} cy={y3} r="10" fill="white" stroke={dynamicColor} strokeWidth="2" />

                            {/* Center Joint */}
                            <Circle cx={x2} cy={y2} r="14" fill={dynamicColor} stroke="white" strokeWidth="3" />
                        </>
                    );
                })()}
            </Svg>
        );
    };

    return (
        <View style={styles.container}>
            {tfReady ? (
                <TensorCamera
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    // TensorCamera Params
                    useCustomShadersToResize={false}
                    cameraTextureHeight={1920}
                    cameraTextureWidth={1080}
                    resizeHeight={256}
                    resizeWidth={144}
                    resizeDepth={3}
                    onReady={handleCameraStream}
                    autorender={true}
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: 'white' }}>Loading TensorFlow AI Engine...</Text>
                </View>
            )}

            {/* Skalierbares Overlay (Ghost) */}
            {!isAligned && (
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 10 }]}>
                    {renderGhostOverlay()}
                </View>
            )}

            {/* Live ML Skeleton (Immer anzeigen für Debugging) */}
            <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 11 }]}>
                {renderRealSkeleton()}
            </View>

            {/* Angle Display prominent next to the joint */}
            <View style={[styles.angleDisplay, { top: height * 0.5 - 20, left: width * 0.5 + 40 }]}>
                {isAligned ? (
                    <Text style={[
                        styles.angleText,
                        {
                            color: (currentAngle >= activeMovement.normalRange[0] && currentAngle <= activeMovement.normalRange[1])
                                ? Colors.success[500]
                                : Colors.warning[500],
                            fontSize: 32 // smaller to fit target
                        }
                    ]}>
                        {currentAngle}° / Ziel: {activeMovement.normalRange[1]}°
                    </Text>
                ) : (
                    <Text style={[styles.angleText, { fontSize: 24, color: 'rgba(255,255,255,0.5)' }]}>
                        {currentAngle}°
                    </Text>
                )}
            </View>

            {/* DEBUG PANEL */}
            <View style={{ position: 'absolute', top: 50, left: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 }}>
                <Text style={{ color: 'lime', fontSize: 12, fontFamily: 'monospace' }}>{debugText}</Text>
            </View>

            {/* Anleitungstext Oben */}
            {!isFrozen && (
                <View style={styles.instructionBanner}>
                    {activeMovement.instructions.map((inst, idx) => (
                        <Text key={idx} style={styles.instructionText}>
                            • {inst}
                        </Text>
                    ))}
                </View>
            )}

            {/* Footer Container */}
            <View style={styles.footer}>
                {isFrozen ? (
                    <View style={styles.confirmationBox}>
                        <Text style={styles.confirmationTitle}>{currentAngle}° erfasst</Text>
                        <Text style={styles.confirmationSubtitle}>Möchtest du diesen Wert eintragen?</Text>
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
                        {/* Status Message Area */}
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
                                    {isStable ? 'Stabile Position erkannt ✓' : 'Messung läuft...'}
                                </Text>
                            </View>
                        )}

                        {/* Always show Freeze Button so user can force a save test at 0 degrees */}
                        <TouchableOpacity style={styles.saveButton} onPress={triggerConfirmation}>
                            <Text style={styles.saveButtonText}>Winkel einfrieren</Text>
                        </TouchableOpacity>
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
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 16,
        borderRadius: 12,
    },
    instructionText: { color: 'white', fontSize: 16, textAlign: 'center', fontWeight: '500' },
    angleDisplay: { position: 'absolute' },
    angleText: { fontSize: 48, fontWeight: 'bold', color: Colors.angleDisplay, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
    footer: { position: 'absolute', bottom: 40, left: 16, right: 16, alignItems: 'center' },
    statusBox: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 16 },
    statusBoxWarning: { backgroundColor: Colors.warning[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 16 },
    errorBox: { backgroundColor: Colors.error[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 16 },
    statusText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    statusTextWarning: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' },
    errorText: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    statusSuccess: { color: Colors.success[500] },
    saveButton: { backgroundColor: Colors.primary[500], paddingVertical: 18, paddingHorizontal: 48, borderRadius: 32, width: '100%', alignItems: 'center' },
    saveButtonText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' },
    confirmationBox: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 24, width: '100%', alignItems: 'center' },
    confirmationTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary[900], marginBottom: 8 },
    confirmationSubtitle: { fontSize: 16, color: Colors.primary[700], marginBottom: 24, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
    retakeButton: { flex: 1, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary[200], paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    retakeButtonText: { color: Colors.primary[700], fontSize: 16, fontWeight: 'bold' },
    confirmButton: { flex: 1, backgroundColor: Colors.success[500], paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    confirmButtonText: { color: Colors.surface, fontSize: 16, fontWeight: 'bold' }
});
