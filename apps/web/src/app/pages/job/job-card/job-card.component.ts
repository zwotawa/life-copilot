import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GoalAction } from 'src/app/core/goal-action.model';
import { loadJobActions, saveJobActions } from 'src/app/core/job-action.storage';
import { JobCard } from 'src/app/core/job-pipeline.model';

export interface CardMovement {
  card: JobCard,
  moveDirection: MoveDirection
}

export interface NextTouchUpdate {
  card: JobCard,
  daysFromNow: number
}

export type MoveDirection = 'back' | 'forward';

@Component({
  selector: 'app-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.scss']
})
export class JobCardComponent implements OnInit {

  @Input() jobCardData: JobCard = <JobCard>{}

  @Output() moveEvent: EventEmitter<CardMovement> = new EventEmitter<CardMovement>();
  @Output() touchUpdateEvent: EventEmitter<NextTouchUpdate> = new EventEmitter<NextTouchUpdate>();

  public back: MoveDirection = 'back';
  public forward: MoveDirection = 'forward';

  constructor() { }

  ngOnInit(): void {
  }

  public moveCard(card: JobCard, moveDirection: MoveDirection): void {
    this.moveEvent.emit({ card, moveDirection }); 
  }

  public nextTouch(card: JobCard, daysFromNow: number): void {
    this.touchUpdateEvent.emit({ card, daysFromNow });
  }

  public addJobAction(): void {
    const action: GoalAction = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      text: `Follow up with ${this.jobCardData.company} about ${this.jobCardData.role}`,
      goalKey: 'job',
      createdAt: Date.now(),
    }

    const jobActions = loadJobActions();
    const updatedJobActions: GoalAction[] = [action, ...jobActions];
    saveJobActions(updatedJobActions);
  }

  get stale(): boolean {
    const sevenDaysInMilliseconds = 1000 * 60 * 60 * 24 * 7; // milliseconds * seconds * minutes * hours * days
    const sevenDaysAgoTime = Date.now() - sevenDaysInMilliseconds;

    // Check if the target date's time is less than the timestamp from 7 days ago
    return this.jobCardData.lastTouchedAt < sevenDaysAgoTime;
  }

  get due(): boolean {
    if(this.jobCardData.nextTouchAt && this.jobCardData.nextTouchAt <= Date.now()) {
      return true;
    } else {
      return false;
    }
  }

}
