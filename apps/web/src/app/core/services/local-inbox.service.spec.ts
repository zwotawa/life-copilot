import { TestBed } from '@angular/core/testing';

import { LocalInboxService } from './local-inbox.service';

describe('InboxService', () => {
  let service: LocalInboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalInboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
