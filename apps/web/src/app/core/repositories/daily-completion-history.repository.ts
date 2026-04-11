import { Observable } from "rxjs";
import { DailyCompletionSummary } from "../models/daily-completion.model";

export abstract class DailyCompletionHistoryRepository {
    abstract saveSummary(dailyCompletionSummary: DailyCompletionSummary): Observable<void>;
    abstract getSummaries(): Observable<DailyCompletionSummary[]>;
}