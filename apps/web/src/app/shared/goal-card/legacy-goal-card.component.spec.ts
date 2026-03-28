import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegacyGoalCardComponent } from './legacy-goal-card.component';

describe('GoalCardComponent', () => {
  let component: LegacyGoalCardComponent;
  let fixture: ComponentFixture<LegacyGoalCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LegacyGoalCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LegacyGoalCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
