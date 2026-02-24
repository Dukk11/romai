import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUserStore } from '../../src/stores/userStore';
import { PatientDashboard } from '../../src/components/PatientDashboard';
import { ProfessionalDashboard } from '../../src/components/ProfessionalDashboard';

export default function HomeScreen({ navigation }: any) {
    const { role } = useUserStore();

    if (role === 'professional') {
        return <ProfessionalDashboard navigation={navigation} />;
    }

    // Default to patient
    return <PatientDashboard navigation={navigation} />;
}
