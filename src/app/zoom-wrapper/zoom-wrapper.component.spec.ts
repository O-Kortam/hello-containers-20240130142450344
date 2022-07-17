import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomWrapperComponent } from './zoom-wrapper.component';

describe('ZoomWrapperComponent', () => {
  let component: ZoomWrapperComponent;
  let fixture: ComponentFixture<ZoomWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZoomWrapperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
