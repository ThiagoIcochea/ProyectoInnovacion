import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class AdminUsersComponent
implements OnInit {

  private API_URL =
    'https://proyectoinnovacion.onrender.com/api/usuarios/admin/listar';

  users: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    setTimeout(() => {

      this.listarUsuarios();

      this.cdr.detectChanges();

    }, 0);
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarUsuarios(): void {

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.users = res;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);
      }
    });
  }

  getTotalUsuarios(): number {

    return this.users.length;
  }

  getClientes(): number {

    return this.users.filter(
      u =>
        u.rol?.toUpperCase() === 'CLIENTE'
    ).length;
  }

  getProveedores(): number {

    return this.users.filter(
      u =>
        u.rol?.toUpperCase() === 'PROVEEDOR'
    ).length;
  }

  getPendientes(): number {

    return this.users.filter(
      u =>
        u.estado?.toUpperCase() === 'PENDIENTE'
    ).length;
  }

  formatearFecha(fecha: string): string {

    if (!fecha) {
      return '';
    }

    return new Date(fecha)
      .toLocaleDateString(
        'es-PE',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      );
  }
}