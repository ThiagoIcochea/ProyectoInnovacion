import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class AdminUsersComponent
implements OnInit {

  private API_URL =
    'https://proyectoinnovacion.onrender.com/api/usuarios/admin/listar';

  users: any[] = [];

  filteredUsers: any[] = [];

  searchTerm: string = '';

  loading: boolean = false;
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.listarUsuarios();

  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarUsuarios(): void {

    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.zone.run(() => {

          const usuarios =
            (res || []).filter(

              u =>

                u?.rol !== 'ADMIN'

            );

          this.users = [...usuarios];

          this.filteredUsers =
            [...usuarios];

          this.loading = false;

          this.cdr.detectChanges();

        });

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

        this.cdr.detectChanges();

      }
    });
  }

  filtrarUsuarios(): void {

    const texto =
      this.searchTerm
      .toLowerCase()
      .trim();

    if (!texto) {

      this.filteredUsers =
        [...this.users];

      this.cdr.detectChanges();

      return;
    }

    this.filteredUsers =
      this.users.filter(user =>

        user?.nombreCompleto
          ?.toLowerCase()
          .includes(texto)

        ||

        user?.correo
          ?.toLowerCase()
          .includes(texto)

        ||

        user?.rol
          ?.toLowerCase()
          .includes(texto)

      );

    this.cdr.detectChanges();
  }

  getTotalUsuarios(): number {

    return this.filteredUsers.length;
  }

  getClientes(): number {

    return this.filteredUsers.filter(

      u =>

        u?.rol?.toUpperCase()
        === 'CLIENTE'

    ).length;
  }

  getProveedores(): number {

    return this.filteredUsers.filter(

      u =>

        u?.rol?.toUpperCase()
        === 'PROVEEDOR'

    ).length;
  }

  getSuspendidos(): number {

    return this.filteredUsers.filter(

      u =>

        u?.estado?.toUpperCase()
        === 'SUSPENDIDO'

    ).length;
  }

  formatearFecha(
    fecha: string
  ): string {

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
