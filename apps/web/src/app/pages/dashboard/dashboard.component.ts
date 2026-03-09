import { formatDate } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { loadCompletedActions } from 'src/app/core/completed-action.storage';
import { loadDeclutterActions } from 'src/app/core/declutter-action.storage';
import { GoalAction, GoalKey } from 'src/app/core/goal-action.model';
import { InboxItem } from 'src/app/core/inbox.model';
import { loadInbox, saveInbox } from 'src/app/core/inbox.storage';
import { loadJobActions } from 'src/app/core/job-action.storage';
import { loadVehicleActions } from 'src/app/core/vehicle-action.storage';
import { isSameDay } from 'src/app/shared/utility/same-day-comparison';

  export interface GoalCard {
    goalKey: GoalKey;
    why: string;
    nextActions: GoalAction[];
  }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public goalCards: GoalCard[] = [
    { goalKey: 'job',
      why: 'to secure retirement funds',
      nextActions: loadJobActions()
    },
    { goalKey: 'vehicle',
      why: 'to go to land',
      nextActions: loadVehicleActions()
    },
    { goalKey: 'declutter',
      why: 'peace of mind',
      nextActions: loadDeclutterActions()
    }
  ];

  public items: InboxItem[];
  public newText :string = '';
  public addDisabled: boolean = true;
  public inboxCount = 0;
  public todaysCompletedActions: GoalAction[] = [];
  public todaysWinCount: number = 0;
  public streakCount = 0;

  constructor() { 
    this.items = loadInbox();
  }

  ngOnInit(): void {
    this.inboxCount = this.items.length;
    this.loadTodaysCompletedActions();
    this.completedActionsStreak();
  }

  ngAfterViewInit() {
  
  }

  public updateNewText(event: Event): void {
    this.newText = (event.target as HTMLInputElement).value;
    this.addDisabledCheck();
  }

  public addItem(): void {
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const item: InboxItem = {
      id: newId,
      text: this.newText.trim(),
      createdAt: Date.now()
    }

    const items: InboxItem[] = [item, ...this.items];

    //save limit of 50 items
    if(items.length > 49) return;

    saveInbox(items);
    this.items = loadInbox();
    this.inboxCount = this.items.length;
  }
  
  private addDisabledCheck(): void {
    if( this.newText == '') this.addDisabled = true;
    else this.addDisabled = false;
  }

  private loadTodaysCompletedActions(): void {
    const today = new Date();

    this.todaysCompletedActions = loadCompletedActions().filter((goalAction) => {
      if(goalAction.completedAt) {
        const actionDate: Date = new Date(goalAction.completedAt);
        return isSameDay(today, actionDate);
      }
      else return;
    });

    this.todaysWinCount = this.todaysCompletedActions.length;
  }

  private completedActionsStreak(): void {
    const completedActions: GoalAction[] = loadCompletedActions();

    if(this.todaysWinCount) {
      this.streakCount += 1;
    }

    const today: Date = new Date();
    const previousDay: Date = new Date(today);
    previousDay.setDate(today.getDate() - 1);

    let previouslyMatchedDay: Date | null = null;

    completedActions.forEach(action => {
      //if completed action isn't null continue check
      if(action.completedAt) {
        const actionDate: Date = new Date(action.completedAt);

        //if previously matched date exists 
        if(previouslyMatchedDay) {
          //and it matches the currect action, skip to the next action
          if( isSameDay(actionDate, previouslyMatchedDay)) {
            return;
          }
        
        }
        //if it's a new unmatched date, check if it matches the new previous day  
          if(isSameDay(new Date(actionDate), previousDay)) {
            this.streakCount += 1;
            previouslyMatchedDay = actionDate;
            previousDay.setDate(previousDay.getDate() - 1);
          } else {
            return;
          }
        
      }
    });
  }
}
