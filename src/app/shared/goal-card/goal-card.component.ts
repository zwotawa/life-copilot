import { Component, OnInit, Input } from '@angular/core';
import { GoalCard } from 'src/app/pages/dashboard/dashboard.component';
import { TimerDialogComponent } from '../timer-dialog/timer-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { GoalAction } from 'src/app/core/goal-action.model';

export interface TimerDialogData {
  goalType: string;
  goal: GoalAction;
}


@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent implements OnInit {

  @Input() cardData?: GoalCard;

  public actionsLength: number = 0;
  public selection: number = 0;

  
  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    if(this.cardData) {
      this.actionsLength = this.cardData.nextActions.length;
    }
  }

  public openTimerDialog(): void {
    const dialogRef = this.dialog.open(TimerDialogComponent, {
      height: '400px',
      width: '600px',
      data: { goalType: this.cardData?.title, goalAction: this.cardData?.nextActions[this.selection]}
    });
  }
  

}
