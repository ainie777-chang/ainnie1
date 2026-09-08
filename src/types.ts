export type Importance = 'A' | 'B' | 'C' | 'D' | 'E';
export type Urgency = '상' | '중' | '하';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type ViewMode = 'month' | 'week' | 'list';

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg/text/border class
  dotColor: string;
  badgeBg: string;
  badgeText: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  categoryId: string;
  importance: Importance;
  urgency: Urgency;
  status: TaskStatus;
  progress: number; // 0 - 100 percentage
  allDay: boolean;
  createdAt: string;
}
