import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { JOINT_LIST } from '../../src/constants/joints';
import { useSettingsStore } from '../../src/stores/userStore';

export default function SelectJointScreen({ navigation }: any) {
    const { setDefaultJoint, setDefaultSide } = useSettingsStore();

    const handleSelectJoint = (jointKey: string) => {
        const selected = JOINT_LIST.find(j => j.key === jointKey);
        if (selected) {
            // Update preferences
            setDefaultJoint(selected.id);
            setDefaultSide(jointKey.includes('left') ? 'left' : 'right');

            // Navigate to camera and pass the joint config key
            navigation.replace('Camera', { jointKey });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Was möchten Sie messen?</Text>
                <Text style={styles.subtitle}>Wählen Sie das zu messende Gelenk aus.</Text>
            </View>

            <FlatList
                data={JOINT_LIST}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleSelectJoint(item.key)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.icon}>{item.icon}</Text>
                            <Text style={styles.cardTitle}>{item.label}</Text>
                        </View>

                        <View style={styles.movementList}>
                            {item.movements.map((mov, idx) => (
                                <Text key={idx} style={styles.movementItem}>
                                    • {mov.label} (Norm: ~{mov.normalRange[1]}°)
                                </Text>
                            ))}
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 48,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200]
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.neutral[800],
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: Colors.neutral[500],
    },
    listContent: {
        padding: 16,
        paddingBottom: 40
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: Colors.neutral[800],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.neutral[200]
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    icon: {
        fontSize: 32,
        marginRight: 16
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.neutral[800]
    },
    movementList: {
        marginLeft: 48
    },
    movementItem: {
        fontSize: 14,
        color: Colors.neutral[600],
        marginBottom: 4
    }
});
