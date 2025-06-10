import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch } from '../../store/store';
import { addEvent, updateEvent, deleteEvent } from './eventSlice';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../../database/models/Event';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RouteParams = {
    event?: Event;
    date?: string; // Pre-selected date from calendar
};

export const EventForm = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { event, date: preselectedDate } = (route.params as RouteParams) || {};
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const initialStartDate = event?.startDate ? new Date(event.startDate) : (preselectedDate ? new Date(preselectedDate) : new Date());
    const initialEndDate = event?.endDate ? new Date(event.endDate) : new Date(initialStartDate.getTime() + 60 * 60 * 1000); // Default to 1 hour later

    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [showPicker, setShowPicker] = useState<'start-date' | 'start-time' | 'end-date' | 'end-time' | null>(null);
    const [errors, setErrors] = useState<{ title?: string }>({});

    const validate = () => {
        const newErrors: { title?: string } = {};
        if (!title.trim()) {
            newErrors.title = t('titleRequired');
        }
        if (endDate < startDate) {
            Alert.alert(t('error'), t('endDateError'));
            return false;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const eventData = {
            id: event?.id || uuidv4(),
            title,
            description,
            location,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            createdAt: event?.createdAt || new Date().toISOString(),
        };

        if (event) {
            dispatch(updateEvent(eventData));
        } else {
            dispatch(addEvent(eventData));
        }
        navigation.goBack();
    };
    
    const handleDelete = () => {
        if (event) {
            Alert.alert(
                t('deleteEvent'),
                t('deleteEventConfirmation'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: () => {
                        dispatch(deleteEvent(event.id));
                        navigation.goBack();
                    }},
                ]
            );
        }
    };

    const onDateChange = (selectedDate: Date, type: 'start' | 'end') => {
        setShowPicker(null);
        if (type === 'start') {
            setStartDate(selectedDate);
            // If start date is now after end date, adjust end date
            if (selectedDate > endDate) {
                setEndDate(new Date(selectedDate.getTime() + 60 * 60 * 1000));
            }
        } else {
            setEndDate(selectedDate);
        }
    };

    const DateTimeInput = ({ label, date, onDatePress, onTimePress }: {label: string, date: Date, onDatePress: () => void, onTimePress: () => void}) => (
        <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, {color: theme.colors.text}]}>{label}</Text>
            <View style={styles.dateInputContainer}>
                <TouchableOpacity onPress={onDatePress} style={[styles.dateTouchable, {borderColor: theme.colors.border}]}>
                    <Icon name="calendar" size={20} color={theme.colors.primary} />
                    <Text style={{color: theme.colors.text, marginLeft: 8}}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
                 <TouchableOpacity onPress={onTimePress} style={[styles.dateTouchable, {borderColor: theme.colors.border}]}>
                    <Icon name="clock-outline" size={20} color={theme.colors.primary} />
                    <Text style={{color: theme.colors.text, marginLeft: 8}}>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <MainLayout>
            <ScrollView contentContainerStyle={styles.container}>
                <Input
                    label={t('eventTitle')}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('eventTitlePlaceholder')}
                    error={errors.title}
                />
                <Input
                    label={t('locationOptional')}
                    value={location}
                    onChangeText={setLocation}
                    placeholder={t('locationPlaceholder')}
                />
                <Input
                    label={t('descriptionOptional')}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('descriptionPlaceholder')}
                    multiline
                    numberOfLines={3}
                />

                <DateTimeInput label={t('starts')} date={startDate} onDatePress={() => setShowPicker('start-date')} onTimePress={() => setShowPicker('start-time')} />
                <DateTimeInput label={t('ends')} date={endDate} onDatePress={() => setShowPicker('end-date')} onTimePress={() => setShowPicker('end-time')} />

                {showPicker && (
                    <DateTimePicker
                        value={
                            showPicker.startsWith('start') ? startDate : endDate
                        }
                        mode={showPicker.endsWith('date') ? 'date' : 'time'}
                        display="default"
                        onChange={(e, d) => d && onDateChange(d, showPicker.startsWith('start') ? 'start' : 'end')}
                    />
                )}
                
                <View style={styles.buttonContainer}>
                    <Button title={event ? t('updateEvent') : t('addEvent')} onPress={handleSave} />
                    {event && <Button title={t('deleteEvent')} onPress={handleDelete} color="danger" style={{marginTop: 10}} />}
                </View>

            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    dateRow: {
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    dateInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        width: '48%',
    },
    buttonContainer: {
        marginTop: 20,
    }
});
