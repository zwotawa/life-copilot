export interface ApiGoal {
  id: string;
  title: string;
  whyItMatters?: string | null;
  lane: string;
  type: string;
  status: string;
  priority?: string | null;

  dueStyle: string;
  realDeadline?: string | null;
  targetDate?: string | null;
  minimumTouchFrequency: string;

  currentMilestone?: string | null;
  nextTinyAction?: string | null;
  typicalSessionSize?: string | null;

  energy?: string | null;
  resistance?: string | null;
  excitement?: string | null;

  lastTouchedAt?: string | null;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}