import { Injectable } from "@angular/core";
import { DailyRotationRepository } from "../repositories/daily-rotation.repository";
import { LocalStorageService } from "./local-storage.service";
import { StorageKeyService } from "./storage-key.service";
import { DailyRotationItem } from "../models/daily-rotation.model";

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

    public saveRotationItems(items: DailyRotationItem[]): void {
        this.localStorageService.setItem(this.storageKey, JSON.stringify(items));
    }

    public loadRotationItems(): DailyRotationItem[] {
        this.migrateLegacyIfNeeded();
        const data = this.localStorageService.getItem(this.storageKey);
        if (!data) {
        return [];
        }
        try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
        } catch {
        return [];
        }
    }

    public clearRotationItems(): void {
        
    }
}