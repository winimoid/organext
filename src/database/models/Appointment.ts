export interface Appointment {
  id: string; // UUID
  title: string;
  date: string; // ISO 8601 format
  contact?: string;
  notes?: string;
  createdAt: string; // ISO 8601 format
}