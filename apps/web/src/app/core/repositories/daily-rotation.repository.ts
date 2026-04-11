import { Observable } from "rxjs";
import { DailyRotationItem } from "../models/daily-rotation.model";

export abstract class DailyRotationRepository {
    abstract saveRotationForDate(date: string, item: DailyRotationItem[]): Observable<DailyRotationItem[]>;
    abstract getRotationForDate(date: string): Observable<DailyRotationItem[]>;
    abstract clearRotationForDate(date: string): Observable<void>;
}