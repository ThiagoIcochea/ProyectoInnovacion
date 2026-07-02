import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

type MfaMethod = 'email' | 'sms' | 'whatsapp' | 'call';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mfa.html',
  styleUrl: './mfa.scss'
})
export class MfaComponent implements OnInit, OnDestroy {

  digits = ['', '', '', '', '', ''];
  method: MfaMethod = 'email';
  loading = false;
  errorMessage = '';
  resendSeconds = 30;
  expiresSeconds = 300;
  private timer: ReturnType<typeof setInterval> | null = null;
  flow: any = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const raw = sessionStorage.getItem('pending_mfa_flow');
    this.flow = raw ? JSON.parse(raw) : null;

    if (!this.flow?.email || !this.flow?.tempToken) {
      this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
      return;
    }

    if (this.flow.emailOnly) {
      this.method = 'email';
    }

    this.hydrateTimers();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  updateDigit(index: number, value: string): void {
    const clean = value.replace(/\D/g, '');

    if (clean.length > 1) {
      this.fillDigits(clean, index);
      return;
    }

    const digit = clean.slice(-1);
    this.digits[index] = digit;

    if (digit && index < 5) {
      const next = document.querySelector<HTMLInputElement>(`#mfa-digit-${index + 1}`);
      next?.focus();
    }

    if (this.digits.every(Boolean)) {
      this.verify();
    }
  }

  handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.key !== 'Backspace') {
      return;
    }

    if (!this.digits[index] && index > 0) {
      event.preventDefault();
      this.digits[index - 1] = '';
      this.focusDigit(index - 1);
    }
  }

  pasteCode(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/\D/g, '');

    if (!clean) {
      return;
    }

    event.preventDefault();
    this.fillDigits(clean, 0);
  }

  resend(): void {
    if (this.resendSeconds > 0 || this.loading) {
      return;
    }

    this.http.post(`${APP_API_BASE_URL}/auth/mfa/resend`, {
      email: this.flow.email,
      tempToken: this.flow.tempToken,
      method: this.method
    }).subscribe({
      next: () => {
        this.errorMessage = '';
        this.setResendCountdown(60);
        this.startTimer();
      },
      error: err => this.errorMessage = err?.error?.message || 'No se pudo reenviar el codigo.'
    });
  }

  verify(): void {
    if (this.loading) {
      return;
    }

    const code = this.digits.join('');

    if (code.length !== 6) {
      this.errorMessage = 'Ingresa los 6 digitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email: this.flow.email,
      tempToken: this.flow.tempToken,
      method: this.method,
      purpose: this.flow.purpose,
      code
    }).subscribe({
      next: res => {
        sessionStorage.removeItem('pending_mfa_flow');
        const login = res?.login;

        if (login?.token) {
          localStorage.setItem(APP_STORAGE_KEYS.token, login.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, this.normalizeRole(login.rol));
          localStorage.setItem('auth_user_email', login.correo || this.flow.email);
          localStorage.setItem('auth_user_id', String(login.idUsuario ?? ''));
        }

        this.router.navigate([res?.redirectTo || this.flow.redirectTo || APP_ROUTE_PATHS.login], { replaceUrl: true });
      },
      error: err => {
        this.loading = false;
        this.digits = ['', '', '', '', '', ''];
        this.errorMessage = err?.error?.message || 'Codigo incorrecto o expirado.';
      }
    });
  }

  private normalizeRole(rol: string | null | undefined): string {
    return (rol || '').toUpperCase().replace(/^ROLE_/, '').trim();
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.syncCountdownsFromStorage();
      if (this.resendSeconds > 0) {
        this.resendSeconds--;
      }

      if (this.expiresSeconds > 0) {
        this.expiresSeconds--;
      }

      if (this.resendSeconds <= 0 && this.expiresSeconds <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private fillDigits(value: string, startIndex: number): void {
    const chars = value.slice(0, 6 - startIndex).split('');

    chars.forEach((char, offset) => {
      this.digits[startIndex + offset] = char;
    });

    const nextIndex = Math.min(startIndex + chars.length, 5);
    this.focusDigit(nextIndex);

    if (this.digits.every(Boolean)) {
      this.verify();
    }
  }

  private focusDigit(index: number): void {
    setTimeout(() => {
      document.querySelector<HTMLInputElement>(`#mfa-digit-${index}`)?.focus();
    });
  }

  private hydrateTimers(): void {
    const now = Date.now();
    const expiresAt = Number(this.flow?.expiresAt || 0);
    const resendAt = Number(this.flow?.resendAt || 0);

    if (expiresAt > now) {
      this.expiresSeconds = Math.ceil((expiresAt - now) / 1000);
    } else {
      this.expiresSeconds = Number(this.flow?.expiresInSeconds || 300);
      this.flow.expiresAt = now + this.expiresSeconds * 1000;
    }

    if (resendAt > now) {
      this.resendSeconds = Math.ceil((resendAt - now) / 1000);
    } else {
      this.setResendCountdown(Number(this.flow?.resendInSeconds || 30));
    }

    sessionStorage.setItem('pending_mfa_flow', JSON.stringify(this.flow));
  }

  private setResendCountdown(seconds: number): void {
    this.resendSeconds = Math.max(0, seconds);
    if (this.flow) {
      this.flow.resendAt = Date.now() + this.resendSeconds * 1000;
      sessionStorage.setItem('pending_mfa_flow', JSON.stringify(this.flow));
    }
  }

  private syncCountdownsFromStorage(): void {
    const now = Date.now();
    this.resendSeconds = Math.max(0, Math.ceil((Number(this.flow?.resendAt || 0) - now) / 1000));
    this.expiresSeconds = Math.max(0, Math.ceil((Number(this.flow?.expiresAt || 0) - now) / 1000));
  }
}
