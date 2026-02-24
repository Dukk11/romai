import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import HomeScreen from './index';
import HistoryScreen from './history';
import { Colors } from '../../src/constants/colors';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: Colors.primary[500],
                tabBarInactiveTintColor: Colors.neutral[500],
                headerStyle: { backgroundColor: Colors.primary[500] },
                headerTintColor: Colors.surface,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={({ navigation }) => ({
                    title: 'ROM.AI Dashboard',
                    headerRight: () => (
                        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Settings')}>
                            <Text style={{ color: Colors.surface, fontSize: 24 }}>⚙️</Text>
                        </TouchableOpacity>
                    )
                })}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: 'Verlauf' }}
            />
        </Tab.Navigator>
    );
}
