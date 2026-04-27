import { Injectable } from "@angular/core";
import { DailyRotationRepository } from "../../repositories/daily-rotation.repository";
import { LocalStorageService } from "./local-storage.service";
import { StorageKeyService } from "./storage-key.service";
import { DailyRotationItem } from "../../models/daily-rotation.model";
import { Observable, of } from "rxjs";
import { get } from "http";
import { getLocalDateKey } from "src/app/shared/utility/get-today-key";

type DailyRotationMap = Record<string, DailyRotationItem[]>;

@Injectable()
export class LocalDailyRotationRepository extends DailyRotationRepository {
    constructor(
        private readonly localStorageService: LocalStorageService,
        private readonly storageKeyService: StorageKeyService
    ) {
        super();
    }

    private get storageKey(): string {
        return this.storageKeyService.forCurrentUser('dailyRotation');
    }

    private migrateLegacyIfNeeded(): void {
        const newKey = this.storageKeyService.forCurrentUser('dailyRotation');
        const legacyKey = this.storageKeyService.legacy('dailyRotation');

        const hasNewValue = this.localStorageService.getItem(newKey);
        if (hasNewValue) {
            return;
        }

        const legacyValue = this.localStorageService.getItem(legacyKey);
        if (!legacyValue) {
            return;
        }

        this.localStorageService.setItem(newKey, legacyValue);
    }

    public saveRotationForDate(date: string, items: DailyRotationItem[]): Observable<DailyRotationItem[]> {
        const map = this.readRotationMap();
        map[date] = items;
        this.saveRotationMap(map);
        return of(items);
    }

    public getRotationForDate(date: string): Observable<DailyRotationItem[]> {
        const map = this.readRotationMap();
        const items = map[date];
        return of(Array.isArray(items) ? items : []);
    }

    public clearRotationForDate(date: string): Observable<void> {
        const map = this.readRotationMap();
        delete map[date];
        this.saveRotationMap(map);
        return of(void 0);
    }

    private readRotationMap(): DailyRotationMap {
        this.migrateLegacyIfNeeded();

        const data = this.localStorageService.getItem(this.storageKey);
        if(!data) {
            return {};
        }

        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                const firstDate =
                    parsed.length > 0 && typeof parsed[0]?.date === 'string'
                    ? parsed[0].date
                    : getLocalDateKey();

                    return { [firstDate]: parsed };
           }
           return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }

    private saveRotationMap(map: DailyRotationMap): void {
        this.localStorageService.setItem(this.storageKey, JSON.stringify(map));
    }
}