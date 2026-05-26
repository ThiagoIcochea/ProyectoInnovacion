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

  login() {

    this.syncRememberedEmail();

    const body = {
      correo: this.email,
      password: this.password
    };

    this.http.post(`${APP_API_BASE_URL}/auth/login`, body)
      .subscribe({
        next: (res: any) => {

          localStorage.setItem(APP_STORAGE_KEYS.token, res.token);
          localStorage.setItem(APP_STORAGE_KEYS.role, res.rol);
          

          setTimeout(() => {
            this.redirectByRole(res.rol);
          }, 100);
        },

        error: () => {
          alert('Credenciales incorrectas');
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

      this.router.navigate([APP_ROUTE_PATHS.login]);
    }
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
