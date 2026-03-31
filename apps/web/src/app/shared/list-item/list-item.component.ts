import { Component, OnInit, Input } from '@angular/core';
import { GoalAction, GoalKey } from 'src/app/core/goal-action.model';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

  @Input() itemData?: any;

  constructor() { }

  ngOnInit(): void {
  }

  public moveToGoal(goal: GoalKey) {

    if(this.itemData) {
      const action: GoalAction = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        text: this.itemData.text,
        goalKey: goal,
        createdAt: this.itemData.createdAt,
        sourceInboxId: this.itemData.id
      }

      //add to goal's next actions
      switch (goal) {
        case 'job':
          break;
        case 'vehicle':
          break;
        case 'declutter':
          break;
        default:
          break;
      }

      //remove from inbox
    }
  }
}
