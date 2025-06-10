// src/features/appointments/AppointmentArchiveScreen.tsx

import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Appointment } from '../../database/models/Appointment';
import { getMonthName, getWeekOfMonth } from '../../utils/helpers';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../../components/UI/Card';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { deleteAppointment } from './appointmentSlice'; // On réutilise deleteAppointment
import { RootState } from '../../store/store';

type Level = 'years' | 'months' | 'weeks' | 'days' | 'appointments';

const ArchiveListItem = ({ title, onPress, theme }: any) => (
    <TouchableOpacity onPress={onPress}>
        <Card style={styles.archiveItem}>
            <Text style={{ color: theme.colors.text, fontSize: 18 }}>{title}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
        </Card>
    </TouchableOpacity>
);

export const AppointmentArchiveScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const dispatch = useAppDispatch();

    const { appointments } = useAppSelector((state: RootState) => state.appointments);

    const archivedItems = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return appointments.filter((appt: Appointment) =>
            new Date(appt.date) < todayStart
        );
    }, [appointments]);

    // ✅ Nouveaux états pour la recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Appointment[]>([]);

    const [level, setLevel] = useState<Level>('years');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const navigateUp = () => {
        if (level === 'appointments') setLevel('days');
        else if (level === 'days') setLevel('weeks');
        else if (level === 'weeks') setLevel('months');
        else if (level === 'months') setLevel('years');
    };
    
    const data = useMemo(() => {
        switch (level) {
            case 'years':
                return ([...new Set(archivedItems.map((item: Appointment) => new Date(item.date!).getFullYear()))] as number[]).sort((a, b) => b - a);
            case 'months':
                return ([...new Set(archivedItems.filter((item: Appointment) => new Date(item.date!).getFullYear() === selectedYear).map((item: Appointment) => new Date(item.date!).getMonth()))] as number[]).sort((a, b) => b - a);
            case 'weeks':
                return ([...new Set(archivedItems.filter((item: Appointment) => new Date(item.date!).getFullYear() === selectedYear && new Date(item.date!).getMonth() === selectedMonth).map((item: Appointment) => getWeekOfMonth(new Date(item.date!))))] as number[]).sort((a, b) => b - a);
            case 'days':
                return ([...new Set(archivedItems.filter((item: Appointment) => { const d = new Date(item.date!); return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && getWeekOfMonth(d) === selectedWeek; }).map((item: Appointment) => new Date(item.date!).getDate()))] as number[]).sort((a, b) => b - a);
            case 'appointments':
                return archivedItems.filter((item: Appointment) => { const d = new Date(item.date!); return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay; });
            default:
                return [];
        }
    }, [level, archivedItems, selectedYear, selectedMonth, selectedWeek, selectedDay]);

    // ✅ Effet pour filtrer les résultats
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }

        const filtered = archivedItems.filter((appt: Appointment) => 
            appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (appt.contact && appt.contact.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSearchResults(filtered);
    }, [searchQuery, archivedItems]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: t('archive'),
            headerLeft: level !== 'years' ? () => (
                <TouchableOpacity onPress={navigateUp} style={{ marginLeft: 10 }}>
                    <Icon name="arrow-left" size={26} color={theme.colors.secondary} style={{marginEnd: 20}} />
                </TouchableOpacity>
            ) : undefined,
        });
    }, [navigation, level, theme, t, navigateUp]);

    useEffect(() => {
        if (archivedItems.length === 0 && navigation.isFocused() && navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [archivedItems, navigation]);

    useEffect(() => {
        if (data.length === 0 && level !== 'years') {
            navigateUp();
        }
    }, [data, level, navigateUp]);

    // Pour un RDV passé, l'action logique est de le supprimer, pas de le "restaurer".
    const handleDeleteFromArchive = (appointmentToDelete: Appointment) => {
        Alert.alert(
            t('deleteAppointment'),
            t('deleteAppointmentConfirmation'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('delete'), style: 'destructive', onPress: () => {
                    dispatch(deleteAppointment(appointmentToDelete.id));
                }},
            ]
        );
    };

    // ✅ Composant pour afficher un résultat de recherche
    const renderSearchResultItem = ({ item }: { item: Appointment }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                {item.contact && <Text style={[styles.itemDescription, { color: theme.colors.textMuted }]}>{item.contact}</Text>}
                <Text style={[styles.itemDate, { color: theme.colors.textMuted }]}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteFromArchive(item)} style={styles.actionButton}>
                <Icon name="delete-forever-outline" size={24} color={theme.colors.danger} />
            </TouchableOpacity>
        </Card>
    );

    const renderContent = () => {
        if (!archivedItems || archivedItems.length === 0) {
            return <View style={styles.emptyContainer}><Text style={{ color: theme.colors.text }}>{t('noPastAppointments')}</Text></View>;
        }

        // ✅ Si une recherche est en cours, afficher les résultats
        if (searchQuery.trim().length > 0) {
            return (
                <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id}
                    renderItem={renderSearchResultItem}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.colors.text }}>{t('noResultsFound')}</Text>
                        </View>
                    )}
                />
            );
        }

        // ✅ Sinon, afficher la vue hiérarchique normale
        if (level === 'appointments') {
            return (
                <FlatList
                    data={data as Appointment[]}
                    keyExtractor={item => item.id}
                    renderItem={({ item }: { item: Appointment }) => (
                        <Card style={styles.itemCard}>
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                                {item.contact && <Text style={[styles.itemDescription, { color: theme.colors.textMuted }]}>{item.contact}</Text>}
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteFromArchive(item)} style={styles.actionButton}>
                                <Icon name="delete-forever-outline" size={24} color={theme.colors.danger} />
                            </TouchableOpacity>
                        </Card>
                    )}
                />
            );
        }

        return (
            <FlatList
                data={data}
                keyExtractor={(item: any) => String(item)}
                renderItem={({ item }: { item: number }) => {
                    let title = '';
                    let onPress = () => {};
                    switch (level) {
                        case 'years': title = `${t('year')} ${item}`; onPress = () => { setSelectedYear(item); setLevel('months'); }; break;
                        case 'months': title = getMonthName(item, i18n.language); onPress = () => { setSelectedMonth(item); setLevel('weeks'); }; break;
                        case 'weeks': title = `${t('week')} ${item}`; onPress = () => { setSelectedWeek(item); setLevel('days'); }; break;
                        case 'days': const date = new Date(selectedYear!, selectedMonth!, item); title = date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric' }); onPress = () => { setSelectedDay(item); setLevel('appointments'); }; break;
                    }
                    return <ArchiveListItem title={title} onPress={onPress} theme={theme} />;
                }}
            />
        );
    };

    return (
        <MainLayout>
            {/* ✅ Barre de recherche */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
                <Icon name="magnify" size={22} color={theme.colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder={t('searchInArchive')}
                    placeholderTextColor={theme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close-circle" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {renderContent()}
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    archiveItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemInfo: { flex: 1, marginRight: 10 },
    itemTitle: { fontSize: 16 },
    itemDescription: { marginTop: 4, fontStyle: 'italic' },
    itemDate: { marginTop: 4, fontSize: 12 },
    actionButton: { padding: 8 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        margin: 16,
        borderRadius: 10,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { height: 1, width: 0 },
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
});
