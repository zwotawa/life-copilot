import { TestBed } from '@angular/core/testing';

import { InboxStoreService } from './inbox-store.service';

describe('InboxStoreService', () => {
  let service: InboxStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InboxStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
