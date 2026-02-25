import { Component, OnInit, Input } from '@angular/core';
import { GoalAction } from 'src/app/core/goal-action.model';
import { InboxItem } from 'src/app/core/inbox.model';
import { loadInbox, saveInbox } from 'src/app/core/inbox.storage';
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

  private jobActions: GoalAction[] = [];
  private vehicleActions: GoalAction[] = [];
  private declutterActions: GoalAction[] = [];



  constructor() { }

  ngOnInit(): void {
  }

  public convertToJobAction(): void {
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if(this.itemData) {
      const action: GoalAction = {
        id: newId,
        text: this.itemData.text,
        createdAt: this.itemData.createdAt,
        sourceInboxId: this.itemData.id
      }

      this.jobActions = loadJobActions();

      const updatedJobActions: GoalAction[] = [action, ...this.jobActions];

      saveJobActions(updatedJobActions);

      this.removeInboxItemById(this.itemData.id);
    }
  }

  public convertToVehicleAction(): void {
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if(this.itemData) {
      const action: GoalAction = {
        id: newId,
        text: this.itemData.text,
        createdAt: this.itemData.createdAt,
        sourceInboxId: this.itemData.id
      }

      this.vehicleActions = loadVehicleActions();

      const updatedVehicleActions: GoalAction[] = [action, ...this.vehicleActions];

      saveVehicleActions(updatedVehicleActions);

      this.removeInboxItemById(this.itemData.id);
    }
  }

  public convertToDeclutterAction(): void {
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if(this.itemData) {
      const action: GoalAction = {
        id: newId,
        text: this.itemData.text,
        createdAt: this.itemData.createdAt,
        sourceInboxId: this.itemData.id
      }

      this.declutterActions = loadDeclutterActions();

      const updatedDeclutterActions: GoalAction[] = [action, ...this.declutterActions];

      saveDeclutterActions(updatedDeclutterActions);

      this.removeInboxItemById(this.itemData.id);
    }
  }

  private removeInboxItemById(idToRemove: string): void {
    const items: InboxItem[] = loadInbox();
    const updatedInboxItems: InboxItem[] = items.filter(item => item.id !== idToRemove);

    saveInbox(updatedInboxItems);
  }
}
