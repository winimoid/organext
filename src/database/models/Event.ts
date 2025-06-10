export interface Event {
  id: string; // UUID
  title: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  location?: string;
  createdAt: string; // ISO 8601 format
}