import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../src/constants/colors';
import * as SQLite from 'expo-sqlite';
import { insertMeasurement } from '../../src/services/database';
import { formatNeutralZero } from '../../src/utils/angleCalculation';
import { generateId } from '../../src/utils/generateId';

export default function ResultScreen({ route, navigation }: any) {
    const { angle, jointType, movementType, bodySide, jointLabel, patientId } = route?.params || {};
    const [saving, setSaving] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const saveData = async () => {
            try {
                if (angle === undefined) {
                    // Falls aus irgendeinem Grund keine Daten kamen (zB Reload)
                    setSaving(false);
                    return;
                }

                const neutralZeroFormat = formatNeutralZero(angle, jointType || 'knee', movementType || 'flexion');

                const db = await SQLite.openDatabaseAsync('romai.db');
                const newMeasurement = {
                    id: generateId(),
                    jointType: jointType || 'knee',
                    movementType: movementType || 'flexion',
                    bodySide: bodySide || 'left',
                    angle: angle,
                    neutralZeroFormat: neutralZeroFormat,
                    confidence: 0.9,
                    timestamp: new Date().toISOString(),
                    syncStatus: 'pending' as const,
                    userId: 'default_patient', // In future: read from useUserStore
                    patientId: patientId || null
                };

                await insertMeasurement(db, newMeasurement);
                console.log("Measurement saved to DB!", newMeasurement);
            } catch (e) {
                console.error("Failed to save measurement", e);
                Alert.alert("Speicherfehler", "Es gab ein Problem beim Speichern: " + String(e));
            } finally {
                if (isMounted) setSaving(false);
            }
        };

        saveData();

        return () => { isMounted = false; };
    }, [angle, jointType, movementType, bodySide]);

    if (saving) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
                <Text style={{ marginTop: 16, color: Colors.neutral[600] }}>Speichere Messung...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messung abgeschlossen!</Text>

            <View style={styles.circle}>
                <Text style={styles.angleText}>
                    {angle !== undefined ? formatNeutralZero(angle, jointType || 'knee', movementType || 'flexion') : '--'}
                </Text>
            </View>

            <Text style={styles.subtitle}>{jointLabel || 'Unbekanntes Gelenk'}</Text>
            <Text style={styles.note}>Die Daten wurden sicher gespeichert.</Text>

            <TouchableOpacity style={styles.buttonMain} onPress={() => navigation.navigate('Tabs')}>
                <Text style={styles.buttonMainText}>Fertig</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary[800], marginBottom: 32 },
    circle: { width: 220, height: 220, borderRadius: 110, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: Colors.primary[500], marginBottom: 24 },
    angleText: { fontSize: 46, fontWeight: 'bold', color: Colors.primary[600], textAlign: 'center' },
    subtitle: { fontSize: 20, fontWeight: '600', color: Colors.neutral[800], marginBottom: 8 },
    note: { fontSize: 16, color: Colors.success[600], marginBottom: 48 },
    buttonMain: { backgroundColor: Colors.primary[500], paddingVertical: 16, paddingHorizontal: 48, borderRadius: 32, width: '100%', alignItems: 'center' },
    buttonMainText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' }
});
