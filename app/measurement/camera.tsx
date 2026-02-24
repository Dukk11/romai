import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/colors';
import { JOINT_CONFIGS } from '../../src/constants/joints';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ route, navigation }: any) {
    const { jointKey } = route?.params || { jointKey: 'knee_right' }; // fallback
    const jointConfig = JOINT_CONFIGS[jointKey] || JOINT_CONFIGS['knee_right'];
    const activeMovement = jointConfig.movements[0]; // z.B. Flexion

    const [permission, requestPermission] = useCameraPermissions();
    const [currentAngle, setCurrentAngle] = useState(0);
    const [isStable, setIsStable] = useState(false);
    const [measurementDone, setMeasurementDone] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }

        // Simulation der Pose Estimation in einem Intervall
        const interval = setInterval(() => {
            if (measurementDone) return;
            const fakeAngle = 80 + Math.random() * 20;
            setCurrentAngle(Math.round(fakeAngle));

            if (fakeAngle > 95) {
                if (!isStable) {
                    setIsStable(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } else {
                setIsStable(false);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [measurementDone, isStable, permission]);

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

    const handleSave = () => {
        setMeasurementDone(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        navigation.replace('Result');
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
            />

            {/* Skalierbares Overlay */}
            <View style={StyleSheet.absoluteFill}>
                <Svg height={height} width={width}>
                    {/* Dummy Skelett Linien */}
                    <Line x1="150" y1="200" x2="200" y2="400" stroke="white" strokeWidth="4" />
                    <Line x1="200" y1="400" x2="180" y2="600" stroke="white" strokeWidth="4" />

                    {/* Dummy Landmarks */}
                    <Circle cx="150" cy="200" r="12" fill={Colors.success[500]} />
                    <Circle cx="200" cy="400" r="12" fill={Colors.success[500]} />
                    <Circle cx="180" cy="600" r="12" fill={Colors.success[500]} />
                </Svg>
            </View>

            {/* Angle Display prominent next to the joint */}
            <View style={[styles.angleDisplay, { top: 350, left: 220 }]}>
                <Text style={styles.angleText}>{currentAngle}°</Text>
            </View>

            {/* Anleitungstext Oben */}
            <View style={styles.instructionBanner}>
                {activeMovement.instructions.map((inst, idx) => (
                    <Text key={idx} style={styles.instructionText}>
                        • {inst}
                    </Text>
                ))}
            </View>

            {/* Footer Container */}
            <View style={styles.footer}>
                <View style={styles.statusBox}>
                    <Text style={[styles.statusText, isStable ? styles.statusSuccess : {}]}>
                        {isStable ? 'Stabile Position erkannt ✓' : 'Messung läuft...'}
                    </Text>
                </View>

                {isStable && (
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Messung speichern</Text>
                    </TouchableOpacity>
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
    statusText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    statusSuccess: { color: Colors.success[500] },
    saveButton: { backgroundColor: Colors.primary[500], paddingVertical: 18, paddingHorizontal: 48, borderRadius: 32, width: '100%', alignItems: 'center' },
    saveButtonText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' }
});
