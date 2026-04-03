import { TestBed } from '@angular/core/testing';

import { PlanningWorkflowService } from './planning-workflow.service';

describe('PlanningWorkflowService', () => {
  let service: PlanningWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanningWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
