import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDBConnection, getAllItems, insertItem, updateItem, deleteItem } from '../../database/dbService';
import { Task } from '../../database/models/Task';
import { notificationService } from '../../notifications/notificationService';
import { i18n } from '../../i18n';

interface TasksState {
    tasks: Task[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: TasksState = {
    tasks: [],
    status: 'idle',
    error: null,
};

// Async Thunks
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
    const db = await getDBConnection();
    const tasks = await getAllItems<Task>(db, 'tasks');
    // SQLite doesn't have a boolean type, it uses 0 or 1.
    return tasks.map(task => ({ ...task, isCompleted: !!task.isCompleted }));
});

export const addTask = createAsyncThunk('tasks/addTask', async (task: Task) => {
    const db = await getDBConnection();
    await insertItem(db, 'tasks', task);

    // ✅ Utilisation du notificationService
    if (task.dueDate) {
        notificationService.scheduleNotification({
            id: `task-${task.id}`, // ID unique
            title: i18n.t('taskReminderTitle'),
            message: i18n.t('taskReminderMessage', { title: task.title }),
            date: new Date(task.dueDate),
            // userInfo: { type: 'task', id: task.id }, // Removed because it's not in NotificationPayload
        });
    }
    return task;
});

export const updateTask = createAsyncThunk('tasks/updateTask', async (task: Task) => {
    const db = await getDBConnection();
    await updateItem(db, 'tasks', task);
    return task;
});

export const toggleTaskStatus = createAsyncThunk('tasks/toggleTaskStatus', async (task: Task) => {
    const db = await getDBConnection();
    await updateItem(db, 'tasks', task);
    return task;
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id: string) => {
    const db = await getDBConnection();
    await deleteItem(db, 'tasks', id);
    return id;
});

export const restoreTask = createAsyncThunk(
    'tasks/restoreTask',
    async (task: Task) => {
        const db = await getDBConnection();
        const restoredTask: Task = {
            ...task,
            dueDate: new Date().toISOString(), // Ramène la date d'échéance à aujourd'hui
            isCompleted: false, // Marque la tâche comme non terminée
        };
        await updateItem(db, 'tasks', restoredTask);
        
        // ✅ On retourne la tâche complètement restaurée. C'est elle qui sera dans action.payload.
        return restoredTask; 
    }
);

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Tasks
            .addCase(fetchTasks.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
                state.status = 'succeeded';
                state.tasks = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Failed to fetch tasks';
            })
            // Add Task
            .addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
                state.tasks.unshift(action.payload);
            })
            // Update Task & Toggle Status
            .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
                const index = state.tasks.findIndex((task) => task.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(toggleTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
                const index = state.tasks.findIndex((task) => task.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            // Delete Task
            .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
                state.tasks = state.tasks.filter((task) => task.id !== action.payload);
            })
            // Restore Task
            .addCase(restoreTask.pending, (state, action) => {
                // On peut vouloir afficher un indicateur de chargement quelque part
                // Pour l'instant, on ne fait rien pour garder les choses simples
            })
            // ✅ GESTION DE L'ÉTAT DE RESTAURATION CORRIGÉE
            .addCase(restoreTask.fulfilled, (state, action: PayloadAction<Task>) => {
                // On met à jour la tâche directement dans la liste existante.
                // Cela déclenche une mise à jour immédiate de tous les composants qui écoutent.
                const index = state.tasks.findIndex((task) => task.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(restoreTask.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to restore task';
            });
    },
});

export default tasksSlice.reducer;
