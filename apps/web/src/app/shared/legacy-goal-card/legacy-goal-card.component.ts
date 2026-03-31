import { Component, OnInit, Input, TrackByFunction } from '@angular/core';
import { GoalCard } from 'src/app/pages/dashboard/dashboard.component';
import { TimerDialogComponent } from '../timer-dialog/timer-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CapitalilzeFirstLetter } from '../pipes/capitalize-first-letter.pipe';
import { MatRadioModule } from '@angular/material/radio';

export interface TimerDialogData {
  goalKey: any;
  goal: any;
  goalReason: string;
}

export interface SelectedAction {
  goalKey: any;
  selection: string;
}


@Component({
  selector: 'legacy-app-goal-card',
  templateUrl: './legacy-goal-card.component.html',
  styleUrls: ['./legacy-goal-card.component.scss']
})
export class LegacyGoalCardComponent implements OnInit {

  @Input() cardData?: GoalCard;

  public actionsLength: number = 0;
  public currentSelectionId: string | null = '';
  public selectedAction: SelectedAction = {
    goalKey: 'job',
    selection: ''
  }

  
  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    if(this.cardData) {
      this.actionsLength = this.cardData.nextActions.length;
      this.selectedAction.goalKey = this.cardData.goalKey;
    }
  }

  public openTimerDialog(): void {
    const dialogRef = this.dialog.open(TimerDialogComponent, {
      height: '400px',
      width: '600px',
      data: { 
        goalKey: this.cardData?.goalKey, 
        goal: this.cardData?.nextActions[+this.selectedAction.selection],
        goalReason: this.cardData?.why
      }
    });
  }

  trackById: TrackByFunction<any> = (item: any): string => {return item.id}
}
