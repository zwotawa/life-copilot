import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclutterComponent } from './declutter.component';

describe('DeclutterComponent', () => {
  let component: DeclutterComponent;
  let fixture: ComponentFixture<DeclutterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeclutterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeclutterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
