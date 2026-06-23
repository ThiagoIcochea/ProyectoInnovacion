// Backend touchpoint: login request and role-based redirect after token issuance.
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {

  email: string = '';
  password: string = '';
  rememberEmail: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';

  private readonly rememberedEmailKey = 'rememberedEmail';

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
    const password = this.password.trim();

    if (!correo || !password) {
      this.errorMessage = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.syncRememberedEmail();

    const body = {
      correo,
      password
    };

    this.http.post(`${APP_API_BASE_URL}/auth/login`, body)
      .subscribe({
        next: (res: any) => {
          const normalizedRole = this.normalizeRole(res?.rol);

          if (!res?.token || !normalizedRole) {
            this.loading = false;
            this.errorMessage = 'Respuesta de login incompleta.';
            return;
          }

          localStorage.setItem(APP_STORAGE_KEYS.token, res.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, normalizedRole);

          this.redirectByRole(normalizedRole);
        },

        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.status === 0
              ? 'No se pudo conectar con el backend.'
              : 'Credenciales incorrectas o usuario inactivo.';
        }
      });
  }

  redirectByRole(rol: string) {

    if (rol === 'ADMIN') {

      this.router.navigate([APP_ROUTE_PATHS.adminDashboard]);

    } else if (rol === 'PROVEEDOR') {

      this.router.navigate([APP_ROUTE_PATHS.providerDashboard]);

    } else if (rol === 'CLIENTE') {

      this.router.navigate([APP_ROUTE_PATHS.clientDashboard]);

    } else {

      this.loading = false;
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
}
