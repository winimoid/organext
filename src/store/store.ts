import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import tasksReducer from '../features/tasks/taskSlice';
import eventsReducer from '../features/events/eventSlice';
import appointmentsReducer from '../features/appointments/appointmentSlice';
import settingsReducer from '../features/settings/settingsSlice';
import aiReducer from '../features/ai/aiSlice';

export const store = configureStore({
    reducer: {
        tasks: tasksReducer,
        events: eventsReducer,
        appointments: appointmentsReducer,
        settings: settingsReducer,
        ai: aiReducer, // ✅ Ajout du nouveau reducer
    },
    // It's good practice to disable serializableCheck for react-native-sqlite-storage
    // or other libraries that might put non-serializable values in actions (like promises).
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = (selector: (state: RootState) => any) => selector(store.getState());