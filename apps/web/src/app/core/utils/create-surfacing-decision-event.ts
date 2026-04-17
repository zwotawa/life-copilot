import { SurfacingDecisionEvent } from '../models/surfacing-decision-event.model';

export function createSurfacingDecisionEvent(
  partial: Omit<SurfacingDecisionEvent, 'id' | 'createdAt'>
): SurfacingDecisionEvent {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...partial
  };
}