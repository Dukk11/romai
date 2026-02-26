import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { getDatabase, getMeasurements, getLatestMeasurement } from '../services/database';
import { useSettingsStore } from '../stores/userStore';
import { JOINT_CONFIGS } from '../constants/joints';
import { Measurement } from '../types';

const screenWidth = Dimensions.get("window").width;

export function PatientDashboard({ navigation }: any) {
    const { defaultJoint, defaultSide } = useSettingsStore();

    const [currentROM, setCurrentROM] = useState<number | null>(null);
    const [previousROM, setPreviousROM] = useState<number | null>(null);
    const [chartData, setChartData] = useState<number[]>([]);
    const [chartLabels, setChartLabels] = useState<string[]>([]);
    const [measurementCount, setMeasurementCount] = useState(0);
    const [streak, setStreak] = useState(0);

    const jointKey = `${defaultJoint}_${defaultSide}`;
    const config = JOINT_CONFIGS[jointKey];
    const movementType = config?.movements[0]?.type || 'flexion';
    const targetROM = config?.movements[0]?.normalRange[1] || 120;
    const jointLabel = config?.label || 'Gelenk';

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const db = getDatabase();
                    const measurements = await getMeasurements(db, defaultJoint, movementType, defaultSide, 14);

                    setMeasurementCount(measurements.length);

                    if (measurements.length > 0) {
                        setCurrentROM(measurements[0].angle);

                        if (measurements.length > 1) {
                            setPreviousROM(measurements[1].angle);
                        }

                        // Chart: älteste zuerst
                        const reversed = [...measurements].reverse();
                        setChartData(reversed.map(m => m.angle));
                        setChartLabels(reversed.map(m => {
                            const d = new Date(m.timestamp);
                            return `${d.getDate()}.`;
                        }));

                        // Streak berechnen: aufeinanderfolgende Tage mit Messungen
                        setStreak(calculateStreak(measurements));
                    } else {
                        setCurrentROM(null);
                        setPreviousROM(null);
                        setChartData([]);
                        setChartLabels([]);
                    }
                } catch (e) {
                    console.error('Dashboard data load error:', e);
                }
            };
            loadData();
        }, [defaultJoint, defaultSide, movementType])
    );

    const trend = currentROM !== null && previousROM !== null
        ? currentROM - previousROM
        : 0;

    const progress = currentROM !== null
        ? Math.min(100, Math.round((currentROM / targetROM) * 100))
        : 0;

    // Maximal 7 Labels anzeigen um Überlappung zu vermeiden
    const displayLabels = chartLabels.length > 7
        ? chartLabels.map((l, i) => i % Math.ceil(chartLabels.length / 7) === 0 ? l : '')
        : chartLabels;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Guten Tag!</Text>
                <Text style={styles.subtitle}>Ihr heutiges Beweglichkeitstraining</Text>
            </View>

            {/* Motivation Streak */}
            {streak > 0 && (
                <View style={styles.streakCard}>
                    <Text style={styles.streakIcon}>🔥</Text>
                    <View>
                        <Text style={styles.streakTitle}>{streak} {streak === 1 ? 'Tag' : 'Tage'} in Folge</Text>
                        <Text style={styles.streakSub}>Bleiben Sie am Ball!</Text>
                    </View>
                </View>
            )}

            {/* Aktuelle ROM-Card */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>{jointLabel} - {config?.movements[0]?.label || 'Flexion'}</Text>
                <View style={styles.romRow}>
                    <Text style={styles.romValue}>{currentROM !== null ? `${currentROM}°` : '--'}</Text>
                    {trend !== 0 && (
                        <Text style={[styles.trend, { color: trend > 0 ? Colors.success[600] : Colors.error[500] }]}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}° seit letzter Messung
                        </Text>
                    )}
                </View>

                {/* Meilenstein-Tracker */}
                {currentROM !== null && (
                    <>
                        <Text style={styles.milestoneText}>
                            {currentROM >= targetROM
                                ? `Ziel erreicht! (${targetROM}°)`
                                : `Noch ${targetROM - currentROM}° bis zum Ziel: ${targetROM}°`
                            }
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    </>
                )}

                {currentROM === null && (
                    <Text style={styles.emptyHint}>Noch keine Messung vorhanden. Starten Sie Ihre erste Messung!</Text>
                )}
            </View>

            {/* Quick-Action */}
            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SelectJoint')}>
                    <Text style={styles.fabText}>Messung starten</Text>
                </TouchableOpacity>
            </View>

            {/* Verlaufskurve */}
            {chartData.length > 1 && (
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Ihr Fortschritt (letzte {measurementCount} Messungen)</Text>
                    <LineChart
                        data={{
                            labels: displayLabels,
                            datasets: [{ data: chartData }]
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
            )}
        </ScrollView>
    );
}

/**
 * Berechnet wie viele aufeinanderfolgende Tage Messungen vorhanden sind.
 */
function calculateStreak(measurements: Measurement[]): number {
    if (measurements.length === 0) return 0;

    const uniqueDays = new Set<string>();
    measurements.forEach(m => {
        const d = new Date(m.timestamp);
        uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (const dayStr of sortedDays) {
        const checkKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (dayStr === checkKey) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Wenn der erste Tag (heute) fehlt, prüfe gestern
            if (streak === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                const yesterdayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
                if (dayStr === yesterdayKey) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    return streak;
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
    trend: { fontSize: 14, fontWeight: 'bold' },
    chart: { marginVertical: 8, borderRadius: 8 },
    milestoneText: { fontSize: 14, color: Colors.primary[800], marginBottom: 8, fontWeight: '500' },
    progressBarBg: { height: 12, backgroundColor: Colors.neutral[200], borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: 12, backgroundColor: Colors.success[500] },
    actionContainer: { alignItems: 'center', marginVertical: 16 },
    fab: { backgroundColor: Colors.primary[500], paddingVertical: 18, paddingHorizontal: 40, borderRadius: 32, elevation: 4, width: '100%', alignItems: 'center' },
    fabText: { color: Colors.surface, fontSize: 18, fontWeight: 'bold' },
    emptyHint: { fontSize: 14, color: Colors.neutral[500], textAlign: 'center', paddingVertical: 16 }
});
