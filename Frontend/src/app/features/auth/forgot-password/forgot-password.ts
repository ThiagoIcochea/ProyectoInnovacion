import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: '../mfa/mfa.scss'
})
export class ForgotPasswordComponent {
  email = '';
  digits = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';
  step: 'email' | 'code' | 'password' = 'email';
  loading = false;
  errorMessage = '';
  tempToken = '';
  actionToken = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  start(): void {
    if (!this.email.trim()) {
      this.errorMessage = 'Ingresa tu correo.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/start`, {
      email: this.email.trim(),
      method: 'email'
    }).subscribe({
      next: res => {
        this.tempToken = res?.tempToken || '';
        this.step = 'code';
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo enviar el codigo.';
      }
    });
  }

  updateDigit(index: number, value: string): void {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      clean.slice(0, 6 - index).split('').forEach((char, offset) => this.digits[index + offset] = char);
    } else {
      this.digits[index] = clean.slice(-1);
    }

    const next = Math.min(index + clean.length, 5);
    setTimeout(() => document.querySelector<HTMLInputElement>(`#reset-digit-${next}`)?.focus());
  }

  pasteCode(event: ClipboardEvent): void {
    const clean = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    event.preventDefault();
    clean.split('').forEach((char, index) => this.digits[index] = char);
  }

  verifyCode(): void {
    const code = this.digits.join('');
    if (code.length !== 6) {
      this.errorMessage = 'Ingresa los 6 digitos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email: this.email.trim(),
      tempToken: this.tempToken,
      code,
      method: 'email',
      purpose: 'PASSWORD_RESET'
    }).subscribe({
      next: res => {
        this.actionToken = res?.mfaActionToken || '';
        this.step = 'password';
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Codigo incorrecto o expirado.';
      }
    });
  }

  complete(): void {
    if (this.newPassword.length < 6) {
      this.errorMessage = 'La contrasena debe tener al menos 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/complete`, {
      email: this.email.trim(),
      mfaActionToken: this.actionToken,
      newPassword: this.newPassword
    }).subscribe({
      next: res => {
        const login = res?.login;
        if (login?.token) {
          const role = this.normalizeRole(login.rol);
          localStorage.setItem(APP_STORAGE_KEYS.token, login.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, role);
          localStorage.setItem('auth_user_email', login.correo || this.email.trim());
          localStorage.setItem('auth_user_id', String(login.idUsuario ?? ''));
          this.router.navigate([this.redirectByRole(role)], { replaceUrl: true });
          return;
        }
        this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo actualizar la contrasena.';
      }
    });
  }

  private normalizeRole(rol: string | null | undefined): string {
    return (rol || '').toUpperCase().replace(/^ROLE_/, '').trim();
  }

  private redirectByRole(role: string): string {
    if (role === 'ADMIN') return APP_ROUTE_PATHS.adminDashboard;
    if (role === 'PROVEEDOR') return APP_ROUTE_PATHS.providerDashboard;
    return APP_ROUTE_PATHS.clientDashboard;
  }
}
