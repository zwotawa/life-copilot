import { TestBed } from '@angular/core/testing';

import { GoalCreationWorkflowService } from './goal-creation-workflow.service';

describe('GoalCreationWorkflowService', () => {
  let service: GoalCreationWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoalCreationWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
