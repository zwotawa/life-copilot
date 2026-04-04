import { TestBed } from '@angular/core/testing';

import { DailyCompletionHistoryStoreService } from './daily-completion-history-store.service';

describe('DailyCompletionHistoryStoreService', () => {
  let service: DailyCompletionHistoryStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyCompletionHistoryStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
