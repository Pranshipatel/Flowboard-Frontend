import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveManagerComponent } from './archive-manager.component';

describe('ArchiveManagerComponent', () => {
  let component: ArchiveManagerComponent;
  let fixture: ComponentFixture<ArchiveManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveManagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveManagerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
