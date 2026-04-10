import { HttpClient } from "@angular/common/http";
import { InboxRepository } from "../repositories/inbox.repository";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { InboxEntry, InboxEntryStatus } from "../models/inbox-entry.model";
import { ApiInboxEntry } from "../models/api/api-inbox-entry.model";
import { fromApiInboxEntry } from "../mappers/inbox-api.mappers";

@Injectable()
export class ApiInboxRepository extends InboxRepository {
    private readonly apiBaseUrl = "/api/inbox";

    constructor(private readonly http: HttpClient) {
        super();
    }

    public getEntries(): Observable<InboxEntry[]> {
        return this.http.get<ApiInboxEntry[]>(this.apiBaseUrl).pipe(
            map(inboxEntries => inboxEntries.map(fromApiInboxEntry))
        )
    }

    public addEntry(text: string): Observable<InboxEntry> {
        return this.http.post<ApiInboxEntry>(this.apiBaseUrl, { "text": text }).pipe(
            map(entry => fromApiInboxEntry(entry))
        );
    }

    public updateEntry(updateEntry: InboxEntry): Observable<InboxEntry> {
        return this.http.post<ApiInboxEntry>(`${this.apiBaseUrl}/${updateEntry.id}`, updateEntry).pipe(
            map(entry => fromApiInboxEntry(entry))
        );
    }

    public updateStatus(entryId: string, status: InboxEntryStatus): Observable<InboxEntry | undefined> {
        return this.http.patch<ApiInboxEntry>(`${this.apiBaseUrl}/${entryId}/status`, { "status" : status }).pipe(
            map(entry => fromApiInboxEntry(entry))
        );
    }

    public deleteEntry(entryId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiBaseUrl}/${entryId}`);
    }

    public markAsConverted(inboxEntryId: string, goalId: string): Observable<InboxEntry | undefined> {
        return this.http.patch<ApiInboxEntry>(`${this.apiBaseUrl}/${inboxEntryId}/convert`, { "goalId" : goalId }).pipe(
            map(entry => fromApiInboxEntry(entry))
        );
    }
}