export type DailyRotationCategory =
  | 'responsible'
  | 'momentum'
  | 'maintenance'
  | 'interesting'
  | 'fallback';

export interface DailyRotationItem {
  id: string;
  date: string;
  category: DailyRotationCategory;
  goalId: string | null;
  goalTitle: string;
  actionText: string;
  sessionSize?: string | null;
  completed: boolean;
  surfacingScore?: number | null;
  surfacingReasons?: string[];
}