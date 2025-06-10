// A global type for navigation parameters if needed.
export type RootStackParamList = {
  MainTabs: undefined;
  TaskForm: { taskId?: string };
  EventForm: { eventId?: string, date?: string };
  AppointmentForm: { appointmentId?: string };
  // ... other screens
};

// Add other global types here as the app grows.
