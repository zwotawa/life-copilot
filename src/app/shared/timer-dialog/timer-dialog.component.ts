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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  public secondsLeft: number = 600;
  public isRunning: boolean = true;
  public goalReason: string = '';
  public countdown$: Observable<number> = new Observable();
  public countdownComplete: boolean = false;
  public pauseResume$: BehaviorSubject<boolean> = new BehaviorSubject(this.isRunning);
  public stuckButtonsShown: boolean = false;
  public reasonFix: number = -1;



  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TimerDialogData,
    private sanitizer: DomSanitizer
  ) { }

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
    this.secondsLeft = 600;
    this.countdownComplete = false;
    this.pauseResume$.next(true)
  }

  public pauseResume(): void {
    this.pauseResume$.next(!this.isRunning);
    this.isRunning = !this.isRunning;
  }

  public moveToCompleted(): void {
    const updatedGoalAction: GoalAction = {
      id: this.data.goal.id,
      text: this.data.goal.text,
      createdAt: this.data.goal.createdAt,
      sourceInboxId: this.data.goal.sourceInboxId,
      completedAt: formatDate(new Date(), 'yyyy-MM-dd HH:mm', 'en')
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
    this.stuckButtonsShown = !this.stuckButtonsShown;
  }

  public fixText(reason: number): void {
    this.reasonFix = reason;
  }

  public switchToQuickTask(taskNumber: number): void {
    this.reasonFix = -1;
    this.stuckButtonsShown = !this.stuckButtonsShown;
    this.actionText = this.stuckReasons[taskNumber].fix;
    this.secondsLeft = 120;
    this.pauseResume$.next(true);
  }
}
