import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function ResultScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messung abgeschlossen!</Text>

            <View style={styles.circle}>
                <Text style={styles.angleText}>95°</Text>
            </View>

            <Text style={styles.subtitle}>Knie Flexion (links)</Text>
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
    circle: { width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: Colors.primary[500], marginBottom: 24 },
    angleText: { fontSize: 64, fontWeight: 'bold', color: Colors.primary[600] },
    subtitle: { fontSize: 20, fontWeight: '600', color: Colors.neutral[800], marginBottom: 8 },
    note: { fontSize: 16, color: Colors.success[600], marginBottom: 48 },
    buttonMain: { backgroundColor: Colors.primary[500], paddingVertical: 16, paddingHorizontal: 48, borderRadius: 32, width: '100%', alignItems: 'center' },
    buttonMainText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' }
});
