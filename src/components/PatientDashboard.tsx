import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export function PatientDashboard({ navigation }: any) {
    const currentROM = 95;
    const targetROM = 110;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Guten Tag!</Text>
                <Text style={styles.subtitle}>Ihr heutiges Beweglichkeitstraining</Text>
            </View>

            {/* Motivation Streak */}
            <View style={styles.streakCard}>
                <Text style={styles.streakIcon}>🔥</Text>
                <View>
                    <Text style={styles.streakTitle}>4 Tage in Folge</Text>
                    <Text style={styles.streakSub}>Bleiben Sie am Ball!</Text>
                </View>
            </View>

            {/* Aktuelle ROM-Card */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>Aktuelle Knie Flexion</Text>
                <View style={styles.romRow}>
                    <Text style={styles.romValue}>{currentROM}°</Text>
                    <Text style={styles.trend}>↑ 5° seit gestern</Text>
                </View>

                {/* Meilenstein-Tracker */}
                <Text style={styles.milestoneText}>Noch {targetROM - currentROM}° bis zum Ziel: {targetROM}°</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(currentROM / targetROM) * 100}%` }]} />
                </View>
            </View>

            {/* Quick-Action */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SelectJoint')}>
                    <Text style={styles.fabText}>Messung starten</Text>
                </TouchableOpacity>
            </View>

            {/* Verlaufskurve */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>Ihr Fortschritt (letzte 14 Tage)</Text>
                <LineChart
                    data={{
                        labels: ["1", "3", "5", "7", "9", "11", "13"],
                        datasets: [{ data: [70, 75, 78, 85, 90, 92, 95] }]
                    }}
                    width={screenWidth - 64}
                    height={180}
                    yAxisSuffix="°"
                    chartConfig={{
                        backgroundColor: Colors.surface,
                        backgroundGradientFrom: Colors.surface,
                        backgroundGradientTo: Colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(46, 134, 193, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
                        style: { borderRadius: 8 },
                        propsForDots: { r: "4", strokeWidth: "2", stroke: Colors.primary[500] }
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    header: { marginBottom: 24, marginTop: 16 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: Colors.primary[900] },
    subtitle: { fontSize: 16, color: Colors.neutral[600], marginTop: 4 },
    streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning[50], padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.warning[200] },
    streakIcon: { fontSize: 32, marginRight: 16 },
    streakTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.warning[800] },
    streakSub: { fontSize: 14, color: Colors.warning[600] },
    card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    cardLabel: { fontSize: 14, color: Colors.neutral[600], marginBottom: 8, fontWeight: '600' },
    romRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
    romValue: { fontSize: 48, fontWeight: 'bold', color: Colors.primary[600] },
    trend: { fontSize: 16, color: Colors.success[600], fontWeight: 'bold' },
    chart: { marginVertical: 8, borderRadius: 8 },
    milestoneText: { fontSize: 14, color: Colors.primary[800], marginBottom: 8, fontWeight: '500' },
    progressBarBg: { height: 12, backgroundColor: Colors.neutral[200], borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: 12, backgroundColor: Colors.success[500] },
    actionContainer: { alignItems: 'center', marginVertical: 16 },
    fab: { backgroundColor: Colors.primary[500], paddingVertical: 18, paddingHorizontal: 40, borderRadius: 32, elevation: 4, width: '100%', alignItems: 'center' },
    fabText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' }
});
