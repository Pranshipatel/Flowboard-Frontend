import { Injectable, signal, computed, inject } from '@angular/core';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private tokens = inject(TokenStorageService);

  private tokenSig = signal<string | null>(this.tokens.getToken());

  readonly token = computed(() => this.tokenSig());
  readonly isLoggedIn = computed(() => !!this.tokenSig());

  setToken(token: string) {
    this.tokens.setToken(token);
    this.tokenSig.set(token);
  }

  logout() {
    this.tokens.clear();
    this.tokenSig.set(null);
  }
}