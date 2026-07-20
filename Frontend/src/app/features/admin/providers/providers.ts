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

import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './providers.html',
  styleUrl: './providers.scss'
})
export class AdminProvidersComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/provider/admin/listar`;

  providers: any[] = [];

  filteredProviders: any[] = [];

  searchTerm: string = '';
  loading = true;
  readonly skeletonRows = Array.from({ length: 5 });

  selectedProvider: any = null;
  showManageModal = false;
  estadoSeleccionado = 'Activo';
  apiUrl = '';
  apiTipo = 'REST';
  apiToken = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  ngOnInit(): void {

    this.listarProviders();

   
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarProviders(): void {
    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.providers = res;

        this.filteredProviders = [...res];

        this.filtrarProviders();
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);
        this.providers = [];
        this.filteredProviders = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarProviders(): void {

    const text =
      this.searchTerm.toLowerCase();

    this.filteredProviders =
      this.providers.filter(provider =>

        provider?.razonSocial
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.correo
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.estado
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.estadoApi
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.ruc
          ?.toLowerCase()
          .includes(text)
      );

    this.cdr.detectChanges();
  }

  getTotalProveedores(): number {

    return this.filteredProviders.length;
  }

  getActivos(): number {

    return this.filteredProviders.filter(
      p =>
        p.estado?.toUpperCase() === 'ACTIVO'
    ).length;
  }

  getApiConectada(): number {

    return this.filteredProviders.filter(
      p =>
        p.estadoApi?.toUpperCase() === 'OK'
    ).length;
  }

  getSuspendidos(): number {

    return this.filteredProviders.filter(
      p =>
        p.estado?.toUpperCase() === 'SUSPENDIDO'
    ).length;
  }

  abrirGestion(provider: any): void {
    this.selectedProvider = provider;
    this.estadoSeleccionado = this.normalizarEstado(provider?.estado);
    this.apiUrl = provider?.apiUrl || '';
    this.apiTipo = provider?.apiTipo || 'REST';
    this.apiToken = provider?.apiToken || '';
    this.showManageModal = true;
    this.cdr.detectChanges();
  }

  cerrarGestion(): void {
    this.showManageModal = false;
    this.selectedProvider = null;
    this.cdr.detectChanges();
  }

  async guardarGestion(): Promise<void> {
    if (!this.selectedProvider) {
      return;
    }

    try {
      const adminEmail = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfaService.requestActionToken(adminEmail, 'ADMIN_ACTION');
      const nuevoEstado = this.estadoSeleccionado.toUpperCase();
      const payload = {
        idProveedor: this.selectedProvider.idProveedor,
        estado: nuevoEstado,
        apiUrl: this.apiUrl,
        apiTipo: this.apiTipo,
        apiToken: this.apiToken
      };

      this.http.post(
        `${APP_API_BASE_URL}/provider/admin/estado`,
        payload,
        {
          headers: this.headers().set('X-MFA-Authorization', token)
        }
      ).subscribe({
        next: () => {
          this.selectedProvider.estado = nuevoEstado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
          this.selectedProvider.apiUrl = this.apiUrl;
          this.selectedProvider.apiTipo = this.apiTipo;
          this.selectedProvider.apiToken = this.apiToken;
          this.showManageModal = false;
          this.selectedProvider = null;
          this.cdr.detectChanges();
          alert('Proveedor actualizado correctamente');
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.message || 'No fue posible actualizar el proveedor');
        }
      });
    } catch (error: any) {
      alert(error?.message || 'MFA cancelado.');
    }
  }

  private normalizarEstado(value: unknown): string {
    const raw = String(value ?? '').trim().toLowerCase();

    if (raw === 'inactivo' || raw === 'inactive' || raw === 'suspendido' || raw === 'suspendido') {
      return 'Inactivo';
    }

    return 'Activo';
  }
}
