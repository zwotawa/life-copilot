import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerDialogData } from '../goal-card/goal-card.component';
import { SecondsToMinutesPipe } from '../pipes/seconds-to-minutes.pipe';
import { map, Observable, timer, BehaviorSubject, Subject, switchMap, NEVER } from 'rxjs';

@Component({
  selector: 'app-timer-dialog',
  templateUrl: './timer-dialog.component.html',
  styleUrls: ['./timer-dialog.component.scss']
})
export class TimerDialogComponent implements OnInit {

  public goalType: string = '';
  public actionText: string = '';
  public secondsLeft: number = 5;
  public isRunning: boolean = true;
  public countdown$: Observable<number> = new Observable();
  public countdownComplete: boolean = false;
  public pauseResume$: BehaviorSubject<boolean> = new BehaviorSubject(this.isRunning);


  constructor(@Inject(MAT_DIALOG_DATA) public data: TimerDialogData) { }

  ngOnInit(): void {
    this.goalType = this.data.goalType;
    this.actionText = this.data.actionText;
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

}
