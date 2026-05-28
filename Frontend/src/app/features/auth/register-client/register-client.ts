// Backend touchpoint: client registration payload sent to /api/usuarios/register.
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './register-client.html',
  styleUrl: './register-client.scss'
})
export class RegisterClientComponent {

  acepta = false;
  submitted = false;
  formError = '';

  form = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    whatsapp: '',
    password: '',
    direccion: '',
    fotoPerfil: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  isFieldMissing(field: keyof RegisterClientComponent['form']): boolean {
    if (field === 'fotoPerfil') {
      return false;
    }

    return this.submitted && !String(this.form[field] || '').trim();
  }

  private hasRequiredFields(): boolean {
    return Boolean(
      this.form.nombres.trim() &&
      this.form.apellidos.trim() &&
      this.form.correo.trim() &&
      this.form.telefono.trim() &&
      this.form.whatsapp.trim() &&
      this.form.password.trim() &&
      this.form.direccion.trim()
    );
  }

  registrar(): void {
    this.submitted = true;
    this.formError = '';

    if (!this.hasRequiredFields()) {
      this.formError = 'Completa todos los campos obligatorios antes de crear tu cuenta.';
      return;
    }

    if (!this.acepta) {
      this.formError = 'Debes aceptar los terminos y condiciones.';
      return;
    }

    this.http.post(
      `${APP_API_BASE_URL}/usuarios/register`,
      this.form,
      {
        responseType: 'text'
      }
    )
    .subscribe({

      next: (res) => {

        alert(res);

        this.router.navigate([APP_ROUTE_PATHS.login]);
      },

      error: (err) => {

        console.error('Error al registrar cliente:', err);

        if (err.error?.message) {
          alert(err.error.message);
          return;
        }

        alert('Error al registrar cliente');
      }
    });
  }
}
