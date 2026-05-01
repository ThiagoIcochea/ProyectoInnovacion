import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestEvaluation } from './request-evaluation';

describe('RequestEvaluation', () => {
  let component: RequestEvaluation;
  let fixture: ComponentFixture<RequestEvaluation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestEvaluation],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestEvaluation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
