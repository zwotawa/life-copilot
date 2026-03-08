import { Component, OnInit } from '@angular/core';
import { JobCard, JobStage } from 'src/app/core/job-pipeline.model';
import { loadJobCards, updateJobCard } from 'src/app/core/job-pipeline.storage';
import { CardMovement } from './job-card/job-card.component';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit {

  public stages: JobStage[] = ['toApply', 'applied', 'followUp', 'interview'];
  public jobCards: JobCard[] = <JobCard[]>[];

  constructor() { }

  ngOnInit(): void {
    this.jobCards = loadJobCards();
  }

  public moveCard(cardMovement: CardMovement): void {
    const currentStage: number = this.stages.findIndex((stage) => cardMovement.card.stage == stage);
    let newStage: number = -1;
    if(cardMovement.moveDirection == 'back') {
      newStage = currentStage - 1;
    }
    if(cardMovement.moveDirection == 'forward') {
      newStage = currentStage + 1;
    }

    const updatedCard: JobCard = JSON.parse(JSON.stringify(cardMovement.card));
    updatedCard.stage = this.stages[newStage];

    updateJobCard(updatedCard);
  }

  public stageCards(stage: JobStage): JobCard[] {
    return this.jobCards.filter(card => card.stage == stage);
  }

}
