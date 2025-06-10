// src/features/appointments/AppointmentList.tsx

import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store/store';
import { fetchAppointments, deleteAppointment } from './appointmentSlice';
import { RootState } from '../../store/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card } from '../../components/UI/Card';
import { useTheme } from '../../hooks/useTheme';
import { Appointment } from '../../database/models/Appointment';

export const AppointmentList = () => {
    const dispatch = useAppDispatch();
    const { appointments, status } = useSelector((state: RootState) => state.appointments);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { theme } = useTheme();

    useEffect(() => {
        dispatch(fetchAppointments());
    }, [dispatch]);

    // ✅ Filtrer les rendez-vous passés (archivés) vs. à venir
    const upcomingAppointments = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        return appointments
            .filter(appt => new Date(appt.date) >= todayStart)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Trier par date
    }, [appointments]);

    // ✅ Ajouter un bouton vers les archives dans l'en-tête
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity 
                    onPress={() => navigation.navigate('AppointmentArchive')}
                    style={{ marginRight: 15 }}
                >
                    <Icon name="archive-arrow-down-outline" size={26} color={theme.colors.secondary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);


    const handleDelete = (id: string) => {
        dispatch(deleteAppointment(id));
    };

    const renderItem = ({ item }: { item: Appointment }) => (
        <Card>
            <TouchableOpacity 
                style={styles.itemContainer} 
                onLongPress={() => navigation.navigate('AppointmentForm', { appointment: item })}
            >
                <Icon name="calendar-account" size={40} color={theme.colors.secondary} style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.colors.textMuted }]}>
                        {new Date(item.date).toLocaleString()}
                    </Text>
                    {item.contact && <Text style={{ color: theme.colors.textMuted }}>{t('contact')}: {item.contact}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Icon name="delete-outline" size={24} color={theme.colors.danger} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Card>
    );
    
    const ListEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Icon name="calendar-search" size={60} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('noUpcomingAppointments')}</Text>
        </View>
    );

    return (
        <MainLayout>
            {status === 'loading' && <ActivityIndicator size="large" color={theme.colors.primary} />}
            <FlatList
                data={upcomingAppointments} // ✅ Afficher uniquement les rendez-vous à venir
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={ListEmptyComponent}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
                onPress={() => navigation.navigate('AppointmentForm')}
            >
                <Icon name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </MainLayout>
    );
};

// ... les styles restent inchangés ...
const styles = StyleSheet.create({
    itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    icon: { marginRight: 15 },
    textContainer: { flex: 1 },
    itemTitle: { fontSize: 18, fontWeight: 'bold' },
    itemDate: { fontSize: 14, marginTop: 4 },
    deleteButton: { padding: 10 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    emptyText: { marginTop: 16, fontSize: 18 }
});
