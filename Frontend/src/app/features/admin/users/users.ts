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
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

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
    `${APP_API_BASE_URL}/usuarios/admin/listar`;

  users: any[] = [];

  filteredUsers: any[] = [];

  searchTerm: string = '';

  loading: boolean = false;
  saving: boolean = false;
  selectedUser: any | null = null;
  editForm: any = {};
  errorMessage = '';
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
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

        ['SUSPENDIDO', 'BLOQUEADO'].includes(u?.estado?.toUpperCase())

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

  gestionar(user: any): void {
    this.selectedUser = user;
    this.errorMessage = '';
    this.editForm = {
      nombres: user?.nombres || this.splitName(user?.nombreCompleto).nombres,
      apellidos: user?.apellidos || this.splitName(user?.nombreCompleto).apellidos,
      correo: user?.correo || '',
      telefono: user?.telefono || '',
      whatsapp: user?.whatsapp || '',
      direccion: user?.direccion || '',
      password: '',
      estado: user?.estado || 'ACTIVO'
    };
  }

  cerrarGestion(): void {
    this.selectedUser = null;
    this.editForm = {};
    this.errorMessage = '';
  }

  async guardarGestion(): Promise<void> {
    if (!this.selectedUser || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    try {
      const adminEmail = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfaService.requestActionToken(adminEmail, 'ADMIN_ACTION');
      const body = { ...this.editForm };

      if (!body.password) {
        delete body.password;
      }

      this.http.put<any>(
        `${APP_API_BASE_URL}/usuarios/admin/${this.selectedUser.idUsuario}`,
        body,
        {
          headers: this.headers().set('X-MFA-Authorization', token)
        }
      ).subscribe({
        next: updated => {
          this.saving = false;
          this.users = this.users.map(user => user.idUsuario === updated.idUsuario ? updated : user);
          this.filtrarUsuarios();
          this.cerrarGestion();
          this.cdr.detectChanges();
        },
        error: err => {
          this.saving = false;
          this.errorMessage = err?.error?.message || 'No se pudo guardar el usuario.';
          this.cdr.detectChanges();
        }
      });
    } catch (error: any) {
      this.saving = false;
      this.errorMessage = error?.message || 'MFA cancelado.';
      this.cdr.detectChanges();
    }
  }

  activarUsuario(): void {
    this.editForm.estado = 'ACTIVO';
  }

  private splitName(value: string): { nombres: string; apellidos: string } {
    const parts = String(value || '').trim().split(/\s+/);
    return {
      nombres: parts.slice(0, 2).join(' '),
      apellidos: parts.slice(2).join(' ')
    };
  }
}
