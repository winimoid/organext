import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, FlatList } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchEvents } from './eventSlice';
import { RootState } from '../../store/store';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { Event } from '../../database/models/Event';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from '../../components/UI/Card';

LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.'],
  today: 'Aujourd\'hui'
};
LocaleConfig.locales['en'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthNamesShort: ['Jan.','Feb.','Mar.','Apr.','May','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['Sun.','Mon.','Tue.','Wed.','Thu.','Fri.','Sat.'],
  today: 'Today'
};

export const CalendarView = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<any>();
    const { events, status } = useAppSelector((state: RootState) => state.events);
    const { t, i18n } = useTranslation();
    const { theme, isDark } = useTheme();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // ✅ Cet effet met à jour la configuration statique. Le re-rendu l'appliquera.
    useEffect(() => {
        LocaleConfig.defaultLocale = i18n.language;
    }, [i18n.language]);

    useEffect(() => {
        dispatch(fetchEvents());
    }, [dispatch]);

    const markedDates = useMemo(() => {
        const markings: { [key: string]: any } = {};
        events.forEach((event: Event) => {
            const date = event.startDate.split('T')[0];
            markings[date] = { 
                marked: true, 
                dotColor: theme.colors.accent, 
                // selected: date === selectedDate 
            };
        });
        if (markings[selectedDate]) {
            markings[selectedDate].selected = true;
            markings[selectedDate].selectedColor = theme.colors.primary;
        } else {
            markings[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
        }
        return markings;
    }, [events, selectedDate, theme.colors]);

    const eventsForSelectedDate = useMemo(() => {
        return events.filter((event: Event) => event.startDate.startsWith(selectedDate));
    }, [events, selectedDate]);

    // ✅ Construction du thème pour le calendrier.
    const calendarTheme = useMemo(() => ({
        backgroundColor: theme.colors.background,
        calendarBackground: theme.colors.card,
        textSectionTitleColor: theme.colors.textMuted,
        selectedDayBackgroundColor: theme.colors.primary,
        selectedDayTextColor: '#ffffff',
        todayTextColor: theme.colors.primary,
        dayTextColor: theme.colors.text,
        textDisabledColor: theme.colors.disabled,
        dotColor: theme.colors.accent,
        selectedDotColor: '#ffffff',
        arrowColor: theme.colors.primary,
        monthTextColor: theme.colors.primary,
        indicatorColor: theme.colors.primary,
        
        // Ajout de "as const" pour que TypeScript comprenne que ce sont des valeurs littérales
        textDayFontWeight: '300' as const,
        textMonthFontWeight: 'bold' as const,
        textDayHeaderFontWeight: '300' as const,
        
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 16,
        'stylesheet.calendar.header': {
            week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-between'
            }
        }
    }), [theme]); // Le thème du calendrier est maintenant correctement typé

    const renderEventItem = ({ item }: { item: Event }) => (
        <Card>
            <TouchableOpacity onLongPress={() => navigation.navigate('EventForm', { event: item })}>
                <View style={styles.eventItem}>
                    <View style={[styles.eventColorBar, { backgroundColor: theme.colors.accent }]} />
                    <View style={styles.eventDetails}>
                        <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{item.title}</Text>
                        <Text style={[styles.eventTime, { color: theme.colors.textMuted }]}>
                            {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {item.location && <Text style={[styles.eventLocation, { color: theme.colors.textMuted }]}>{item.location}</Text>}
                    </View>
                </View>
            </TouchableOpacity>
        </Card>
    );

    return (
        <MainLayout>
            <Calendar
                // ✅ LA SOLUTION : UNE CLÉ DYNAMIQUE
                // Cette clé changera si la langue ou le thème (isDark) change,
                // forçant React à démonter et remonter le composant Calendar.
                key={`${i18n.language}-${isDark ? 'dark' : 'light'}`}
            
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                // On passe le thème mémoïsé
                theme={calendarTheme}
            />
            <View style={styles.listContainer}>
                {eventsForSelectedDate.length > 0 ? (
                    <FlatList
                        data={eventsForSelectedDate}
                        renderItem={renderEventItem}
                        keyExtractor={(item) => item.id}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="calendar-remove" size={40} color={theme.colors.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>{t('noEventsForDay')}</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('EventForm', { date: selectedDate })}
            >
                <Icon name="plus" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        marginTop: 10,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventColorBar: {
        width: 5,
        height: '100%',
        marginRight: 10,
        borderRadius: 5,
    },
    eventDetails: {
        flex: 1,
        paddingVertical: 10,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    eventTime: {
        fontSize: 14,
        marginTop: 4,
    },
    eventLocation: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 4,
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    }
});
