import { DailyRotationItem } from "../models/daily-rotation.model";

export abstract class DailyRotationRepository {
    abstract saveRotationForDate(date: string, item: DailyRotationItem[]): void;
    abstract getRotationForDate(date: string): DailyRotationItem[];
    abstract clearRotationForDate(date: string): void;
}