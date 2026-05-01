import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqResults } from './rfq-results';

describe('RfqResults', () => {
  let component: RfqResults;
  let fixture: ComponentFixture<RfqResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfqResults],
    }).compileComponents();

    fixture = TestBed.createComponent(RfqResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
