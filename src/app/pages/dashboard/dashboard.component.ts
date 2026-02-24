import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit(): void {
  }

  

}
