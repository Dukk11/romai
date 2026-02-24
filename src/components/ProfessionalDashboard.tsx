import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Colors } from '../constants/colors';

const DUMMY_PATIENTS = [
    { id: '1', name: 'Max Mustermann', joint: 'Knie links', lastMeasurement: 'Vor 2 Std.', status: 'warning', issue: 'Stagnation bei Flexion' },
    { id: '2', name: 'Erika Musterfrau', joint: 'Schulter rechts', lastMeasurement: 'Gestern', status: 'success', issue: 'Meilenstein erreicht' },
    { id: '3', name: 'Hans Meier', joint: 'Hüfte links', lastMeasurement: 'Vor 3 Tagen', status: 'error', issue: 'Keine Messung eingetragen' },
];

export function ProfessionalDashboard({ navigation }: any) {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Praxis Übersicht</Text>
                <Text style={styles.subtitle}>Dr. med. ROM.AI</Text>
            </View>

            {/* Quick Action for Clinical Use */}
            <TouchableOpacity style={styles.quickMeasureCard} onPress={() => navigation.navigate('SelectJoint')}>
                <View style={styles.quickMeasureContent}>
                    <Text style={styles.quickMeasureIcon}>⚕️</Text>
                    <View>
                        <Text style={styles.quickMeasureTitle}>Schnell-Messung starten</Text>
                        <Text style={styles.quickMeasureSub}>Neutral-0-Methode am Patienten erfassen</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ihre Patienten</Text>
                <TouchableOpacity>
                    <Text style={styles.linkText}>Alle anzeigen</Text>
                </TouchableOpacity>
            </View>

            {/* Patient List */}
            {DUMMY_PATIENTS.map(patient => (
                <TouchableOpacity key={patient.id} style={styles.patientCard}>
                    <View style={styles.patientHeader}>
                        <Text style={styles.patientName}>{patient.name}</Text>
                        <View style={[styles.statusIndicator,
                        patient.status === 'warning' ? styles.statusWarning :
                            patient.status === 'error' ? styles.statusError : styles.statusSuccess
                        ]} />
                    </View>
                    <Text style={styles.patientDetails}>{patient.joint} • {patient.lastMeasurement}</Text>

                    <View style={[styles.alertBadge,
                    patient.status === 'warning' ? styles.alertWarning :
                        patient.status === 'error' ? styles.alertError : styles.alertSuccess
                    ]}>
                        <Text style={[styles.alertText,
                        patient.status === 'warning' ? styles.alertTextWarning :
                            patient.status === 'error' ? styles.alertTextError : styles.alertTextSuccess
                        ]}>
                            {patient.status === 'warning' ? '⚠️ ' : patient.status === 'error' ? '❗ ' : '✅ '}
                            {patient.issue}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    header: { marginBottom: 24, marginTop: 16 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: Colors.primary[900] },
    subtitle: { fontSize: 16, color: Colors.neutral[600], marginTop: 4 },

    quickMeasureCard: { backgroundColor: Colors.primary[600], borderRadius: 16, padding: 20, marginBottom: 32, elevation: 4 },
    quickMeasureContent: { flexDirection: 'row', alignItems: 'center' },
    quickMeasureIcon: { fontSize: 36, marginRight: 16 },
    quickMeasureTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.surface, marginBottom: 4 },
    quickMeasureSub: { fontSize: 14, color: Colors.primary[100] },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.neutral[800] },
    linkText: { fontSize: 14, color: Colors.primary[600], fontWeight: '600' },

    patientCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.neutral[200] },
    patientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    patientName: { fontSize: 18, fontWeight: 'bold', color: Colors.neutral[900] },
    statusIndicator: { width: 12, height: 12, borderRadius: 6 },
    statusSuccess: { backgroundColor: Colors.success[500] },
    statusWarning: { backgroundColor: Colors.warning[500] },
    statusError: { backgroundColor: Colors.error[500] },

    patientDetails: { fontSize: 14, color: Colors.neutral[500], marginBottom: 12 },

    alertBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    alertSuccess: { backgroundColor: Colors.success[50] },
    alertWarning: { backgroundColor: Colors.warning[50] },
    alertError: { backgroundColor: Colors.error[50] },

    alertText: { fontSize: 14, fontWeight: '600' },
    alertTextSuccess: { color: Colors.success[700] },
    alertTextWarning: { color: Colors.warning[700] },
    alertTextError: { color: Colors.error[700] }
});
