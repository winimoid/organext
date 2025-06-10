import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch } from '../../store/store';
import { addTask, updateTask } from './taskSlice';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../../database/models/Task';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';

type RouteParams = {
    task?: Task;
};

export const TaskForm = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { task } = (route.params as RouteParams) || {};
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState<{ title?: string }>({});

    const validate = () => {
        const newErrors: { title?: string } = {};
        if (!title.trim()) {
            newErrors.title = t('titleRequired');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const taskData = {
            id: task?.id || uuidv4(),
            title,
            description,
            dueDate: dueDate?.toISOString(),
            isCompleted: task?.isCompleted || false,
            createdAt: task?.createdAt || new Date().toISOString(),
        };

        if (task) {
            dispatch(updateTask(taskData));
        } else {
            dispatch(addTask(taskData));
        }
        navigation.goBack();
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dueDate;
        setShowDatePicker(false);
        if (currentDate) {
            setDueDate(currentDate);
        }
    };

    return (
        <MainLayout>
            <ScrollView contentContainerStyle={styles.container}>
                <Input
                    label={t('taskTitle')}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('taskTitlePlaceholder')}
                    error={errors.title}
                />
                <Input
                    label={t('description')}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('descriptionPlaceholder')}
                    multiline
                    numberOfLines={4}
                />
                <View style={styles.dateContainer}>
                    <Text style={[styles.dateLabel, {color: theme.colors.text}]}>{t('dueDate')}</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                        <Text style={[styles.dateText, {color: theme.colors.primary}]}>
                            {dueDate ? dueDate.toLocaleDateString() : t('selectDate')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={dueDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <Button title={task ? t('updateTask') : t('addTask')} onPress={handleSave} />
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    dateContainer: {
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 18,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
});
