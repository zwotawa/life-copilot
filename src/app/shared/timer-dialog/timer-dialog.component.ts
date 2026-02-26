import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerDialogData } from '../goal-card/goal-card.component';
import { SecondsToMinutesPipe } from '../pipes/seconds-to-minutes.pipe';
import { map, Observable, takeWhile, timer } from 'rxjs';
@Component({
  selector: 'app-timer-dialog',
  templateUrl: './timer-dialog.component.html',
  styleUrls: ['./timer-dialog.component.scss']
})
export class TimerDialogComponent implements OnInit {

  private goalType: string = '';
  public actionText: string = '';
  public secondsLeft: number = 5;
  public isRunning: boolean = false;
  public countdown$: Observable<number> = new Observable();
  public countdownComplete: boolean = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: TimerDialogData) { }

  ngOnInit(): void {
    this.goalType = this.data.goalType;
    this.actionText = this.data.actionText;
    this.startTimer();
  }

  private startTimer(): void {
    this.countdown$ = timer(0, 1000).pipe(
      map(() => {
        this.secondsLeft--;
        if (this.secondsLeft == 0) this.countdownComplete = true;
        return this.secondsLeft;
      }),
      takeWhile(value => value >= 0)
    );
  } 

  public restartTimer(): void {
    this.secondsLeft = 600;
    this.countdownComplete = false;
    this.startTimer();
  }

}
