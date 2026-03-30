import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyReviewPageComponent } from './weekly-review-page.component';

describe('WeeklyReviewPageComponent', () => {
  let component: WeeklyReviewPageComponent;
  let fixture: ComponentFixture<WeeklyReviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeeklyReviewPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeeklyReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
