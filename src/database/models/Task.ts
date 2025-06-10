export interface Task {
  id: string; // UUID
  title: string;
  description?: string;
  dueDate?: string; // ISO 8601 format
  isCompleted: boolean;
  createdAt: string; // ISO 8601 format
}