// Backend touchpoint: login request and role-based redirect after token issuance.
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {

  email: string = '';
  password: string = '';
  rememberEmail: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';

  private readonly rememberedEmailKey = 'rememberedEmail';
  private loginWaitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem(this.rememberedEmailKey);

    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.rememberEmail = true;
    }
  }

  onEmailChange(value: string): void {
    this.email = value;

    if (this.rememberEmail) {
      this.syncRememberedEmail();
    }
  }

  onRememberChange(): void {
    this.syncRememberedEmail();
  }

  login(): void {
    if (this.loading) {
      return;
    }

    const correo = this.email.trim();
    const password = this.password;

    if (!correo || !password.trim()) {
      this.errorMessage = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.syncRememberedEmail();
    this.clearLoginSession();
    this.startLoginWaitNotice();

    const body = {
      correo,
      password
    };

    this.http.post(`${APP_API_BASE_URL}/auth/login`, body)
      .pipe(timeout({ first: 70000 }))
      .subscribe({
        next: (res: any) => {
          this.clearLoginWaitNotice();

          const normalizedRole = this.normalizeRole(
            res?.rol ??
            res?.role ??
            res?.usuario?.rol ??
            res?.usuario?.role
          );

          if (res?.requiresMfa && res?.tempToken) {
            sessionStorage.setItem('pending_mfa_flow', JSON.stringify({
              email: res.email || res.correo || correo,
              tempToken: res.tempToken,
              purpose: res.purpose || 'LOGIN',
              redirectTo: res.redirectTo || APP_ROUTE_PATHS.clientDashboard,
              emailOnly: Boolean(res.emailOnly),
              expiresInSeconds: res.expiresInSeconds,
              resendInSeconds: res.resendInSeconds,
              expiresAt: Date.now() + Number(res.expiresInSeconds || 300) * 1000,
              resendAt: Date.now() + Number(res.resendInSeconds || 30) * 1000
            }));
            this.loading = false;
            this.router.navigate(['/mfa'], { replaceUrl: true });
            return;
          }

          if (!res?.token || !normalizedRole) {
            this.loading = false;
            this.errorMessage = 'Respuesta de login incompleta.';
            return;
          }

          localStorage.setItem(APP_STORAGE_KEYS.token, res.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, normalizedRole);
          localStorage.setItem('auth_user_email', res?.correo || correo);
          localStorage.setItem('auth_user_id', String(res?.idUsuario ?? ''));

          this.redirectByRole(normalizedRole);
        },

        error: (err) => {
          this.clearLoginWaitNotice();
          this.loading = false;
          this.errorMessage = this.getLoginErrorMessage(err);
        }
      });
  }

  ngOnDestroy(): void {
    this.clearLoginWaitNotice();
  }

  redirectByRole(rol: string): void {
    this.loading = false;

    if (rol === 'ADMIN') {

      this.router.navigate([APP_ROUTE_PATHS.adminDashboard], { replaceUrl: true });

    } else if (rol === 'PROVEEDOR') {

      this.router.navigate([APP_ROUTE_PATHS.providerDashboard], { replaceUrl: true });

    } else if (rol === 'CLIENTE') {

      this.router.navigate([APP_ROUTE_PATHS.clientDashboard], { replaceUrl: true });

    } else {

      this.errorMessage = `Rol no reconocido: ${rol}`;
      this.router.navigate([APP_ROUTE_PATHS.login]);
    }
  }

  private normalizeRole(rol: string | null | undefined): string {
    return (rol || '')
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .trim();
  }

  private syncRememberedEmail(): void {
    const email = this.email.trim();

    if (this.rememberEmail && email) {
      localStorage.setItem(this.rememberedEmailKey, email);
      return;
    }

    localStorage.removeItem(this.rememberedEmailKey);
  }

  private clearLoginSession(): void {
    localStorage.removeItem(APP_STORAGE_KEYS.token);
    localStorage.removeItem(APP_STORAGE_KEYS.role);
    localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
    localStorage.removeItem(APP_STORAGE_KEYS.currentSolicitudId);
  }

  private startLoginWaitNotice(): void {
    this.clearLoginWaitNotice();

    this.loginWaitTimer = setTimeout(() => {
      if (this.loading) {
        this.errorMessage = 'El servidor esta iniciando. Puede tardar unos segundos mas.';
      }
    }, 7000);
  }

  private clearLoginWaitNotice(): void {
    if (this.loginWaitTimer) {
      clearTimeout(this.loginWaitTimer);
      this.loginWaitTimer = null;
    }
  }

  private getLoginErrorMessage(err: any): string {
    if (err?.name === 'TimeoutError') {
      return 'El backend tardo demasiado en responder. Intenta nuevamente en unos segundos.';
    }

    if (err?.status === 0) {
      return 'No se pudo conectar con el backend. Revisa que el servidor este activo.';
    }

    const backendMessage = String(err?.error?.message ?? err?.error ?? '').trim();

    if (backendMessage) {
      return backendMessage;
    }

    return 'Credenciales incorrectas o usuario inactivo.';
  }
}
