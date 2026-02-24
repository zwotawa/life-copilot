import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InboxItem } from 'src/app/core/inbox.model';
import { loadInbox, saveInbox } from 'src/app/core/inbox.storage';

  export interface GoalCard {
    title: string;
    why: string;
    nextAction: string;
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
      nextAction: 'workin on it',
    },
    { title: 'Vehicle',
      why: 'to go to land',
      nextAction: 'workin on it',
    },
    { title: 'Declutter',
      why: 'peace of mind',
      nextAction: 'workin on it',
    }
  ];

  public items: InboxItem[];
  public newText :string = '';
  public addDisabled: boolean = true;

  constructor() { 
    this.items = loadInbox();
  }

  ngOnInit(): void {
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
  }
  
  private addDisabledCheck(): void {
    if( this.newText == '') this.addDisabled = true;
    else this.addDisabled = false;
  }

}
