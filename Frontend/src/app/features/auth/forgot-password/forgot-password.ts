import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

type MfaMethod = 'email' | 'whatsapp' | 'sms' | 'call';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: '../mfa/mfa.scss'
})
export class ForgotPasswordComponent {
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  private readonly passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;

  email = '';
  method: MfaMethod = 'email';
  digits = ['', '', '', '', '', ''];
  newPassword = '';
  confirmPassword = '';
  step: 'email' | 'code' | 'password' = 'email';
  loading = false;
  errorMessage = '';
  successMessage = '';
  tempToken = '';
  actionToken = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  start(): void {
    const cleanEmail = this.email.trim().toLowerCase();

    if (!this.emailRegex.test(cleanEmail)) {
      this.errorMessage = 'Correo invalido. Usa un formato como usuario@empresa.com.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/start`, {
      email: cleanEmail,
      method: this.method
    }).subscribe({
      next: res => {
        this.tempToken = res?.tempToken || '';
        if (!this.tempToken) {
          this.loading = false;
          this.errorMessage = 'No se recibio el flujo MFA. Intenta nuevamente.';
          this.cdr.detectChanges();
          return;
        }
        this.email = cleanEmail;
        this.step = 'code';
        this.loading = false;
        this.successMessage = `Codigo enviado por ${this.methodLabel(this.method)}. Ingresa los 6 digitos.`;
        this.cdr.detectChanges();
        this.focusCodeInput();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo enviar el codigo.';
        this.cdr.detectChanges();
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

    if (this.digits.every(Boolean)) {
      this.verifyCode();
    }
  }

  changeMethod(method: MfaMethod): void {
    if (this.loading || this.method === method) {
      return;
    }

    this.method = method;
    this.resendCode();
  }

  resendCode(): void {
    if (this.loading || !this.tempToken) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/resend`, {
      email: this.email.trim(),
      tempToken: this.tempToken,
      method: this.method
    }).subscribe({
      next: res => {
        this.tempToken = res?.tempToken || this.tempToken;
        this.digits = ['', '', '', '', '', ''];
        this.loading = false;
        this.successMessage = `Codigo reenviado por ${this.methodLabel(this.method)}.`;
        this.cdr.detectChanges();
        this.focusCodeInput();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || `No se pudo reenviar por ${this.methodLabel(this.method)}.`;
        this.cdr.detectChanges();
      }
    });
  }

  pasteCode(event: ClipboardEvent): void {
    const clean = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    event.preventDefault();
    clean.split('').forEach((char, index) => this.digits[index] = char);
  }

  verifyCode(): void {
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
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email: this.email.trim(),
      tempToken: this.tempToken,
      code,
      method: this.method,
      purpose: 'PASSWORD_RESET'
    }).subscribe({
      next: res => {
        this.actionToken = res?.mfaActionToken || '';
        if (!this.actionToken) {
          this.loading = false;
          this.errorMessage = 'No se recibio la autorizacion MFA. Solicita un nuevo codigo.';
          this.cdr.detectChanges();
          return;
        }
        this.step = 'password';
        this.loading = false;
        this.successMessage = 'Codigo verificado. Ahora crea tu nueva contrasena.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Codigo incorrecto o expirado.';
        this.digits = ['', '', '', '', '', ''];
        this.cdr.detectChanges();
        this.focusCodeInput();
      }
    });
  }

  complete(): void {
    if (!this.passwordRegex.test(this.newPassword)) {
      this.errorMessage = 'Contrasena invalida: minimo 8 caracteres, una mayuscula, una minuscula y un numero.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contrasenas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>(`${APP_API_BASE_URL}/auth/forgot-password/complete`, {
      email: this.email.trim(),
      mfaActionToken: this.actionToken,
      newPassword: this.newPassword
    }).subscribe({
      next: res => {
        this.loading = false;
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
        this.cdr.detectChanges();
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

  methodLabel(method: string): string {
    const labels: Record<string, string> = {
      email: 'correo',
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      call: 'llamada'
    };

    return labels[method] || method;
  }

  private focusCodeInput(): void {
    setTimeout(() => document.querySelector<HTMLInputElement>('#reset-digit-0')?.focus());
  }
}
