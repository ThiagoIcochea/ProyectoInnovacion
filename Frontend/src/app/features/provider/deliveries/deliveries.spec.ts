import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { ProviderDeliveriesComponent as Deliveries } from './deliveries';

describe('Deliveries', () => {
  let component: Deliveries;
  let fixture: ComponentFixture<Deliveries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deliveries],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(Deliveries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
