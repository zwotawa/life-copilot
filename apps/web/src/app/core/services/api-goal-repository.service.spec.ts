import { TestBed } from '@angular/core/testing';

import { ApiGoalRepositoryService } from './api-goal-repository.service';

describe('ApiGoalRepositoryService', () => {
  let service: ApiGoalRepositoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiGoalRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
