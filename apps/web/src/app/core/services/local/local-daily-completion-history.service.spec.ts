import { TestBed } from '@angular/core/testing';

import { LocalDailyCompletionHistoryService } from './local-daily-completion-history.service';

describe('LocalDailyCompletionHistoryService', () => {
  let service: LocalDailyCompletionHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalDailyCompletionHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
