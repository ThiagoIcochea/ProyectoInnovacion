import { ComponentFixture, TestBed } from '@angular/core/testing';
import { componentTestProviders } from '../../../testing/component-test.providers';

import { RegisterProviderComponent as RegisterProvider } from './register-provider';

describe('RegisterProvider', () => {
  let component: RegisterProvider;
  let fixture: ComponentFixture<RegisterProvider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterProvider],
      providers: componentTestProviders
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterProvider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
