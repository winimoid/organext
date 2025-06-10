import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { useAppDispatch } from '../../store/store';
import { fetchTasks, deleteTask, toggleTaskStatus } from './taskSlice';
import { RootState } from '../../store/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Card } from '../../components/UI/Card';
import { useTheme } from '../../hooks/useTheme';
import { Task } from '../../database/models/Task';
import { isToday } from '../../utils/helpers';

export const TaskList = () => {
    const dispatch = useAppDispatch();
    const { tasks, status, error } = useSelector((state: RootState) => state.tasks);
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { theme } = useTheme();

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTasks());
        }
    }, [status, dispatch]);

    // ✅ Filtrer les tâches avec une logique corrigée et simplifiée
    const { todayTasks, pastTasks } = useMemo(() => {
        const today: Task[] = [];
        const past: Task[] = [];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0); // Le début de la journée actuelle

        tasks.forEach(task => {
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;

            // Condition pour être archivé : la tâche doit être complétée ET sa date doit être passée.
            if (task.isCompleted && dueDate && dueDate < todayStart) {
                past.push(task);
            } else {
                // Toutes les autres tâches sont considérées comme "actives" ou "aujourd'hui".
                // Cela inclut :
                // - Tâches sans date
                // - Tâches futures
                // - Tâches d'aujourd'hui
                // - Tâches passées mais non complétées (en retard)
                today.push(task);
            }
        });
        
        // Optionnel : trier les tâches actives pour mettre celles sans date à la fin
        today.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            return dateA - dateB;
        });

        return { todayTasks: today, pastTasks: past };
    }, [tasks]);

    // ✅ Ajouter un bouton à l'en-tête de la navigation
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity 
                    onPress={() => navigation.navigate('TaskArchive')}
                    style={{ marginRight: 15 }}
                >
                    <Icon name="archive-arrow-down-outline" size={26} color={theme.colors.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const handleToggleStatus = (task: Task) => {
        const updatedTask = { ...task, isCompleted: !task.isCompleted };
        dispatch(toggleTaskStatus(updatedTask));
    };

    const handleDelete = (id: string) => {
        dispatch(deleteTask(id));
    };

    const renderItem = ({ item }: { item: Task }) => (
        <Card>
            <View style={styles.taskContainer}>
                <TouchableOpacity onPress={() => handleToggleStatus(item)} style={styles.checkContainer}>
                    <Icon 
                        name={item.isCompleted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={26}
                        color={item.isCompleted ? theme.colors.success : theme.colors.primary} 
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onLongPress={() => navigation.navigate('TaskForm', { task: item })}>
                    <Text style={[styles.taskTitle, { color: theme.colors.text, textDecorationLine: item.isCompleted ? 'line-through' : 'none' }]}>
                        {item.title}
                    </Text>
                    {item.dueDate && (
                        <Text style={[styles.taskDate, { color: theme.colors.textMuted }]}>
                            {t('dueDate')}: {new Date(item.dueDate).toLocaleDateString()}
                        </Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Icon name="delete-outline" size={24} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    const ListEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Icon name="playlist-check" size={60} color={theme.colors.textMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('noTasks')}</Text>
        </View>
    );

    return (
        <MainLayout>
            {status === 'loading' && <ActivityIndicator size="large" color={theme.colors.primary} />}
            {status === 'failed' && <Text style={{color: theme.colors.danger}}>{error}</Text>}
            <FlatList
                data={todayTasks}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={ListEmptyComponent}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('TaskForm', {})}
            >
                <Icon name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5
    },
    checkContainer: {
        padding: 5,
    },
    textContainer: {
        flex: 1,
        marginLeft: 15,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    taskDate: {
        fontSize: 14,
        marginTop: 4,
    },
    deleteButton: {
        padding: 10,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '40%',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
    }
});
