import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Colors } from '../src/constants/colors';
import { useUserStore } from '../src/stores/userStore';

export default function OnboardingScreen({ navigation }: any) {
    const { setRole } = useUserStore();

    const handleSelectRole = (role: 'patient' | 'professional') => {
        setRole(role);
        // Replace current screen with the Tabs navigator so user cannot go back to Onboarding
        navigation.replace('Tabs');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Willkommen bei ROM.AI</Text>
                    <Text style={styles.subtitle}>Bitte wählen Sie Ihr Profil aus, um fortzufahren.</Text>
                </View>

                <View style={styles.cardsContainer}>
                    {/* Patient Card */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => handleSelectRole('patient')}
                    >
                        <Text style={styles.icon}>👋</Text>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>Ich bin Patient(in)</Text>
                            <Text style={styles.cardDesc}>
                                Ich möchte meine eigene Gelenkbeweglichkeit messen und meinen Fortschritt verfolgen.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Professional Card */}
                    <TouchableOpacity
                        style={[styles.card, styles.professionalCard]}
                        onPress={() => handleSelectRole('professional')}
                    >
                        <Text style={styles.icon}>🩺</Text>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>Mediziner / Physio</Text>
                            <Text style={styles.cardDesc}>
                                Ich möchte ROM.AI kliniknah für meine Patienten nutzen und verwalten.
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 48,
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.primary[900],
        marginBottom: 12,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        color: Colors.neutral[600],
        textAlign: 'center',
        lineHeight: 24
    },
    cardsContainer: {
        gap: 20
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: Colors.neutral[800],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    professionalCard: {
        backgroundColor: Colors.primary[50], // Slightly highlight the professional version
        borderColor: Colors.primary[100]
    },
    icon: {
        fontSize: 48,
        marginRight: 20
    },
    cardText: {
        flex: 1
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.neutral[900],
        marginBottom: 8
    },
    cardDesc: {
        fontSize: 14,
        color: Colors.neutral[600],
        lineHeight: 20
    }
});
