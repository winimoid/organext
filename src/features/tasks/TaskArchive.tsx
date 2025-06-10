// src/features/tasks/TaskArchiveScreen.tsx

import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Task } from '../../database/models/Task';
import { getMonthName, getWeekOfMonth } from '../../utils/helpers';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../../components/UI/Card';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { restoreTask } from './taskSlice';
import { RootState } from '../../store/store';

type Level = 'years' | 'months' | 'weeks' | 'days' | 'tasks';

const ArchiveListItem = ({ title, onPress, theme }: any) => (
    <TouchableOpacity onPress={onPress}>
        <Card style={styles.archiveItem}>
            <Text style={{ color: theme.colors.text, fontSize: 18 }}>{title}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textMuted} />
        </Card>
    </TouchableOpacity>
);

export const TaskArchiveScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const dispatch = useAppDispatch();

    const { tasks } = useAppSelector((state: RootState) => state.tasks);

    const archivedItems = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return tasks.filter((task: Task) =>
            task.isCompleted && task.dueDate && new Date(task.dueDate) < todayStart
        );
    }, [tasks]);

    // ✅ Nouveaux états pour la recherche
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Task[]>([]);

    const [level, setLevel] = useState<Level>('years');
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // ✅ La fonction qui remonte dans la hiérarchie (inchangée)
    const navigateUp = () => {
        if (level === 'tasks') setLevel('days');
        else if (level === 'days') setLevel('weeks');
        else if (level === 'weeks') setLevel('months');
        else if (level === 'months') setLevel('years');
    };
    
    // ✅ On met le calcul des données dans son propre useMemo (inchangé)
    const data = useMemo(() => {
        switch (level) {
            case 'years':
                return ([...new Set(archivedItems.map((item: Task) => new Date(item.dueDate!).getFullYear()))] as number[]).sort((a, b) => b - a);
            case 'months':
                return ([...new Set(archivedItems.filter((item: Task) => new Date(item.dueDate!).getFullYear() === selectedYear).map((item: Task) => new Date(item.dueDate!).getMonth()))] as number[]).sort((a, b) => b - a);
            case 'weeks':
                return ([...new Set(archivedItems.filter((item: Task) => new Date(item.dueDate!).getFullYear() === selectedYear && new Date(item.dueDate!).getMonth() === selectedMonth).map((item: Task) => getWeekOfMonth(new Date(item.dueDate!))))] as number[]).sort((a, b) => b - a);
            case 'days':
                return ([...new Set(archivedItems.filter((item: Task) => { const d = new Date(item.dueDate!); return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && getWeekOfMonth(d) === selectedWeek; }).map((item: Task) => new Date(item.dueDate!).getDate()))] as number[]).sort((a, b) => b - a);
            case 'tasks':
                return archivedItems.filter((item: Task) => { const d = new Date(item.dueDate!); return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === selectedDay; });
            default:
                return [];
        }
    }, [level, archivedItems, selectedYear, selectedMonth, selectedWeek, selectedDay]);

    // ✅ Effet pour filtrer les résultats lorsque la requête de recherche change
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }

        const filtered = archivedItems.filter((task: Task) => 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSearchResults(filtered);
    }, [searchQuery, archivedItems]);

    // ✅ TOUTE LA LOGIQUE DE NAVIGATION EST MAINTENANT DANS DES HOOKS AU NIVEAU SUPÉRIEUR
    useLayoutEffect(() => {
        navigation.setOptions({
            title: t('archive'),
            headerLeft: level !== 'years' ? () => (
                <TouchableOpacity onPress={navigateUp} style={{ marginLeft: 10 }}>
                    <Icon name="arrow-left" size={26} color={theme.colors.primary} style={{marginEnd: 20}} />
                </TouchableOpacity>
            ) : undefined,
        });
    }, [navigation, level, theme, t, navigateUp]);

    useEffect(() => {
        // Si la liste totale des archives est vide après un re-render, on revient en arrière.
        if (archivedItems.length === 0 && navigation.isFocused() && navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [archivedItems, navigation]);

    useEffect(() => {
        // Si le niveau de données actuel devient vide (ex: après restauration de la dernière tâche d'un jour)
        // on remonte automatiquement.
        if (data.length === 0 && level !== 'years') {
            navigateUp();
        }
    }, [data, level, navigateUp]);


    const handleRestore = (taskToRestore: Task) => {
        dispatch(restoreTask(taskToRestore));
    };

    // ✅ Composant pour afficher un résultat de recherche
    const renderSearchResultItem = ({ item }: { item: Task }) => (
        <Card style={styles.taskCard}>
            <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
                {item.description && <Text style={[styles.taskDescription, { color: theme.colors.textMuted }]}>{item.description}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleRestore(item)} style={styles.restoreButton}>
                <Icon name="backup-restore" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
        </Card>
    );

    const renderContent = () => {
        if (!archivedItems || archivedItems.length === 0) {
            // Pas besoin de hook ici, le useEffect global s'en occupe
            return <View style={styles.emptyContainer}><Text style={{ color: theme.colors.text }}>{t('noPastTasks')}</Text></View>;
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
        if (level === 'tasks') {
            return (
                <FlatList
                    data={data as Task[]}
                    keyExtractor={item => item.id}
                    renderItem={({ item }: { item: Task }) => (
                        <Card style={styles.taskCard}>
                            <View style={styles.taskInfo}>
                                <Text style={[styles.taskTitle, { color: theme.colors.text }]}>{item.title}</Text>
                                {item.description && <Text style={[styles.taskDescription, { color: theme.colors.textMuted }]}>{item.description}</Text>}
                            </View>
                            <TouchableOpacity onPress={() => handleRestore(item)} style={styles.restoreButton}>
                                <Icon name="backup-restore" size={24} color={theme.colors.primary} />
                                <Text style={[styles.restoreText, { color: theme.colors.primary }]}>{t('restore')}</Text>
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
                        case 'days': const date = new Date(selectedYear!, selectedMonth!, item); title = date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric' }); onPress = () => { setSelectedDay(item); setLevel('tasks'); }; break;
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
    taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 16, textDecorationLine: 'line-through' },
    taskDescription: { marginTop: 4, fontStyle: 'italic' },
    restoreButton: { flexDirection: 'row', alignItems: 'center', padding: 8, marginLeft: 10 },
    restoreText: { marginLeft: 5, fontWeight: 'bold' },
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
