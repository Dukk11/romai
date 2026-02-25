import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { getMeasurements } from '../../src/services/database';

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
    const [compareMode, setCompareMode] = useState(false);
    const [dataLeft, setDataLeft] = useState<any[]>([]);
    const [dataRight, setDataRight] = useState<any[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                const db = await SQLite.openDatabaseAsync('romai.db');
                const mLeft = await getMeasurements(db, 'knee', 'flexion', 'left', 10);
                const mRight = await getMeasurements(db, 'knee', 'flexion', 'right', 10);

                // Show oldest first
                setDataLeft(mLeft.reverse());
                setDataRight(mRight.reverse());
            };
            loadData();
        }, [])
    );

    // Calculate Chart data safely
    // If no data, render a flat line at 0 so the chart doesn't crash
    const labels = dataLeft.length > 0 ? dataLeft.map(m => new Date(m.timestamp).getDate() + '.') : ["01."];
    const dsLeft = dataLeft.length > 0 ? dataLeft.map(m => m.angle) : [0];
    const dsRight = dataRight.length > 0 ? dataRight.map(m => m.angle) : [0];

    const datasets = compareMode ? [
        { data: dsLeft, color: () => Colors.primary[500] },
        { data: dsRight, color: () => Colors.warning[500] } // Right side in Yellow/Orange
    ] : [
        { data: dsLeft, color: () => Colors.primary[500] }
    ];

    const bestRom = Math.max(...dsLeft, 0);
    const avgRom = dsLeft.length > 0 ? Math.round(dsLeft.reduce((a, b) => a + b, 0) / dsLeft.length) : 0;
    const totalCount = dataLeft.length;
    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>ROM Verlauf (Knie Flexion)</Text>
                <View style={styles.compareToggleRow}>
                    <Text style={styles.compareLabel}>L/R Vergleich</Text>
                    <Switch value={compareMode} onValueChange={setCompareMode} trackColor={{ false: Colors.neutral[300], true: Colors.primary[300] }} thumbColor={Colors.primary[500]} />
                </View>
            </View>

            {/* Großes Diagramm */}
            <View style={styles.card}>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: datasets
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
                    <Text style={styles.statValue}>{bestRom}°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Ø letzte 7 Tage</Text>
                    <Text style={styles.statValue}>{avgRom}°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Messungen</Text>
                    <Text style={styles.statValue}>{totalCount}</Text>
                </View>
            </View>

            {/* Tabellarische Übersicht */}
            <View style={styles.table}>
                <Text style={styles.tableTitle}>Alle Messungen (Links)</Text>
                {dataLeft.length === 0 && <Text style={{ color: Colors.neutral[500] }}>Noch keine Messungen.</Text>}
                {dataLeft.slice().reverse().map((item, idx) => (
                    <View key={item.id || idx} style={styles.tableRow}>
                        <Text style={styles.rowDate}>{new Date(item.timestamp).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                        <Text style={styles.rowPain}>Konfidenz: {Math.round(item.confidence * 100)}%</Text>
                        <Text style={styles.rowVal}>{item.neutralZeroFormat || `${item.angle}°`}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.primary[900], flex: 1 },
    compareToggleRow: { flexDirection: 'row', alignItems: 'center' },
    compareLabel: { fontSize: 14, color: Colors.neutral[700], marginRight: 8, fontWeight: '600' },
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
