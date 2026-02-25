import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { getMeasurements } from '../../src/services/database';
import { JOINT_CONFIGS } from '../../src/constants/joints';
import { useSettingsStore } from '../../src/stores/userStore';
import { JointType, MovementType, BodySide, Measurement } from '../../src/types';

const screenWidth = Dimensions.get("window").width;

// Vereinfachte Gelenk-Optionen für den Picker
const JOINT_OPTIONS: { key: string; label: string; joint: JointType; movement: MovementType }[] = [
    { key: 'knee_flexion', label: 'Knie Flexion', joint: 'knee', movement: 'flexion' },
    { key: 'knee_extension', label: 'Knie Extension', joint: 'knee', movement: 'extension' },
    { key: 'hip_flexion', label: 'Hüfte Flexion', joint: 'hip', movement: 'flexion' },
    { key: 'hip_abduction', label: 'Hüfte Abduktion', joint: 'hip', movement: 'abduction' },
    { key: 'shoulder_flexion', label: 'Schulter Anteversion', joint: 'shoulder', movement: 'flexion' },
    { key: 'shoulder_abduction', label: 'Schulter Abduktion', joint: 'shoulder', movement: 'abduction' },
    { key: 'elbow_flexion', label: 'Ellenbogen Beugung', joint: 'elbow', movement: 'flexion' },
    { key: 'ankle_dorsiflexion', label: 'Sprunggelenk Heben', joint: 'ankle', movement: 'dorsiflexion' },
    { key: 'ankle_plantarflexion', label: 'Sprunggelenk Senken', joint: 'ankle', movement: 'plantarflexion' },
];

export default function HistoryScreen() {
    const { defaultJoint, defaultSide } = useSettingsStore();

    const [selectedOption, setSelectedOption] = useState(JOINT_OPTIONS[0]);
    const [compareMode, setCompareMode] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [dataLeft, setDataLeft] = useState<Measurement[]>([]);
    const [dataRight, setDataRight] = useState<Measurement[]>([]);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const db = await SQLite.openDatabaseAsync('romai.db');
                    const mLeft = await getMeasurements(db, selectedOption.joint, selectedOption.movement, 'left', 30);
                    const mRight = await getMeasurements(db, selectedOption.joint, selectedOption.movement, 'right', 30);

                    // Show oldest first for chart
                    setDataLeft([...mLeft].reverse());
                    setDataRight([...mRight].reverse());
                } catch (e) {
                    console.error('History load error:', e);
                }
            };
            loadData();
        }, [selectedOption])
    );

    // Chart data (safe fallback to prevent crash)
    const dsLeft = dataLeft.length > 0 ? dataLeft.map(m => m.angle) : [0];
    const dsRight = dataRight.length > 0 ? dataRight.map(m => m.angle) : [0];
    const labels = dataLeft.length > 0
        ? dataLeft.map((m, i) => {
            // Max 8 Labels anzeigen
            if (dataLeft.length > 8 && i % Math.ceil(dataLeft.length / 8) !== 0) return '';
            return new Date(m.timestamp).getDate() + '.';
        })
        : ["--"];

    const datasets = compareMode ? [
        { data: dsLeft, color: () => Colors.primary[500] },
        { data: dsRight, color: () => Colors.warning[500] }
    ] : [
        { data: dsLeft, color: () => Colors.primary[500] }
    ];

    const bestRom = Math.max(...dsLeft, 0);
    const avgRom = dsLeft.length > 0 && dsLeft[0] !== 0
        ? Math.round(dsLeft.reduce((a, b) => a + b, 0) / dsLeft.length)
        : 0;
    const totalCount = dataLeft.length;

    // Neueste zuerst für die Tabelle
    const tableData = [...dataLeft].reverse();

    return (
        <ScrollView style={styles.container}>
            {/* Joint Selector */}
            <TouchableOpacity style={styles.selectorButton} onPress={() => setShowPicker(!showPicker)}>
                <Text style={styles.selectorText}>{selectedOption.label}</Text>
                <Text style={styles.selectorArrow}>{showPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showPicker && (
                <View style={styles.pickerContainer}>
                    {JOINT_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.key}
                            style={[styles.pickerItem, selectedOption.key === opt.key && styles.pickerItemActive]}
                            onPress={() => { setSelectedOption(opt); setShowPicker(false); }}
                        >
                            <Text style={[styles.pickerItemText, selectedOption.key === opt.key && styles.pickerItemTextActive]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.headerRow}>
                <Text style={styles.title}>ROM Verlauf</Text>
                <View style={styles.compareToggleRow}>
                    <Text style={styles.compareLabel}>L/R Vergleich</Text>
                    <Switch value={compareMode} onValueChange={setCompareMode} trackColor={{ false: Colors.neutral[300], true: Colors.primary[300] }} thumbColor={Colors.primary[500]} />
                </View>
            </View>

            {/* Chart */}
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
                        labelColor: () => Colors.neutral[600],
                        style: { borderRadius: 8 },
                        propsForDots: { r: "4" }
                    }}
                    bezier
                    style={styles.chart}
                />
                {compareMode && (
                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.primary[500] }]} />
                            <Text style={styles.legendText}>Links</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.warning[500] }]} />
                            <Text style={styles.legendText}>Rechts</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Statistik-Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Bester ROM</Text>
                    <Text style={styles.statValue}>{bestRom}°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Durchschnitt</Text>
                    <Text style={styles.statValue}>{avgRom}°</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statLabel}>Messungen</Text>
                    <Text style={styles.statValue}>{totalCount}</Text>
                </View>
            </View>

            {/* Tabellarische Übersicht */}
            <View style={styles.table}>
                <Text style={styles.tableTitle}>Einzelne Messungen</Text>
                {tableData.length === 0 && <Text style={styles.emptyText}>Noch keine Messungen für dieses Gelenk.</Text>}
                {tableData.map((item, idx) => (
                    <View key={item.id || idx} style={styles.tableRow}>
                        <Text style={styles.rowDate}>
                            {new Date(item.timestamp).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.rowSide}>{item.bodySide === 'left' ? 'L' : 'R'}</Text>
                        <Text style={styles.rowConfidence}>{Math.round(item.confidence * 100)}%</Text>
                        <Text style={styles.rowVal}>{item.neutralZeroFormat || `${item.angle}°`}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: Colors.primary[200] },
    selectorText: { fontSize: 16, fontWeight: 'bold', color: Colors.primary[700] },
    selectorArrow: { fontSize: 14, color: Colors.primary[500] },
    pickerContainer: { backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 12, elevation: 3, overflow: 'hidden' },
    pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] },
    pickerItemActive: { backgroundColor: Colors.primary[50] },
    pickerItemText: { fontSize: 15, color: Colors.neutral[700] },
    pickerItemTextActive: { color: Colors.primary[700], fontWeight: 'bold' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.primary[900], flex: 1 },
    compareToggleRow: { flexDirection: 'row', alignItems: 'center' },
    compareLabel: { fontSize: 14, color: Colors.neutral[700], marginRight: 8, fontWeight: '600' },
    card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 16, elevation: 2 },
    chart: { marginVertical: 8, borderRadius: 8 },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, color: Colors.neutral[600] },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    statChip: { backgroundColor: Colors.surface, padding: 12, borderRadius: 12, flex: 1, marginHorizontal: 4, alignItems: 'center', elevation: 1 },
    statLabel: { fontSize: 12, color: Colors.neutral[600], marginBottom: 4, textAlign: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary[600] },
    table: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, elevation: 2, marginBottom: 32 },
    tableTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.primary[800], marginBottom: 12 },
    emptyText: { color: Colors.neutral[500], textAlign: 'center', paddingVertical: 16 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
    rowDate: { fontSize: 14, color: Colors.neutral[800], flex: 3 },
    rowSide: { fontSize: 14, color: Colors.neutral[500], flex: 1, textAlign: 'center', fontWeight: '600' },
    rowConfidence: { fontSize: 13, color: Colors.neutral[500], flex: 2, textAlign: 'center' },
    rowVal: { fontSize: 16, fontWeight: 'bold', color: Colors.primary[600], flex: 2, textAlign: 'right' }
});
