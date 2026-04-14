import { BehaviorSubject } from 'rxjs';

export class EditableDraft<T> {
  private readonly subject = new BehaviorSubject<T | null>(null);
  private lastSavedValue: T | null = null;

  constructor(
    private readonly cloneFn: (value: T) => T,
    private readonly equalsFn: (a: T, b: T) => boolean
  ) {}

  public readonly value$ = this.subject.asObservable();

  public get value(): T | null {
    return this.subject.value;
  }

  public initialize(value: T): void {
    const cloned = this.cloneFn(value);
    this.lastSavedValue = this.cloneFn(cloned);
    this.subject.next(cloned);
  }

  public replace(value: T): void {
    const cloned = this.cloneFn(value);
    this.lastSavedValue = this.cloneFn(cloned);
    this.subject.next(cloned);
  }

  public patch(updater: (current: T) => T): void {
    const current = this.subject.value;
    if (!current) {
      return;
    }

    this.subject.next(updater(current));
  }

  public revert(): void {
    if (!this.lastSavedValue) {
      return;
    }

    this.subject.next(this.cloneFn(this.lastSavedValue));
  }

  public get hasUnsavedChanges(): boolean {
    const current = this.subject.value;
    if (!current || !this.lastSavedValue) {
      return false;
    }

    return !this.equalsFn(current, this.lastSavedValue);
  }
}