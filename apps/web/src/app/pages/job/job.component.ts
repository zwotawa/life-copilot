import { Component, OnInit, OnDestroy } from '@angular/core';
import { CreateJobCardRequest, JobCard, JobStage, UpdateJobCardRequest } from 'src/app/core/job-pipeline.model';
import { CardMovement, NextTouchUpdate } from './job-card/job-card.component';
import { JobService } from './job.service';
import { Subscription } from 'rxjs';

interface Stage {
  stageName: JobStage,
  stageCards: JobCard[]
}

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit, OnDestroy {

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
  public showAdd: boolean = false;
  private subscriptions: Subscription[] = [];
  public newJob: CreateJobCardRequest = {
  company: '',
  role: '',
  stage: 'toApply',
  link: null,
  nextAction: null,
  nextTouchAt: null
};
private refreshSub?: Subscription;

  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.refresh();
  }

  public addJob(): void {
  const req = {
    ...this.newJob,
    company: this.newJob.company.trim(),
    role: this.newJob.role.trim(),
    link: this.newJob.link?.trim() || null
  };

  this.jobService.addJob(req).subscribe({
    next: () => {
      this.showAdd = false;
      this.resetAdd();
      this.refresh(); // or re-fetch jobs
    },
    error: (e) => {
      this.error = 'Failed to add job';
      console.error(e)
    }
  });
}

  public resetAdd(): void {
  this.newJob = { company:'', role:'', stage:'toApply', link:null, nextAction:null, nextTouchAt:null };
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
      error: (err) => { 
        this.error = 'Failed to update job';
        console.error(err) }
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
      error: (err) => { 
        this.error = 'Failed to update job';
        console.error(err) }
    }));
  }

  private refresh(): void {
    this.isLoading = true;
    this.error = null;

    this.refreshSub?.unsubscribe();
    this.refreshSub = this.jobService.getJobs().subscribe({
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
    });
  }

  private stageCards(stage: JobStage): JobCard[] {
    const cards = this.jobCards.filter(c => c.stage === stage);

    if (stage === 'followUp') {
      return cards.sort((a, b) => {
        const aHas = a.nextTouchAt != null;
        const bHas = b.nextTouchAt != null;

        // Cards with a nextTouchAt come first
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;

        // If both have nextTouchAt, earlier date first (due soonest)
        if (aHas && bHas) return (a.nextTouchAt! - b.nextTouchAt!);

        // Otherwise, fall back to lastTouchedAt desc
        return b.lastTouchedAt - a.lastTouchedAt;
      });
    }

    // other stages: last touched desc
    return cards.sort((a, b) => b.lastTouchedAt - a.lastTouchedAt);
  }
    

  private populateStageCards(): void {
    this.stages.forEach(stage => {
      stage.stageCards = this.stageCards(stage.stageName);
    });
  }

  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
    this.refreshSub?.unsubscribe();
  }

}
