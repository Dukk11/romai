import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initDatabase } from './src/services/database';

// Imports für Screens
import TabLayout from './app/(tabs)/_layout';
import CameraScreen from './app/measurement/camera';
import ResultScreen from './app/measurement/result';
import SelectJointScreen from './app/measurement/select-joint';
import OnboardingScreen from './app/onboarding';
import SettingsScreen from './app/settings';
import { useUserStore } from './src/stores/userStore';
import { Colors } from './src/constants/colors';

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);
  const { role } = useUserStore();

  // Warten bis Zustand-Store rehydriert ist (aus AsyncStorage)
  const hasHydrated = useUserStore((s: any) => s._hasHydrated !== false);

  React.useEffect(() => {
    initDatabase().then(() => {
      setDbInitialized(true);
      console.log('Database initialized');
    }).catch(e => {
      console.error('DB init failed:', e);
      setDbError(String(e));
    });
  }, []);

  if (dbError) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.errorTitle}>Datenbankfehler</Text>
        <Text style={loadingStyles.errorText}>{dbError}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={loadingStyles.loadingText}>ROM.AI wird geladen...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={role ? "Tabs" : "Onboarding"}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tabs" component={TabLayout} />
        <Stack.Screen name="SelectJoint" component={SelectJointScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: Colors.neutral[600] },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.error[500], marginBottom: 12 },
  errorText: { fontSize: 14, color: Colors.neutral[600], textAlign: 'center', paddingHorizontal: 32 },
});
