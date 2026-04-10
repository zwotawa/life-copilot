import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InboxEntry, InboxEntryStatus } from 'src/app/core/models/inbox-entry.model';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';

@Component({
  selector: 'app-inbox-page',
  templateUrl: './inbox-page.component.html',
  styleUrls: ['./inbox-page.component.scss']
})
export class InboxPageComponent implements OnInit {
  public entries: InboxEntry[] = [];
  public newEntryText = '';
  public selectedStatusFilter: 'all' | InboxEntryStatus = 'all';

  constructor(
    private inboxService: InboxStoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  public loadEntries(): void {
    this.inboxService.getEntries().subscribe({
      next: entries => this.entries = entries
    });
  }

  public addEntry(): void {
    this.inboxService.addEntry(this.newEntryText).subscribe({
      next: () => {
        this.newEntryText = '';
        this.loadEntries();
      }
    });
    
    
  }

  public updateStatus(entry: InboxEntry, status: InboxEntryStatus): void {
    this.inboxService.updateStatus(entry.id, status).subscribe({
      next: () => this.loadEntries()
    });

  }

  public deleteEntry(entry: InboxEntry): void {
    this.inboxService.deleteEntry(entry.id).subscribe({
      next: () => this.loadEntries()

    });
  }

  public get filteredEntries(): InboxEntry[] {
    if (this.selectedStatusFilter === 'all') {
      return this.entries;
    }

    return this.entries
    .filter(entry => entry.status === this.selectedStatusFilter);
  }

  public get newCount(): number {
    return this.entries.filter(entry => entry.status === 'new').length;
  }

  public get clarifiedCount(): number {
    return this.entries.filter(entry => entry.status === 'clarified').length;
  }

  public get deferredCount(): number {
    return this.entries.filter(entry => entry.status === 'deferred').length;
  }

  public get archivedCount(): number {
    return this.entries.filter(entry => entry.status === 'archived').length;
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
}