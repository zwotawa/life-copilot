import { TestBed } from '@angular/core/testing';

import { GoalFreshnessService } from './goal-freshness.service';

describe('GoalFreshnessService', () => {
  let service: GoalFreshnessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoalFreshnessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
