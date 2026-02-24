import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>ROM Verlauf (Knie Flexion)</Text>

            {/* Großes Diagramm */}
            <View style={styles.card}>
                <LineChart
                    data={{
                        labels: ["01.", "05.", "10.", "15.", "20.", "25."],
                        datasets: [
                            { data: [50, 65, 78, 85, 90, 95], color: (opacity = 1) => Colors.primary[500] }
                        ]
                    }}
                    width={screenWidth - 64}
                    height={220}
                    yAxisSuffix="°"
                    chartConfig={{
                        backgroundColor: Colors.surface,
                        backgroundGradientFrom: Colors.surface,
                        backgroundGradientTo: Colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(46, 134, 193, ${opacity})`,
                        labelColor: (opacity = 1) => Colors.neutral[600],
                        style: { borderRadius: 8 },
                        propsForDots: { r: "4" }
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>

            {/* Statistik-Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Bester ROM</Text>
                    <Text style={styles.statValue}>95°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Ø letzte 7 Tage</Text>
                    <Text style={styles.statValue}>91°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Messungen</Text>
                    <Text style={styles.statValue}>12</Text>
                </View>
            </View>

            {/* Tabellarische Übersicht */}
            <View style={styles.table}>
                <Text style={styles.tableTitle}>Alle Messungen</Text>
                {[
                    { date: 'Heute, 08:30', val: '95°', pain: '2/10' },
                    { date: 'Gestern, 09:15', val: '90°', pain: '3/10' },
                    { date: '22.02., 08:00', val: '85°', pain: '4/10' },
                ].map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={styles.rowDate}>{item.date}</Text>
                        <Text style={styles.rowPain}>Schmerz: {item.pain}</Text>
                        <Text style={styles.rowVal}>{item.val}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.primary[900], marginBottom: 16 },
    card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2 },
    chart: { marginVertical: 8, borderRadius: 8 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    statChip: { backgroundColor: Colors.surface, padding: 12, borderRadius: 12, flex: 1, marginHorizontal: 4, alignItems: 'center', elevation: 1 },
    statLabel: { fontSize: 12, color: Colors.neutral[600], marginBottom: 4, textAlign: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary[600] },
    table: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, elevation: 2, marginBottom: 32 },
    tableTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.primary[800], marginBottom: 12 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
    rowDate: { fontSize: 16, color: Colors.neutral[800], flex: 2 },
    rowPain: { fontSize: 14, color: Colors.neutral[500], flex: 2 },
    rowVal: { fontSize: 18, fontWeight: 'bold', color: Colors.primary[600], flex: 1, textAlign: 'right' }
});
