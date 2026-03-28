export type GoalLane =
  | 'career_education'
  | 'life_systems'
  | 'relationships'
  | 'health_body'
  | 'money_admin'
  | 'home_environment'
  | 'mobility_transportation'
  | 'creative_experiments'
  | 'skill_building'
  | 'community_tools'
  | 'custom';

export type GoalType = 'maintain' | 'project' | 'seasonal' | 'exploration';
export type GoalStatus = 'active' | 'paused' | 'someday' | 'completed' | 'archived';
export type DueStyle = 'hard_date' | 'target_window' | 'cadence_only';
export type TouchFrequency = 'daily' | '3x_week' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
export type SessionSize = '5m' | '10m' | '25m' | '60m+';
export type EnergyLevel = 'low' | 'medium' | 'deep';
export type IntensityLevel = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  title: string;
  whyItMatters?: string;
  lane: GoalLane;
  type: GoalType;
  status: GoalStatus;

  dueStyle: DueStyle;
  realDeadline?: string | null;
  targetDate?: string | null;
  minimumTouchFrequency: TouchFrequency;

  currentMilestone?: string;
  nextTinyAction?: string;
  typicalSessionSize?: SessionSize;

  energy?: EnergyLevel;
  resistance?: IntensityLevel;
  excitement?: IntensityLevel;

  lastTouchedAt?: string | null;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}