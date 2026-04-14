import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { GoalCreationWorkflowService } from 'src/app/core/services/goal-creation-workflow.service';
import { EditableDraft } from 'src/app/core/utils/editable-draft';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss']
})
export class GoalFormComponent implements OnChanges {
  @Input() goal: Goal = {} as Goal;

  private readonly goalDraft = new EditableDraft<Goal>(
    goal => this.cloneGoal(goal),
    (a, b) => this.areGoalsEqual(a, b)
  );

  public isSaving = false;
  public saveError: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly location: Location,
    private readonly goalCreateWorkflowService: GoalCreationWorkflowService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['goal']?.currentValue) {
      const initializedGoal = this.buildInitialGoal(changes['goal'].currentValue as Goal);
      this.goalDraft.initialize(initializedGoal);
      this.saveError = null;
    }
  }

  public canDeactivate(): boolean {
    if (this.isSaving) {
      return false;
    }

    if (!this.hasUnsavedChanges) {
      return true;
    }

    return window.confirm(
      'You have unsaved changes on this goal. Leave this page and lose those changes?'
    );
  }

  public get draft(): Goal | null {
    return this.goalDraft.value;
  }

  public get isNewGoal(): boolean {
    return !this.draft?.id;
  }

  public get hasUnsavedChanges(): boolean {
    return this.goalDraft.hasUnsavedChanges;
  }

  public get canSaveExistingGoal(): boolean {
    return !this.isNewGoal && this.hasUnsavedChanges;
  }

  public get canSaveNewGoal(): boolean {
    const draft = this.draft;
    return !!draft && !!draft.title?.trim();
  }

  public get canSubmit(): boolean {
    if (this.isSaving || !this.draft) {
      return false;
    }

    return this.isNewGoal ? this.canSaveNewGoal : this.canSaveExistingGoal;
  }

  public onSubmit(goalForm: any): void {
    if (!this.canSubmit || goalForm.invalid || !this.draft) {
      return;
    }

    this.isSaving = true;
    this.saveError = null;

    if (this.draft.id) {
      this.goalCreateWorkflowService.updateGoal(this.draft).pipe(
        finalize(() => {
          this.isSaving = false;
        })
      ).subscribe({
        next: savedGoal => {
          this.goalDraft.replace(savedGoal);
          this.router.navigate(['/goals', savedGoal.id]);
        },
        error: () => {
          this.saveError = 'Could not save goal.';
        }
      });
      return;
    }

    this.goalCreateWorkflowService.createGoal(this.draft, this.navState?.inboxItemId).pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: savedGoal => {
        this.goalDraft.replace(savedGoal);
        this.router.navigate(['/goals', savedGoal.id]);
      },
      error: () => {
        this.saveError = 'Could not create goal.';
      }
    });
  }

  public revertChanges(): void {
    if (this.isSaving || this.isNewGoal) {
      return;
    }

    this.goalDraft.revert();
    this.saveError = null;
  }

  public updateTitle(title: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      title
    }));
  }

  public updateStatus(status: Goal['status']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      status
    }));
  }

  public updateWhyItMatters(whyItMatters: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      whyItMatters
    }));
  }

  public updateLane(lane: Goal['lane']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      lane
    }));
  }

  public updateType(type: Goal['type']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      type
    }));
  }

  public updateMinimumTouchFrequency(minimumTouchFrequency: Goal['minimumTouchFrequency']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      minimumTouchFrequency
    }));
  }

  public updateDueStyle(dueStyle: Goal['dueStyle']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      dueStyle
    }));
  }

  public updateRealDeadline(realDeadline: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      realDeadline
    }));
  }

  public updateTargetDate(targetDate: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      targetDate
    }));
  }

  public updateCurrentMilestone(currentMilestone: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      currentMilestone
    }));
  }

  public updateNextTinyAction(nextTinyAction: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      nextTinyAction
    }));
  }

  public updateTypicalSessionSize(typicalSessionSize: Goal['typicalSessionSize']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      typicalSessionSize
    }));
  }

  public updateEnergy(energy: Goal['energy']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      energy
    }));
  }

  public updateResistance(resistance: Goal['resistance']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      resistance
    }));
  }

  public updateExcitement(excitement: Goal['excitement']): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      excitement
    }));
  }

  public updateNotes(notes: string): void {
    this.goalDraft.patch(goal => ({
      ...goal,
      notes
    }));
  }

  private get navState(): {
  inboxItemId?: string;
  prefillGoalTitle?: string;
} | undefined {
  return this.location.getState() as {
    inboxItemId?: string;
    prefillGoalTitle?: string;
  } | undefined;
}

  private buildInitialGoal(goal: Goal): Goal {
    const initializedGoal: Goal = this.cloneGoal(goal);

    if (!initializedGoal.status) initializedGoal.status = 'active';
    if (!initializedGoal.type) initializedGoal.type = 'project';
    if (!initializedGoal.dueStyle) initializedGoal.dueStyle = 'cadence_only';
    if (!initializedGoal.minimumTouchFrequency) initializedGoal.minimumTouchFrequency = 'weekly';

    if (!initializedGoal.id && this.navState?.prefillGoalTitle && !initializedGoal.title) {
      initializedGoal.title = this.navState.prefillGoalTitle;
    }

    return initializedGoal;
  }

  private cloneGoal(goal: Goal): Goal {
    return {
      ...goal
    };
  }

  private areGoalsEqual(a: Goal, b: Goal): boolean {
    return (
      (a.title ?? '') === (b.title ?? '') &&
      a.status === b.status &&
      (a.whyItMatters ?? '') === (b.whyItMatters ?? '') &&
      a.lane === b.lane &&
      a.type === b.type &&
      a.minimumTouchFrequency === b.minimumTouchFrequency &&
      a.dueStyle === b.dueStyle &&
      (a.realDeadline ?? '') === (b.realDeadline ?? '') &&
      (a.targetDate ?? '') === (b.targetDate ?? '') &&
      (a.currentMilestone ?? '') === (b.currentMilestone ?? '') &&
      (a.nextTinyAction ?? '') === (b.nextTinyAction ?? '') &&
      (a.typicalSessionSize ?? '') === (b.typicalSessionSize ?? '') &&
      (a.energy ?? '') === (b.energy ?? '') &&
      (a.resistance ?? '') === (b.resistance ?? '') &&
      (a.excitement ?? '') === (b.excitement ?? '') &&
      (a.notes ?? '') === (b.notes ?? '')
    );
  }
}