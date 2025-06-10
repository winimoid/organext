import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDBConnection, getAllItems, insertItem, updateItem, deleteItem } from '../../database/dbService';
import { Appointment } from '../../database/models/Appointment';
import { notificationService } from '../../notifications/notificationService';
import i18n from 'i18next';

interface AppointmentsState {
    appointments: Appointment[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AppointmentsState = {
    appointments: [],
    status: 'idle',
    error: null,
};

// Async Thunks
export const fetchAppointments = createAsyncThunk('appointments/fetchAppointments', async () => {
    const db = await getDBConnection();
    return await getAllItems<Appointment>(db, 'appointments');
});

export const addAppointment = createAsyncThunk('appointments/addAppointment', async (appointment: Appointment) => {
    const db = await getDBConnection();
    await insertItem(db, 'appointments', appointment);
    notificationService.scheduleNotification({
        id: appointment.id,
        title: i18n.t('appointmentReminder'),
        message: appointment.title,
        date: new Date(new Date(appointment.date).getTime() - 30 * 60 * 1000) // 30 mins before
    });
    return appointment;
});

export const updateAppointment = createAsyncThunk('appointments/updateAppointment', async (appointment: Appointment) => {
    const db = await getDBConnection();
    await updateItem(db, 'appointments', appointment);
    notificationService.cancelNotification(appointment.id);
    notificationService.scheduleNotification({
        id: appointment.id,
        title: i18n.t('appointmentReminder'),
        message: i18n.t('appointmentReminderMessage', { title: appointment.title }),
        date: new Date(new Date(appointment.date).getTime() - 30 * 60 * 1000)
    });
    return appointment;
});

export const deleteAppointment = createAsyncThunk('appointments/deleteAppointment', async (id: string) => {
    const db = await getDBConnection();
    await deleteItem(db, 'appointments', id);
    notificationService.cancelNotification(id);
    return id;
});

const appointmentsSlice = createSlice({
    name: 'appointments',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAppointments.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAppointments.fulfilled, (state, action: PayloadAction<Appointment[]>) => {
                state.status = 'succeeded';
                state.appointments = action.payload;
            })
            .addCase(fetchAppointments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch appointments';
            })
            .addCase(addAppointment.fulfilled, (state, action: PayloadAction<Appointment>) => {
                state.appointments.unshift(action.payload);
            })
            .addCase(updateAppointment.fulfilled, (state, action: PayloadAction<Appointment>) => {
                const index = state.appointments.findIndex((appt) => appt.id === action.payload.id);
                if (index !== -1) {
                    state.appointments[index] = action.payload;
                }
            })
            .addCase(deleteAppointment.fulfilled, (state, action: PayloadAction<string>) => {
                state.appointments = state.appointments.filter((appt) => appt.id !== action.payload);
            });
    },
});

export default appointmentsSlice.reducer;
