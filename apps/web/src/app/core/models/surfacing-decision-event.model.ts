export type SurfacingDecisionContext =
  | 'daily_generation'
  | 'daily_replace'
  | 'weekly_save';

export type SurfacingWeeklyRole =
  | 'anchor'
  | 'maintenance'
  | 'infrastructure'
  | 'creative';

export interface SurfacingDecisionEventMetadata {
  date?: string;
  replacedGoalId?: string | null;
  weeklyRole?: SurfacingWeeklyRole | null;
  selected?: boolean;
}

export interface SurfacingDecisionEvent {
  id: string;
  createdAt: string;
  context: SurfacingDecisionContext;
  goalId: string;
  goalTitle: string;
  score: number;
  suggestedCategory: string | null;
  reasons: string[];
  metadata?: SurfacingDecisionEventMetadata | null;
}