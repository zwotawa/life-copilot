import { Observable } from 'rxjs';
import { GoalMilestone } from '../models/goal-milestone.model';

export abstract class GoalMilestoneRepository {
  public abstract getMilestonesForGoal(goalId: string): Observable<GoalMilestone[]>;
  public abstract addMilestone(milestone: GoalMilestone): Observable<GoalMilestone>;
  public abstract updateMilestone(milestone: GoalMilestone): Observable<GoalMilestone>;
  public abstract deleteMilestone(id: string): Observable<void>;
  public abstract reorderMilestones(goalId: string, milestones: GoalMilestone[]): Observable<GoalMilestone[]>;
}