import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const body = {
      correo: this.email,
      password: this.password
    };

    this.http.post('http://localhost:8080/api/auth/login', body)
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.rol);
          this.redirectByRole(res.rol);
        },
        error: () => {
          alert('Credenciales incorrectas');

        }
      });
  }

  redirectByRole(rol: string) {
    if (rol === 'ADMIN') {
      this.router.navigate(['/app/admin/dashboard']);
    } else if (rol === 'PROVEEDOR') {
      this.router.navigate(['/app/provider/dashboard']);
    } else if (rol === 'CLIENTE') {
      this.router.navigate(['/app/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}