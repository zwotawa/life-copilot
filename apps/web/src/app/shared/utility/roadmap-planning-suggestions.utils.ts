import { RoadmapGoalStatus } from 'src/app/core/models/goal-roadmap-status.model';
import { PlanningSuggestion } from '../../core/models/planning-suggestion.model';

export function getPlanningSuggestionsForState(
  planningStatus: RoadmapGoalStatus
): PlanningSuggestion[] {
  switch (planningStatus) {
    case 'no_active_milestone':
      return [
        {
          id: 'setup-basics',
          type: 'milestone',
          title: 'Set up the basics',
          description: 'Create the simplest structure needed to make this goal easier to work on.',
          actionLabel: 'Add Milestone'
        },
        {
          id: 'first-small-version',
          type: 'milestone',
          title: 'Complete one small version',
          description: 'Define a small, finished version of this goal that could be completed soon.',
          actionLabel: 'Add Milestone'
        },
        {
          id: 'repeatable-routine',
          type: 'milestone',
          title: 'Create the first repeatable routine',
          description: 'Turn this goal into a simple routine you can return to regularly.',
          actionLabel: 'Add Milestone'
        }
      ];

    case 'no_tasks':
      return [
        {
          id: 'define-next-action',
          type: 'tiny_task',
          title: 'Define the smallest next action',
          description: 'Write one concrete action that could be completed in a short session.',
          actionLabel: 'Add Task'
        },
        {
          id: 'gather-materials',
          type: 'tiny_task',
          title: 'Gather the materials or information needed',
          description: 'Prepare what you need before trying to make progress.',
          actionLabel: 'Add Task'
        },
        {
          id: 'ten-minute-progress',
          type: 'tiny_task',
          title: 'Spend 10 minutes making visible progress',
          description: 'Do a small timed session and stop when the timer ends.',
          actionLabel: 'Add Task'
        }
      ];

    case 'all_tasks_complete':
      return [
        {
          id: 'add-follow-up',
          type: 'tiny_task',
          title: 'Add one follow-up tiny task',
          description: 'If this milestone is not done yet, define the next concrete move.',
          actionLabel: 'Add Task'
        },
        {
          id: 'write-progress-note',
          type: 'review_action',
          title: 'Write a short progress note',
          description: 'Capture what changed before deciding the next move.',
          actionLabel: 'Use This'
        },
        {
          id: 'complete-milestone',
          type: 'review_action',
          title: 'Mark this milestone complete',
          description: 'If the milestone outcome is achieved, close it out.',
          actionLabel: 'Complete Milestone'
        }
      ];

    case 'has_remaining_tasks':
      return [];
  }
}