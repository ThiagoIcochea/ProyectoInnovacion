import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProviderComponent {

  nombres = '';
  apellidos = '';
  correo = '';
  password = '';
  telefono = '';
  whatsapp = '';
  direccion = '';

  razonSocial = '';
  ruc = '';
  descripcion = '';

  apiUrl = '';
  apiTipo = 'REST';
  apiToken = '';

  private baseUrl = 'https://proyectoinnovacion.onrender.com/api/provider';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  register(): void {

    const payload = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      correo: this.correo,
      password: this.password,
      telefono: this.telefono,
      whatsapp: this.whatsapp,
      direccion: this.direccion,

      razonSocial: this.razonSocial,
      ruc: this.ruc,
      descripcion: this.descripcion,

      apiUrl: this.apiUrl,
      apiTipo: this.apiTipo,
      apiToken: this.apiToken
    };

    this.http.post(
      `${this.baseUrl}/register`,
      payload,
      { headers: this.headers() }
    )
    .subscribe({

      next: () => {
        alert('Proveedor registrado correctamente');
      },

      error: (err) => {
        console.error('Error al registrar proveedor:', err);
        alert('Error al registrar proveedor');
      }

    });
  }
}
