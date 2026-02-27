import { Component, OnInit, Input } from '@angular/core';
import { GoalAction } from 'src/app/core/goal-action.model';
import { InboxItem } from 'src/app/core/inbox.model';
import { loadInbox, removeInboxItemById, saveInbox } from 'src/app/core/inbox.storage';
import { loadJobActions, saveJobActions } from 'src/app/core/job-action.storage';
import { loadVehicleActions, saveVehicleActions } from 'src/app/core/vehicle-action.storage';
import { loadDeclutterActions, saveDeclutterActions } from 'src/app/core/declutter-action.storage';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {

  @Input() itemData?: InboxItem;

  constructor() { }

  ngOnInit(): void {
  }

  public moveToGoal(goal: string) {

    if(this.itemData) {
      const action: GoalAction = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        text: this.itemData.text,
        createdAt: this.itemData.createdAt,
        sourceInboxId: this.itemData.id
      }

      switch (goal) {
        case 'job':
          const jobActions = loadJobActions();
          const updatedJobActions: GoalAction[] = [action, ...jobActions];
          saveJobActions(updatedJobActions);
          break;
        case 'vehicle':
          const vehicleActions = loadVehicleActions();
          const updatedVehicleActions: GoalAction[] = [action, ...vehicleActions];
          saveVehicleActions(updatedVehicleActions);
          break;
        case 'declutter':
          const declutterActions = loadDeclutterActions();
          const updatedDeclutterActions: GoalAction[] = [action, ...declutterActions];
          saveDeclutterActions(updatedDeclutterActions);
          break;
        default:
          break;
      }

      removeInboxItemById(this.itemData.id);
    }
  }
}
