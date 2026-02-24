import { Component, OnInit, Input } from '@angular/core';
import { GoalCard } from 'src/app/pages/dashboard/dashboard.component';

@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent implements OnInit {

  @Input() cardData?: GoalCard;
  
  constructor() { }

  ngOnInit(): void {
  }

}
