import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

// Screens
import { TaskList } from '../../features/tasks/TaskList';
import { TaskForm } from '../../features/tasks/TaskForm';
import { TaskArchiveScreen } from '../../features/tasks/TaskArchive';
import { CalendarView } from '../../features/events/CalendarView';
import { EventForm } from '../../features/events/EventForm';
import { AIChat } from '../../features/ai/AIChat';
import { AIChatHistory } from '../../features/ai/AIChatHistory';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { AppointmentList } from '../../features/appointments/AppointmentList';
import { AppointmentForm } from '../../features/appointments/AppointmentForm';
import { AppointmentArchiveScreen } from '../../features/appointments/AppointmentArchive';
import { navigationRef } from '../../services/navigationService';

import { useTheme } from '../../hooks/useTheme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TaskStack = () => {
    const { t } = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen name="TaskList" component={TaskList} options={{ title: t('tasks') }} />
            <Stack.Screen name="TaskForm" component={TaskForm} options={{ title: t('taskDetails') }} />
            <Stack.Screen name="TaskArchive" component={TaskArchiveScreen} options={{ title: t('archive') }} />
        </Stack.Navigator>
    );
};

const EventStack = () => {
    const { t } = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen name="CalendarView" component={CalendarView} options={{ title: t('calendar') }} />
            <Stack.Screen name="EventForm" component={EventForm} options={{ title: t('eventDetails') }} />
        </Stack.Navigator>
    );
};

const AppointmentStack = () => {
    const { t } = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen name="AppointmentList" component={AppointmentList} options={{ title: t('appointments') }} />
            <Stack.Screen name="AppointmentForm" component={AppointmentForm} options={{ title: t('appointmentDetails') }} />
            <Stack.Screen name="AppointmentArchive" component={AppointmentArchiveScreen} options={{ title: t('archive') }} />
        </Stack.Navigator>
    );
}

const AIStack = () => {
    const { t } = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen name="AIChatHistory" component={AIChatHistory} options={{ title: t('aiAssistant') }} />
            <Stack.Screen name="AIChat" component={AIChat} options={{ title: t('conversation') }} />
        </Stack.Navigator>
    );
};

const MainTabs = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = '';

                    if (route.name === 'TasksTab') {
                        iconName = focused ? 'check-all' : 'check-all';
                    } else if (route.name === 'CalendarTab') {
                        iconName = focused ? 'calendar-month' : 'calendar-month-outline';
                    } else if (route.name === 'AppointmentsTab') {
                        iconName = focused ? 'calendar-account' : 'calendar-account-outline';
                    } else if (route.name === 'AITab') {
                        iconName = focused ? 'robot-happy' : 'robot-happy-outline';
                    } else if (route.name === 'SettingsTab') {
                        iconName = focused ? 'cog' : 'cog-outline';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { backgroundColor: theme.colors.card },
                headerShown: false,
            })}
        >
            <Tab.Screen name="TasksTab" component={TaskStack} options={{ title: t('tasks') }} />
            <Tab.Screen name="CalendarTab" component={EventStack} options={{ title: t('calendar') }} />
            <Tab.Screen name="AppointmentsTab" component={AppointmentStack} options={{ title: t('appointments') }}/>
            <Tab.Screen name="AITab" component={AIStack} options={{ title: t('aiAssistant') }} />
            <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: t('settings') }} />
        </Tab.Navigator>
    );
};

const Navigation = () => {
    const { theme } = useTheme();

    // ✅ L'objet est maintenant beaucoup plus simple à construire !
    const navigationTheme = {
        dark: theme.dark,
        colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
        },
        fonts: theme.fonts, // On utilise directement l'objet du thème
    };

    return (
        <NavigationContainer theme={navigationTheme} ref={navigationRef}>
            <MainTabs />
        </NavigationContainer>
    );
};

export default Navigation;
