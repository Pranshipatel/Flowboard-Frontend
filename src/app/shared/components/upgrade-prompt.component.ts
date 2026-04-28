import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upgrade-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="upgrade-dialog-container">
      <button mat-icon-button class="close-btn" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
      <div class="upgrade-content">
        <div class="premium-icon">
          <mat-icon>workspace_premium</mat-icon>
        </div>
        <h2>Upgrade to Premium</h2>
        <p>Unlock unlimited boards, lists, cards, and advanced notifications to supercharge your workflow.</p>
        <ul class="premium-features">
          <li><mat-icon>check_circle</mat-icon> Unlimited Boards & Workspaces</li>
          <li><mat-icon>check_circle</mat-icon> Unlimited Lists & Cards</li>
          <li><mat-icon>check_circle</mat-icon> Real-time Notifications</li>
          <li><mat-icon>check_circle</mat-icon> Advanced Analytics</li>
        </ul>
        <button mat-flat-button class="upgrade-action-btn" (click)="goToUpgrade()">Upgrade Now</button>
      </div>
    </div>
  `,
  styles: [`
    .upgrade-dialog-container {
      position: relative;
      padding: 32px 24px;
      text-align: center;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
    }
    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      color: #94A3B8;
    }
    .upgrade-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .premium-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #EEF2FF;
      color: #4F46E5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .premium-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 8px;
    }
    p {
      color: #64748B;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .premium-features {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
      text-align: left;
      width: 100%;
    }
    .premium-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #334155;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .premium-features li mat-icon {
      color: #10B981;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .upgrade-action-btn {
      background: #4F46E5 !important;
      color: #fff !important;
      border-radius: 999px !important;
      padding: 8px 32px !important;
      font-size: 16px;
      font-weight: 600;
      width: 100%;
    }
  `]
})
export class UpgradePromptComponent {
  private dialogRef = inject(MatDialogRef<UpgradePromptComponent>);
  private router = inject(Router);

  close() {
    this.dialogRef.close();
  }

  goToUpgrade() {
    this.dialogRef.close();
    this.router.navigate(['/upgrade']);
  }
}
