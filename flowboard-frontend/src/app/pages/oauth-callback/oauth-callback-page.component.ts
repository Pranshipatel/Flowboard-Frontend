import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  standalone: true,
  selector: 'app-oauth-callback-page',
  template: `
    <div style="padding:24px;font-family:system-ui">
      Signing you in...
    </div>
  `,
})
export class OauthCallbackPageComponent {
  constructor(route: ActivatedRoute, auth: AuthStateService, router: Router) {
    const token = route.snapshot.queryParamMap.get('token');
    if (token) {
      auth.setToken(token);
      router.navigateByUrl('/profile');
    } else {
      router.navigateByUrl('/login');
    }
  }
}