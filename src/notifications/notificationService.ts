import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';
import { navigate } from '../services/navigationService';

export interface NotificationPayload {
    id: string;
    title: string;
    message: string;
    date: Date;
    userInfo?: {
        type: 'task' | 'event' | 'appointment';
        id: string;
    };
}

class NotificationService {
    public configure() {
        PushNotification.configure({
            onRegister: function (token) {
                console.log('NOTIFICATION TOKEN:', token);
            },
            onNotification: function (notification) {
                console.log('NOTIFICATION:', notification);

                // ✅ LOGIQUE DE NAVIGATION FINALISÉE
                if (notification.userInteraction && notification.data) {
                    const { type, id } = notification.data;
                    
                    switch (type) {
                        case 'task':
                            // Navigue vers l'écran des tâches (le détail n'est pas directement accessible depuis la racine)
                            // Pour une V2, on pourrait passer l'ID pour ouvrir un modal par-dessus
                            navigate('TasksTab', { screen: 'TaskList' }); 
                            break;
                        case 'event':
                            navigate('CalendarTab', { screen: 'CalendarView' });
                            break;
                        case 'appointment':
                            navigate('AppointmentsTab', { screen: 'AppointmentList' });
                            break;
                        default:
                            console.log('Type de notification inconnu pour la navigation');
                    }
                }
                // Required for iOS to display the notification when the app is in the foreground
                // notification.finish(PushNotificationIOS.FetchResult.NoData);
            },
            permissions: {
                alert: true,
                badge: true,
                sound: true,
            },
            popInitialNotification: true,
            requestPermissions: Platform.OS === 'ios',
        });

        this.createDefaultChannels();
    }

    private createDefaultChannels() {
        PushNotification.createChannel(
            {
                channelId: 'default-channel-id', // (required)
                channelName: 'Default Channel', // (required)
                channelDescription: 'A default channel for app notifications', // (optional)
                playSound: true,
                soundName: 'default',
                importance: Importance.HIGH,
                vibrate: true,
            },
            (created) => console.log(`createChannel 'default-channel-id' returned '${created}'`)
        );
    }
    
    /**
     * Schedules a future local notification.
     * @param {NotificationPayload} payload The notification details.
     */
    public scheduleNotification({ id, title, message, date, userInfo }: NotificationPayload) {
        if (date <= new Date()) {
            console.log(`Notification for "${title}" is in the past. Not scheduling.`);
            return;
        }

        PushNotification.localNotificationSchedule({
            channelId: 'organext-reminders',
            id: id,
            title: title,
            message: message,
            date: date,
            allowWhileIdle: true,
            // ✅ On s'assure que userInfo est bien passé dans la prop 'data'
            userInfo: userInfo,
            // Sur Android, 'data' est plus fiable pour la récupération
            // data: userInfo,
        });
        
        console.log(`Notification scheduled for "${title}" at ${date.toLocaleString()}`);
    }

    /**
     * Cancels a specific scheduled notification by its ID.
     * @param {string} id The ID of the notification to cancel.
     */
    public cancelNotification(id: string) {
        PushNotification.cancelLocalNotification(id);
        console.log(`Cancelled notification with ID: ${id}`);
    }

    /**
     * Cancels all scheduled notifications.
     */
    public cancelAllNotifications() {
        PushNotification.cancelAllLocalNotifications();
    }
}

export const notificationService = new NotificationService();
