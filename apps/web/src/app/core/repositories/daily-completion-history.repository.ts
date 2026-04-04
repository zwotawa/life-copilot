import { DailyRotationItem } from "../models/daily-rotation.model";

export abstract class DailyCompletionHistoryRepository {
    abstract saveTodayCompletionSummary(rotationItems: DailyRotationItem[]): void;
}