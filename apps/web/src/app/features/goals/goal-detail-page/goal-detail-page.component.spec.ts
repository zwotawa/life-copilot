import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalDetailPageComponent } from './goal-detail-page.component';

describe('GoalDetailPageComponent', () => {
  let component: GoalDetailPageComponent;
  let fixture: ComponentFixture<GoalDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoalDetailPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
