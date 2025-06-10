import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDBConnection, getAllItems, insertItem, updateItem, deleteItem } from '../../database/dbService';
import { Event } from '../../database/models/Event';
import { notificationService } from '../../notifications/notificationService';
import i18n from 'i18next';

interface EventsState {
    events: Event[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: EventsState = {
    events: [],
    status: 'idle',
    error: null,
};

// Async Thunks
export const fetchEvents = createAsyncThunk('events/fetchEvents', async () => {
    const db = await getDBConnection();
    return await getAllItems<Event>(db, 'events');
});

export const addEvent = createAsyncThunk('events/addEvent', async (event: Event) => {
    const db = await getDBConnection();
    await insertItem(db, 'events', event);
    // Schedule a notification
    notificationService.scheduleNotification({
        id: event.id,
        title: i18n.t('eventReminder'),
        message: event.title,
        date: new Date(new Date(event.startDate).getTime() - 15 * 60 * 1000) // 15 mins before
    });
    return event;
});

export const updateEvent = createAsyncThunk('events/updateEvent', async (event: Event) => {
    const db = await getDBConnection();
    await updateItem(db, 'events', event);
     // Re-schedule notification
    notificationService.cancelNotification(event.id);
    notificationService.scheduleNotification({
        id: event.id,
        title: i18n.t('eventReminder'),
        message: i18n.t('eventReminderMessage', { title: event.title }),
        date: new Date(new Date(event.startDate).getTime() - 15 * 60 * 1000)
    });
    return event;
});

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id: string) => {
    const db = await getDBConnection();
    await deleteItem(db, 'events', id);
    // Cancel notification
    notificationService.cancelNotification(id);
    return id;
});

const eventsSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Events
            .addCase(fetchEvents.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
                state.status = 'succeeded';
                state.events = action.payload;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch events';
            })
            // Add Event
            .addCase(addEvent.fulfilled, (state, action: PayloadAction<Event>) => {
                state.events.push(action.payload);
            })
            // Update Event
            .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
                const index = state.events.findIndex((event) => event.id === action.payload.id);
                if (index !== -1) {
                    state.events[index] = action.payload;
                }
            })
            // Delete Event
            .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
                state.events = state.events.filter((event) => event.id !== action.payload);
            });
    },
});

export default eventsSlice.reducer;