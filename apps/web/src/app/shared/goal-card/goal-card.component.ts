import { Component, OnInit, Input, TrackByFunction } from '@angular/core';
import { GoalCard } from 'src/app/pages/dashboard/dashboard.component';
import { TimerDialogComponent } from '../timer-dialog/timer-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { GoalAction, GoalKey } from 'src/app/core/goal-action.model';
import { CapitalilzeFirstLetter } from '../pipes/capitalize-first-letter.pipe';
import { loadSelectedActions, saveSelectedActions } from 'src/app/core/selected-action.storage';
import { MatRadioModule } from '@angular/material/radio';

export interface TimerDialogData {
  goalKey: GoalKey;
  goal: GoalAction;
  goalReason: string;
}

export interface SelectedAction {
  goalKey: GoalKey;
  selection: string;
}


@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent implements OnInit {

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
    this.restoreSelectedActions();
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

  public saveSelection(id: string): void {
    const persistedActions: SelectedAction[] = loadSelectedActions();
    persistedActions.forEach(selectedAction => {
      if(selectedAction.goalKey === this.cardData?.goalKey) {
        selectedAction.selection = id;
      }
    });
    saveSelectedActions(persistedActions);
  }

  public restoreSelectedActions(): void {
    const persistedActions: SelectedAction[] = loadSelectedActions();
    let updatedPersistedActions: SelectedAction[] = [];
    let match: boolean = false;
    persistedActions.forEach(selectedAction => {
      if(selectedAction.goalKey === this.cardData?.goalKey) {
        this.currentSelectionId = selectedAction.selection;        
        match = true;
      }
    });

    //seed data if entry doesn't exist
    if(!match) {
      updatedPersistedActions = [this.selectedAction, ...persistedActions];
      saveSelectedActions(updatedPersistedActions);
    }
  }
  

  trackById: TrackByFunction<GoalAction> = (item: any): string => {return item.id}
  

}
