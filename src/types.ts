export type CategoryType = string;

export type PriorityType = 'high' | 'medium' | 'low';

export type StatusType = 'todo' | 'in-progress' | 'completed';

export type ThemeType = 'dark' | 'light' | 'system';
export type ColorSchemeType = 'default' | 'emerald' | 'sunset' | 'monochrome' | 'royal' | 'neon';

export interface Teammate {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
}

export interface ChecklistItemSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorEmail?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string; // ID of the category/phase
  priority: PriorityType;
  status: StatusType;
  notes?: string;
  custom?: boolean;
  updatedAt?: string;
  assignedTo?: string[]; // list of teammate IDs
  dueDate?: string;
  timeline?: string;
  subtasks?: ChecklistItemSubtask[];
  tags?: string[];
  comments?: TaskComment[];
  completedAt?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string; // Name of Lucide icon
  color: string; // Style code (border/accent)
  lightColor: string; // Background light state
  textColor: string; // Accent text
}

export interface Project {
  id: string;
  name: string;
  description: string;
  categories: CategoryInfo[];
  items: ChecklistItem[];
  team: Teammate[];
  createdAt: string;
}

export interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  highPriorityCount: number;
  progressPercentage: number;
}
