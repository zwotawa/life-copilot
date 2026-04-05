import { DailyCompletionSummary } from "../models/daily-completion.model";

export abstract class DailyCompletionHistoryRepository {
    abstract saveSummary(dailyCompletionSummary: DailyCompletionSummary): void;
    abstract getSummaries(): DailyCompletionSummary[];
}