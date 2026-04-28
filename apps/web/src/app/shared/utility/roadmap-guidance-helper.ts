import { RoadmapGoalStatus } from "src/app/core/models/goal-roadmap-status.model";
import { RoadmapGuidance } from "src/app/core/models/roadmap-guidance.model";

export function getGuidanceForStatus(status: RoadmapGoalStatus): RoadmapGuidance {
  switch (status) {
    case 'no_active_milestone':
      return {
        title: 'Choose the next milestone',
        message: 'This goal needs one active milestone so the app knows what to surface next.',
        primaryActionLabel: 'Add Milestone',
        secondaryActionLabel: 'Set Active'
      };

    case 'no_tasks':
      return {
        title: 'Add the next tiny task',
        message: 'This active milestone needs at least one concrete tiny task before it can show up cleanly in Daily Rotation.',
        primaryActionLabel: 'Add Tiny Task'
      };

    case 'all_tasks_complete':
      return {
        title: 'Review this milestone',
        message: 'All tiny tasks are complete. Add another tiny task or mark the milestone complete.',
        primaryActionLabel: 'Add Tiny Task',
        secondaryActionLabel: 'Complete Milestone'
      };

    case 'has_remaining_tasks':
      return {
        title: 'Ready for action',
        message: 'This goal has an unfinished tiny task ready for Daily Rotation.',
        primaryActionLabel: 'View Tiny Tasks'
      };
  }
}