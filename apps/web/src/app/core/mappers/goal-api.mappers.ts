import { Goal } from '../models/goal.model';
import { ApiGoal } from '../models/api/api-goal.model';

export function fromApiGoal(api: ApiGoal): Goal {
  return {
    id: api.id,
    title: api.title,
    whyItMatters: api.whyItMatters ?? undefined,
    lane: api.lane as Goal['lane'],
    type: api.type as Goal['type'],
    status: api.status as Goal['status'],
    priority: api.priority as Goal['priority'] | undefined,

    dueStyle: api.dueStyle as Goal['dueStyle'],
    realDeadline: api.realDeadline ?? null,
    targetDate: api.targetDate ?? null,
    minimumTouchFrequency: api.minimumTouchFrequency as Goal['minimumTouchFrequency'],

    currentMilestone: api.currentMilestone ?? undefined,
    nextTinyAction: api.nextTinyAction ?? undefined,
    typicalSessionSize: api.typicalSessionSize as Goal['typicalSessionSize'] | undefined,

    energy: api.energy as Goal['energy'] | undefined,
    resistance: api.resistance as Goal['resistance'] | undefined,
    excitement: api.excitement as Goal['excitement'] | undefined,

    lastTouchedAt: api.lastTouchedAt ?? null,
    notes: api.notes ?? undefined,

    createdAt: api.createdAt,
    updatedAt: api.updatedAt
  };
}

export function toApiGoal(goal: Goal): ApiGoal {
  return {
    id: goal.id,
    title: goal.title,
    whyItMatters: goal.whyItMatters ?? null,
    lane: goal.lane,
    type: goal.type,
    status: goal.status,
    priority: goal.priority ?? null,

    dueStyle: goal.dueStyle,
    realDeadline: goal.realDeadline ?? null,
    targetDate: goal.targetDate ?? null,
    minimumTouchFrequency: goal.minimumTouchFrequency,

    currentMilestone: goal.currentMilestone ?? null,
    nextTinyAction: goal.nextTinyAction ?? null,
    typicalSessionSize: goal.typicalSessionSize ?? null,

    energy: goal.energy ?? null,
    resistance: goal.resistance ?? null,
    excitement: goal.excitement ?? null,

    lastTouchedAt: goal.lastTouchedAt ?? null,
    notes: goal.notes ?? null,

    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt
  };
}