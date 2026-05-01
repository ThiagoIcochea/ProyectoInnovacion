import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiSettings } from './api-settings';

describe('ApiSettings', () => {
  let component: ApiSettings;
  let fixture: ComponentFixture<ApiSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiSettings],
    }).compileComponents();

    fixture = TestBed.createComponent(ApiSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
