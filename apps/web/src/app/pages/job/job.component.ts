import { Component, OnInit, OnDestroy } from '@angular/core';
import { JobCard, JobStage, UpdateJobCardRequest } from 'src/app/core/job-pipeline.model';
import { loadJobCards, saveJobCards, updateJobCard } from 'src/app/core/job-pipeline.storage';
import { CardMovement, NextTouchUpdate } from './job-card/job-card.component';
import { JobService } from './job.service';
import { Observable, Subscription } from 'rxjs';

interface Stage {
  stageName: JobStage,
  stageCards: JobCard[]
}

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit {

  public stages: Stage[] = [{
      stageName:'toApply',
      stageCards: []
    },
    {
      stageName: 'applied',
      stageCards: [] 
    },
    {
      stageName: 'followUp',
      stageCards: []
    },
    {
      stageName: 'interview',
      stageCards: []
    }];
  public jobCards: JobCard[] = <JobCard[]>[];
  public isLoading: boolean = false;
  public error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.refresh();
  }

  public moveCard(cardMovement: CardMovement): void {
    const card: JobCard = cardMovement.card;
    const currentStage: number = this.stages.findIndex((stage) => cardMovement.card.stage == stage.stageName);
    let newStage: number = -1;
    if(cardMovement.moveDirection == 'back') {
      newStage = currentStage - 1;
    }
    if(cardMovement.moveDirection == 'forward') {
      newStage = currentStage + 1;
    }

    const req: UpdateJobCardRequest = {
      company: card.company,
      role: card.role,
      stage: this.stages[newStage].stageName,
      link: card?.link ?? null,
      nextAction: card?.nextAction ?? null,
      nextTouchAt: card?.nextTouchAt ?? null
    }

    this.subscriptions.push(this.jobService.updateJob(card.id, req).subscribe({
      next: () => { this.refresh() },
      error: (err) => { console.error(err) }
    }));
  }

  public setNextTouch(nextTouchUpdate: NextTouchUpdate): void {
    const card: JobCard = nextTouchUpdate.card;
    const nextTouchAt = Date.now() + nextTouchUpdate.daysFromNow * 24 * 60 * 60 * 1000;

    const req: UpdateJobCardRequest = {
      company: card.company,
      role: card.role,
      stage: card.stage,
      link: card?.link ?? null,
      nextAction: card?.nextAction ?? null,
      nextTouchAt
    }

    this.subscriptions.push(this.jobService.updateJob(card.id, req).subscribe({
      next: () => { this.refresh() },
      error: (err) => { console.error(err) }
    }));
  }

  private refresh(): void {
    this.isLoading = true;
    this.error = null;

    this.subscriptions?.push(this.jobService.getJobs().subscribe({
      next: (cards) => {
        this.jobCards = cards;
        this.isLoading = false;
        this.populateStageCards();
      },
      error: (err) => {
        this.error = 'Failed to load jobs';
        this.isLoading = false;
        console.error(err);
      }
    }));
  }

  private stageCards(stage: JobStage): JobCard[] {
    return this.jobCards.filter(card => card.stage == stage).sort((a, b) => {
      let dateA: number;
      let dateB: number;
      if(stage == 'followUp' && a.nextTouchAt && b.nextTouchAt) {
        dateA = new Date(a.nextTouchAt).getTime();
        dateB = new Date(b.nextTouchAt).getTime();

        return dateA - dateB; // Ascending order for follow-ups based on next touch date
      } else {
        dateA = new Date(a.lastTouchedAt).getTime();
        dateB = new Date(b.lastTouchedAt).getTime();
      }

      return dateB - dateA;
    });
  }

  private populateStageCards(): void {
    this.stages.forEach(stage => {
      stage.stageCards = this.stageCards(stage.stageName);
    });
  }

  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}
