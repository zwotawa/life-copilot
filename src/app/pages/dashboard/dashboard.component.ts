import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  constructor() { 
    this.items = loadInbox();
  }

  ngOnInit(): void {
    this.inboxCount = this.items.length;
  }

  public updateNewText(event: Event): void {
    this.newText = (event.target as HTMLInputElement).value;
    this.addDisabledCheck();
  }

  public addItem(): void {
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const item: InboxItem = {
      id: newId,
      text: this.newText,
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

}
