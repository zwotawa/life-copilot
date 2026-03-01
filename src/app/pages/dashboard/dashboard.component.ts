import { formatDate } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { loadCompletedActions } from 'src/app/core/completed-action.storage';
import { loadDeclutterActions } from 'src/app/core/declutter-action.storage';
import { GoalAction } from 'src/app/core/goal-action.model';
import { InboxItem } from 'src/app/core/inbox.model';
import { loadInbox, saveInbox } from 'src/app/core/inbox.storage';
import { loadJobActions } from 'src/app/core/job-action.storage';
import { loadVehicleActions } from 'src/app/core/vehicle-action.storage';

  export interface GoalCard {
    title: string;
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
    { title: 'Job',
      why: 'to secure retirement funds',
      nextActions: loadJobActions()
    },
    { title: 'Vehicle',
      why: 'to go to land',
      nextActions: loadVehicleActions()
    },
    { title: 'Declutter',
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
      createdAt: formatDate(new Date(), 'yyyy-MM-dd HH:mm', 'en')
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
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    this.todaysCompletedActions = loadCompletedActions().filter((goalAction) => {
      //normalize data to match format of todays date above and compare
      const isoString = goalAction.completedAt?.replace(' ', 'T');
      if(isoString) {
        const date = new Date(isoString);
        const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        return startOfDate.getTime() === startOfToday.getTime();
      } 
      else return;
    });

    this.todaysWinCount = this.todaysCompletedActions.length;
  }

  private completedActionsStreak(): void {
    const completedActions: GoalAction[] = loadCompletedActions();

    const today: Date = new Date();
    const previousDay: Date = new Date(today);
    previousDay.setDate(today.getDate() - 1);
    const formattedPreviousDay: string = previousDay.toISOString().split('T')[0];

    completedActions.forEach(action => {
      if (action.completedAt?.includes(formattedPreviousDay)) {
        this.streakCount += 1;
        previousDay.setDate(previousDay.getDate() - 1);
      } else {
        return;
      }
    });
  }
}
