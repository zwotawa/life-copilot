import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyRotationPageComponent } from './daily-rotation-page.component';

describe('DailyRotationPageComponent', () => {
  let component: DailyRotationPageComponent;
  let fixture: ComponentFixture<DailyRotationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyRotationPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyRotationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
