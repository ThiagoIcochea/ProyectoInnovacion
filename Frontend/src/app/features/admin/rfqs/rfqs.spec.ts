import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rfqs } from './rfqs';

describe('Rfqs', () => {
  let component: Rfqs;
  let fixture: ComponentFixture<Rfqs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rfqs],
    }).compileComponents();

    fixture = TestBed.createComponent(Rfqs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
