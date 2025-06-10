// src/services/backgroundTaskService.ts (Nouveau fichier)

import BackgroundFetch from 'react-native-background-fetch';
import { getDBConnection } from '../database/dbService';
import { notificationService } from '../notifications/notificationService';
import { Task } from '../database/models/Task';
import { Appointment } from '../database/models/Appointment';
import { i18n } from '../i18n';

const BACKGROUND_TASK_ID = "com.organext.reminders.task";

/**
 * La logique principale de notre tâche de fond.
 * Scanne la DB et planifie les notifications.
 */
const runReminderScan = async () => {
    console.log('[BackgroundFetch] Task: runReminderScan starting...');
    const db = await getDBConnection();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
        // --- 1. Scanner les tâches ---
        const [taskResults] = await db.executeSql("SELECT * FROM tasks WHERE isCompleted = 0 AND dueDate IS NOT NULL");
        const tasks: Task[] = [];
        for (let i = 0; i < taskResults.rows.length; i++) {
            tasks.push(taskResults.rows.item(i));
        }

        tasks.forEach(task => {
            const dueDate = new Date(task.dueDate!);
            // Si la tâche est pour aujourd'hui ou demain, et pas encore passée
            if (dueDate >= now && dueDate <= tomorrow) {
                // Planifier une notification 1h avant l'échéance (si la date inclut une heure)
                // ou à 9h du matin le jour J.
                const notificationDate = new Date(dueDate);
                if (notificationDate.getHours() === 0 && notificationDate.getMinutes() === 0) {
                    notificationDate.setHours(9, 0, 0, 0); // Rappel à 9h pour les tâches de la journée
                }

                if (notificationDate > new Date()) { // Ne pas notifier pour le passé
                    notificationService.scheduleNotification({
                        id: `task-${task.id}`, // ID unique pour la notif de tâche
                        title: i18n.t('taskReminderTitle'),
                        message: i18n.t('taskReminderMessage', { title: task.title }),
                        date: notificationDate,
                    });
                    console.log(`[BackgroundFetch] Scheduled notification for task: ${task.title}`);
                }
            }
        });

        // --- 2. Scanner les rendez-vous ---
        const [apptResults] = await db.executeSql("SELECT * FROM appointments");
        const appointments: Appointment[] = [];
        for (let i = 0; i < apptResults.rows.length; i++) {
            appointments.push(apptResults.rows.item(i));
        }

        appointments.forEach(appt => {
            const apptDate = new Date(appt.date);
            // Si le RDV est pour aujourd'hui ou demain, et pas encore passé
            if (apptDate >= now && apptDate <= tomorrow) {
                 // Rappel 30 minutes avant
                const notificationDate = new Date(apptDate.getTime() - 30 * 60 * 1000);
                if (notificationDate > new Date()) {
                    notificationService.scheduleNotification({
                        id: `appt-${appt.id}`,
                        title: i18n.t('appointmentReminder'),
                        message: i18n.t('appointmentReminderMessage', { title: appt.title }),
                        date: notificationDate,
                    });
                    console.log(`[BackgroundFetch] Scheduled notification for appointment: ${appt.title}`);
                }
            }
        });

    } catch (error) {
        console.error('[BackgroundFetch] Error during reminder scan:', error);
    }
};

/**
 * Configure et démarre le service de tâches de fond.
 * À appeler une seule fois au démarrage de l'app.
 */
export const configureBackgroundFetch = async () => {
    const onEvent = async (taskId: string) => {
        console.log('[BackgroundFetch] event received:', taskId);
        await runReminderScan();
        // Indispensable de signaler la fin de la tâche au système
        BackgroundFetch.finish(taskId);
    };

    const onTimeout = async (taskId: string) => {
        console.warn('[BackgroundFetch] TIMEOUT:', taskId);
        BackgroundFetch.finish(taskId);
    };

    const status = await BackgroundFetch.configure(
        {
            minimumFetchInterval: 60, // Minutes (iOS l'ajustera, 15 est le minimum)
            stopOnTerminate: false,
            enableHeadless: true, // Permet de lancer la tâche même si l'app est "tuée" (Android)
            startOnBoot: true, // Relance au redémarrage du téléphone (Android)
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Pas besoin de réseau
            requiresCharging: false,
            requiresDeviceIdle: false,
            requiresBatteryNotLow: false,
            requiresStorageNotLow: false,
        },
        onEvent,
        onTimeout
    );

    console.log('[BackgroundFetch] configure status:', status);

    // Optionnel : lancer la tâche manuellement une fois pour tester
    // BackgroundFetch.scheduleTask({
    //     taskId: BACKGROUND_TASK_ID,
    //     delay: 5000, // 5 secondes
    //     periodic: false,
    // });
};
