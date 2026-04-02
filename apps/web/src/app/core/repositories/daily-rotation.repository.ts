import { DailyRotationItem } from "../models/daily-rotation.model";

export abstract class DailyRotationRepository {
    abstract saveRotationItems(item: DailyRotationItem[]): void;
    abstract loadRotationItems(): DailyRotationItem[];
    abstract clearRotationItems(): void;
}