import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch } from '../../store/store';
import { addAppointment, updateAppointment } from './appointmentSlice';
import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../../database/models/Appointment';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';

type RouteParams = {
    appointment?: Appointment;
};

export const AppointmentForm = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { appointment } = (route.params as RouteParams) || {};
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [title, setTitle] = useState(appointment?.title || '');
    const [contact, setContact] = useState(appointment?.contact || '');
    const [notes, setNotes] = useState(appointment?.notes || '');
    const [date, setDate] = useState<Date>(appointment?.date ? new Date(appointment.date) : new Date());
    const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
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
        
        const appointmentData: Appointment = {
            id: appointment?.id || uuidv4(),
            title,
            contact,
            notes,
            date: date.toISOString(),
            createdAt: appointment?.createdAt || new Date().toISOString(),
        };

        if (appointment) {
            dispatch(updateAppointment(appointmentData));
        } else {
            dispatch(addAppointment(appointmentData));
        }
        navigation.goBack();
    };
    
    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowPicker(null);
        setDate(currentDate);
    };

    return (
        <MainLayout>
            <ScrollView contentContainerStyle={styles.container}>
                <Input
                    label={t('appointmentTitle')}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('appointmentTitlePlaceholder')}
                    error={errors.title}
                />
                
                 <View style={styles.dateContainer}>
                    <Text style={[styles.dateLabel, {color: theme.colors.text}]}>{t('dateAndTime')}</Text>
                    <TouchableOpacity onPress={() => setShowPicker('date')}>
                        <Text style={[styles.dateText, {color: theme.colors.primary, borderColor: theme.colors.border}]}>
                            {date.toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowPicker('time')} style={{marginTop: 10}}>
                        <Text style={[styles.dateText, {color: theme.colors.primary, borderColor: theme.colors.border}]}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode={showPicker}
                        display="default"
                        onChange={onDateChange}
                    />
                )}
                
                <Input
                    label={t('contactOptional')}
                    value={contact}
                    onChangeText={setContact}
                    placeholder={t('contactPlaceholder')}
                />
                <Input
                    label={t('notesOptional')}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('notesPlaceholder')}
                    multiline
                    numberOfLines={4}
                />

                <Button title={appointment ? t('updateAppointment') : t('addAppointment')} onPress={handleSave} color="secondary" />
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
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        textAlign: 'center'
    },
});
