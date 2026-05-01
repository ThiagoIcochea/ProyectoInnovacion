import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RfqPayment } from './rfq-payment';

describe('RfqPayment', () => {
  let component: RfqPayment;
  let fixture: ComponentFixture<RfqPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RfqPayment],
    }).compileComponents();

    fixture = TestBed.createComponent(RfqPayment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
