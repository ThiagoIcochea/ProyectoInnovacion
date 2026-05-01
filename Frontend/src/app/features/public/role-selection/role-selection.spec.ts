import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleSelection } from './role-selection';

describe('RoleSelection', () => {
  let component: RoleSelection;
  let fixture: ComponentFixture<RoleSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelection],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
