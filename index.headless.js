// index.headless.js (Nouveau fichier à la racine)

import BackgroundFetch from 'react-native-background-fetch';
// On ne peut pas importer tout le service ici car il est en TypeScript
// et dépend de l'app initialisée. On doit recréer la logique minimale.
import { openDatabase } from 'react-native-sqlite-storage';
import { scheduleNotification } from './src/notifications/notificationService';

// La logique doit être réécrite en JS simple ici.
// C'est une version simplifiée de runReminderScan
const headlessTask = async (event) => {
    const taskId = event.taskId;
    console.log('[BackgroundFetch Headless] event: ', taskId);

    try {
        const db = await openDatabase({ name: 'organext.db', location: 'default' });
        // Logique de scan simplifiée pour l'exemple
        const [taskResults] = await db.executeSql("SELECT * FROM tasks WHERE isCompleted = 0 AND dueDate IS NOT NULL");
        // ... Itérer et planifier les notifications comme dans runReminderScan
        if (taskResults && taskResults.rows && taskResults.rows.length > 0) {
            for (let i = 0; i < taskResults.rows.length; i++) {
            const task = taskResults.rows.item(i);
            // Exemple: planifier une notification si la date d'échéance est dans le futur
            if (task.dueDate && new Date(task.dueDate) > new Date()) {
                await scheduleNotification({
                    id: String(task.id),
                    title: 'Rappel de tâche',
                    message: task.title || 'Vous avez une tâche à faire',
                    date: new Date(task.dueDate)
                });
            }
            }
        }
        console.log('[BackgroundFetch Headless] Scan complete.');
    } catch (e) {
        console.error('[BackgroundFetch Headless] FAILED:', e);
    }

    BackgroundFetch.finish(taskId);
};


BackgroundFetch.registerHeadlessTask(headlessTask);
