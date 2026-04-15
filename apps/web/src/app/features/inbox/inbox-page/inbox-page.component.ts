import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith } from 'rxjs/operators';

import { InboxEntry, InboxEntryStatus } from 'src/app/core/models/inbox-entry.model';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

interface Loadable<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

interface InboxViewModel {
  entriesState: Loadable<InboxEntry[]>;
  entries: InboxEntry[];
  filteredEntries: InboxEntry[];

  newCount: number;
  clarifiedCount: number;
  deferredCount: number;
  archivedCount: number;

  pageLoading: boolean;
  pageErrorMessages: string[];
}

@Component({
  selector: 'app-inbox-page',
  templateUrl: './inbox-page.component.html',
  styleUrls: ['./inbox-page.component.scss']
})
export class InboxPageComponent {
  public newEntryText = '';
  public selectedStatusFilter: 'all' | InboxEntryStatus = 'all';

  public isAdding = false;
  public addError: string | null = null;

  public updatingEntryIds = new Set<string>();
  public updateError: string | null = null;

  public deletingEntryIds = new Set<string>();
  public deleteError: string | null = null;

  private readonly entriesSubject = new BehaviorSubject<InboxEntry[]>([]);
  public readonly entries$ = this.entriesSubject.asObservable();

  private readonly initialEntriesState$: Observable<Loadable<InboxEntry[]>> =
    this.inboxService.getEntries().pipe(
      map(entries => ({
        loading: false,
        data: entries,
        error: null
      })),
      startWith({
        loading: true,
        data: null,
        error: null
      }),
      catchError(() =>
        of({
          loading: false,
          data: null,
          error: 'Could not load inbox entries.'
        })
      ),
      shareReplay(1)
    );

  public readonly vm$: Observable<InboxViewModel> = combineLatest([
    this.initialEntriesState$,
    this.entries$
  ]).pipe(
    map(([entriesState, currentEntries]) => {
      const entries =
        currentEntries.length > 0 || entriesState.data === null
          ? currentEntries
          : (entriesState.data ?? []);

      const filteredEntries =
        this.selectedStatusFilter === 'all'
          ? entries
          : entries.filter(entry => entry.status === this.selectedStatusFilter);

      const pageErrorMessages = [
        entriesState.error,
        this.addError,
        this.updateError,
        this.deleteError
      ].filter((message): message is string => !!message);

      return {
        entriesState,
        entries,
        filteredEntries,

        newCount: entries.filter(entry => entry.status === 'new').length,
        clarifiedCount: entries.filter(entry => entry.status === 'clarified').length,
        deferredCount: entries.filter(entry => entry.status === 'deferred').length,
        archivedCount: entries.filter(entry => entry.status === 'archived').length,

        pageLoading: entriesState.loading,
        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly inboxService: InboxStoreService,
    private readonly router: Router,
    private notificationService: NotificationService
  ) {
    this.loadInitialEntries();
  }

  public addEntry(): void {
    const text = this.newEntryText.trim();

    if (!text || this.isAdding) {
      return;
    }

    this.isAdding = true;
    this.addError = null;

    this.inboxService.addEntry(text).pipe(
      finalize(() => {
        this.isAdding = false;
      })
    ).subscribe({
      next: () => {
        this.newEntryText = '';
        this.reloadEntries();
        this.notificationService.success('Inbox item added.');
      },
      error: () => {
        this.addError = 'Could not add inbox entry.';
      }
    });
  }

  public updateStatus(entry: InboxEntry, status: InboxEntryStatus): void {
    if (this.updatingEntryIds.has(entry.id) || this.isEntryBusy(entry.id)) {
      return;
    }

    this.updateError = null;
    this.updatingEntryIds.add(entry.id);

    this.inboxService.updateStatus(entry.id, status).pipe(
      finalize(() => {
        this.updatingEntryIds.delete(entry.id);
      })
    ).subscribe({
      next: () => {
        this.reloadEntries();
        this.notificationService.success(`Moved to ${this.getStatusLabel(status)}.`);
      },
      error: () => {
        this.updateError = 'Could not update inbox item status.';
      }
    });
  }

  public deleteEntry(entry: InboxEntry): void {
    if (this.deletingEntryIds.has(entry.id) || this.isEntryBusy(entry.id)) {
      return;
    }

    this.deleteError = null;
    this.deletingEntryIds.add(entry.id);

    this.inboxService.deleteEntry(entry.id).pipe(
      finalize(() => {
        this.deletingEntryIds.delete(entry.id);
      })
    ).subscribe({
      next: () => {
        this.reloadEntries();
        this.notificationService.success('Inbox item deleted.');
      },
      error: () => {
        this.deleteError = 'Could not delete inbox entry.';
      }
    });
  }

  public isEntryBusy(entryId: string): boolean {
    return this.updatingEntryIds.has(entryId) || this.deletingEntryIds.has(entryId);
  }

  public trackByEntryId(index: number, entry: InboxEntry): string {
    return entry.id;
  }

  public getStatusLabel(status: InboxEntryStatus): string {
    switch (status) {
      case 'new':
        return 'New';
      case 'clarified':
        return 'Clarified';
      case 'deferred':
        return 'Deferred';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  }

  public convertToGoal(item: InboxEntry): void {
    this.router.navigate(['/goals/new'], {
      state: {
        inboxItemId: item.id,
        prefillGoalTitle: item.text
      }
    });
  }

  private loadInitialEntries(): void {
    this.initialEntriesState$.subscribe({
      next: state => {
        if (state.data) {
          this.entriesSubject.next(state.data);
        }
      }
    });
  }

  private reloadEntries(): void {
    this.inboxService.getEntries().subscribe({
      next: entries => {
        this.entriesSubject.next(entries);
      },
      error: () => {
        this.updateError = this.updateError ?? 'Could not refresh inbox entries.';
      }
    });
  }
}