import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceDetailComponent } from './workspace-detail.component';

describe('WorkspaceDetailComponent', () => {
  let component: WorkspaceDetailComponent;
  let fixture: ComponentFixture<WorkspaceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
