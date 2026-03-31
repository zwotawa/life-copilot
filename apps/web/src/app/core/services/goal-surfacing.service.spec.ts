import { TestBed } from '@angular/core/testing';

import { GoalSurfacingService } from './goal-surfacing.service';

describe('GoalSurfacingService', () => {
  let service: GoalSurfacingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoalSurfacingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
