import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

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

  registrar(): void {

    if (!this.acepta) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    this.http.post(
      'https://proyectoinnovacion.onrender.com/api/usuarios/register',
      this.form,
      {
        responseType: 'text'
      }
    )
    .subscribe({

      next: (res) => {

        alert(res);

        this.router.navigate(['/login']);
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