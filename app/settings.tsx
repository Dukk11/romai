import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Switch } from 'react-native';
import { Colors } from '../src/constants/colors';
import { useUserStore, useSettingsStore } from '../src/stores/userStore';

export default function SettingsScreen({ navigation }: any) {
    const { role, setRole } = useUserStore();
    const { offlineMode, toggleOfflineMode } = useSettingsStore();

    const handleRoleSwitch = (newRole: 'patient' | 'professional') => {
        setRole(newRole);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeText}>Zurück</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Einstellungen</Text>
                <View style={{ width: 60 }} /> {/* Spacer */}
            </View>

            <ScrollView style={styles.content}>

                {/* Profil & Modus */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App-Modus (Profil)</Text>
                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                            onPress={() => handleRoleSwitch('patient')}
                        >
                            <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>Patient</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleButton, role === 'professional' && styles.roleButtonActive]}
                            onPress={() => handleRoleSwitch('professional')}
                        >
                            <Text style={[styles.roleText, role === 'professional' && styles.roleTextActive]}>Mediziner</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helpText}>
                        Wechseln Sie die Ansicht, um das angepasste Dashboard für Ihren Anwendungsfall zu sehen.
                    </Text>
                </View>

                {/* System Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Offline-Modus</Text>
                            <Text style={styles.settingSub}>Keine Cloud-Synchronisation</Text>
                        </View>
                        <Switch
                            value={offlineMode}
                            onValueChange={toggleOfflineMode}
                            trackColor={{ false: Colors.neutral[300], true: Colors.success[400] }}
                            thumbColor={Colors.surface}
                        />
                    </View>
                </View>

                {/* About Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Info</Text>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>ROM.AI MVP Version</Text>
                        <Text style={styles.infoText}>v1.0.0 (Expo Build)</Text>
                        <Text style={styles.infoTextMini}>© 2026 ROM.AI Analytics</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
    closeButton: { padding: 8 },
    closeText: { color: Colors.primary[600], fontSize: 16, fontWeight: '600' },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.neutral[900] },
    content: { flex: 1, padding: 16 },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.neutral[500], textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },

    // Role Switcher
    roleContainer: { flexDirection: 'row', backgroundColor: Colors.neutral[200], borderRadius: 8, padding: 4, marginBottom: 8 },
    roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
    roleButtonActive: { backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    roleText: { fontSize: 16, fontWeight: '500', color: Colors.neutral[600] },
    roleTextActive: { color: Colors.primary[600], fontWeight: 'bold' },
    helpText: { fontSize: 13, color: Colors.neutral[500], marginTop: 4, marginLeft: 4 },

    // Rows
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 16, borderRadius: 12 },
    settingLabel: { fontSize: 16, fontWeight: '500', color: Colors.neutral[800], marginBottom: 4 },
    settingSub: { fontSize: 13, color: Colors.neutral[500] },

    // Info
    infoBox: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderRadius: 12 },
    infoText: { fontSize: 16, color: Colors.neutral[800], fontWeight: '500', marginBottom: 4 },
    infoTextMini: { fontSize: 12, color: Colors.neutral[400], marginTop: 12 }
});
