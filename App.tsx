import React from 'react';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [dbInitialized, setDbInitialized] = React.useState(false);
  const { role } = useUserStore();

  React.useEffect(() => {
    initDatabase().then(() => {
      setDbInitialized(true);
      console.log('Database initialized');
    }).catch(e => console.error(e));
  }, []);

  if (!dbInitialized) {
    return null; // oder Loading Spinner
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
