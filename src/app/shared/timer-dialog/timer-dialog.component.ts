import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerDialogData } from '../goal-card/goal-card.component';
import { SecondsToMinutesPipe } from '../pipes/seconds-to-minutes.pipe';
import { map, Observable, timer, BehaviorSubject, Subject, switchMap, NEVER } from 'rxjs';
import { GoalAction } from 'src/app/core/goal-action.model';
import { loadCompletedActions, saveCompletedActions } from 'src/app/core/completed-action.storage';
import { formatDate } from '@angular/common';
import { removeJobActionById } from 'src/app/core/job-action.storage';
import { removeVehicleActionById } from 'src/app/core/vehicle-action.storage';
import { removeDeclutterActionById } from 'src/app/core/declutter-action.storage';

interface StuckReasons {
  reason: string;
  fix: string;
}

@Component({
  selector: 'app-timer-dialog',
  templateUrl: './timer-dialog.component.html',
  styleUrls: ['./timer-dialog.component.scss']
})
export class TimerDialogComponent implements OnInit {

  public stuckReasons: StuckReasons[] = [
    {
      reason: 'Uncertainty',
      fix: 'Ask More Questions'
    },
    {
      reason: 'Fear of Failure',
      fix: 'Remember the Fear of not trying'
    },
    {
      reason: 'Boredom',
      fix: 'Take a Break'
    },
    {
      reason: 'Too Big',
      fix: 'Cut the scope in half'
    },
    {
      reason: 'Tired',
      fix: 'Sleep'
    },
    {
      reason: 'Other',
      fix: 'Ask Chat'
    }
  ]

  public goalType: string = '';
  public actionText: string = '';
  public secondsLeft: number = 5;
  public isRunning: boolean = true;
  public goalReason: string = '';
  public countdown$: Observable<number> = new Observable();
  public countdownComplete: boolean = false;
  public pauseResume$: BehaviorSubject<boolean> = new BehaviorSubject(this.isRunning);
  public stuckButtonsShown: boolean = false;
  public reasonFix: number = -1;
  private totalSecondsPassed = 0;


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TimerDialogData) { }

  ngOnInit(): void {
    this.goalType = this.data.goalType;
    this.actionText = this.data.goal.text ? this.data.goal.text : '';
    this.goalReason = this.data.goalReason
    this.startTimer();
  }

  private startTimer(): void {
    this.countdown$ = this.pauseResume$.pipe(
      switchMap(running => running ? timer(0, 1000)  : NEVER ),
      map(() => {
        if(this.secondsLeft > 0) {
          this.secondsLeft--;
        } 
        else {
          this.countdownComplete = true;
        }
        return this.secondsLeft;
      })
    )
  } 

  public restartTimer(): void {
    this.totalSecondsPassed = 600 - this.secondsLeft;
    this.secondsLeft = 600;
    this.countdownComplete = false;
    this.pauseResume$.next(true)
  }

  public pauseResume(): void {
    this.pauseResume$.next(!this.isRunning);
    if(this.stuckButtonsShown) this.stuckButtonsShown = false;
    this.isRunning = !this.isRunning;
  }

  public moveToCompleted(): void {
    this.totalSecondsPassed += 600 - this.secondsLeft;
    const updatedGoalAction: GoalAction = {
      id: this.data.goal.id,
      text: this.data.goal.text,
      createdAt: this.data.goal.createdAt,
      sourceInboxId: this.data.goal.sourceInboxId,
      completedAt: formatDate(new Date(), 'yyyy-MM-dd HH:mm', 'en'),
      durationSeconds: this.totalSecondsPassed,
      goalKey: this.goalType
    }

    const completedActions: GoalAction[] = loadCompletedActions();
    const updatedCompletedActions: GoalAction[] = [updatedGoalAction, ...completedActions]
    saveCompletedActions(updatedCompletedActions);

    switch(this.goalType.toLowerCase()) {
      case 'job':
        removeJobActionById(this.data.goal.id);
        break;
      case 'vehicle':
        removeVehicleActionById(this.data.goal.id);
        break;
      case 'declutter':
        removeDeclutterActionById(this.data.goal.id);
        break;
      default:
        break;
    }
  }

  public showStuckButtons(): void {
    this.pauseResume$.next(false);
    this.isRunning = false;
    this.stuckButtonsShown = true;
  }

  public fixText(reason: number): void {
    this.reasonFix = reason;
  }

  public switchToQuickTask(taskNumber: number): void {
    this.reasonFix = -1;
    this.stuckButtonsShown = !this.stuckButtonsShown;
    this.actionText = this.stuckReasons[taskNumber].fix;
    this.secondsLeft = 120;
    this.totalSecondsPassed = 0;
    this.pauseResume$.next(true);
  }
}
