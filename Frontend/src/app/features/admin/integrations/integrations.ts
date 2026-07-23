import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { extractValidationMessage } from '../../../core/utils/form-validation';

@Component({
  selector: 'app-admin-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrations.html',
  styleUrl: './integrations.scss'
})
export class AdminIntegrationsComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/config`;

  integrations: any[] = [];
  loading = true;
  readonly skeletonCards = Array.from({ length: 6 });

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    setTimeout(() => {

      this.listar();

      this.cdr.detectChanges();

    }, 0);
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization:
        `Bearer ${localStorage.getItem('token')}`
    });
  }

  listar(): void {
    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.integrations = res;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);
        this.integrations = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  probarConexion(item: any): void {

    if (!item.testeable) {
      return;
    }

    this.http.post(
      `${this.API_URL}/${item.id}/test`,
      {},
      {
        headers: this.headers(),
        responseType: 'text'
      }
    )
    .subscribe({

      next: (res) => {

        item.estado =
          res === 'OK'
          ? 'ACTIVO'
          : 'INACTIVO';

        this.cdr.detectChanges();
      },

      error: () => {

        item.estado = 'INACTIVO';

        this.cdr.detectChanges();
      }
    });
  }

  async crearConfiguracion(): Promise<void> {
    const { isConfirmed, value } = await Swal.fire({
      title: 'Nueva variable de integración',
      html: `
        <div style="text-align:left;display:grid;gap:12px;font-family:Inter,system-ui,sans-serif">
          <label for="config-clave" style="font-size:0.9rem;font-weight:700;color:#0f172a">Clave</label>
          <input id="config-clave" class="swal2-input" placeholder="CLOUDINARY_CLOUD_NAME" />
          <label for="config-valor" style="font-size:0.9rem;font-weight:700;color:#0f172a">Valor</label>
          <input id="config-valor" class="swal2-input" placeholder="mi-cloud" />
          <label for="config-tipo" style="font-size:0.9rem;font-weight:700;color:#0f172a">Tipo</label>
          <select id="config-tipo" class="swal2-input" style="padding:0 0.9rem">
            <option value="CONFIG">CONFIG</option>
            <option value="API">API</option>
            <option value="EMAIL">EMAIL</option>
            <option value="CLOUDINARY">CLOUDINARY</option>
            <option value="DOMINIO">DOMINIO</option>
            <option value="SEGURIDAD">SEGURIDAD</option>
          </select>
          <label for="config-estado" style="font-size:0.9rem;font-weight:700;color:#0f172a">Estado</label>
          <select id="config-estado" class="swal2-input" style="padding:0 0.9rem">
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: () => ({
        clave: (document.getElementById('config-clave') as HTMLInputElement | null)?.value?.trim() || '',
        valor: (document.getElementById('config-valor') as HTMLInputElement | null)?.value?.trim() || '',
        tipo: (document.getElementById('config-tipo') as HTMLSelectElement | null)?.value?.trim() || 'CONFIG',
        estado: (document.getElementById('config-estado') as HTMLSelectElement | null)?.value?.trim() || 'ACTIVO'
      })
    });

    if (!isConfirmed || !value?.clave) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.post(
      this.API_URL,
      value,
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    ).subscribe({
      next: async () => {
        await Swal.fire({ icon: 'success', title: 'Variable creada', text: 'La configuración se agregó correctamente.' });
        this.listar();
      },
      error: async (err) => {
        await Swal.fire({ icon: 'error', title: 'No se pudo crear', text: extractValidationMessage(err, 'No se pudo crear la configuración.') });
      }
    });
  }

  async configurar(item: any): Promise<void> {
    const selectedType = item.tipo || 'CONFIG';
    const selectedState = item.estado || 'ACTIVO';
    const { isConfirmed, value } = await Swal.fire({
      title: `Editar ${item.clave}`,
      html: `
        <div style="text-align:left;display:grid;gap:12px;font-family:Inter,system-ui,sans-serif">
          <label for="config-clave" style="font-size:0.9rem;font-weight:700;color:#0f172a">Clave</label>
          <input id="config-clave" class="swal2-input" value="${item.clave || ''}" />
          <label for="config-valor" style="font-size:0.9rem;font-weight:700;color:#0f172a">Valor</label>
          <input id="config-valor" class="swal2-input" value="${item.valor || ''}" />
          <label for="config-tipo" style="font-size:0.9rem;font-weight:700;color:#0f172a">Tipo</label>
          <select id="config-tipo" class="swal2-input" style="padding:0 0.9rem">
            <option value="CONFIG" ${selectedType === 'CONFIG' ? 'selected' : ''}>CONFIG</option>
            <option value="API" ${selectedType === 'API' ? 'selected' : ''}>API</option>
            <option value="EMAIL" ${selectedType === 'EMAIL' ? 'selected' : ''}>EMAIL</option>
            <option value="CLOUDINARY" ${selectedType === 'CLOUDINARY' ? 'selected' : ''}>CLOUDINARY</option>
            <option value="DOMINIO" ${selectedType === 'DOMINIO' ? 'selected' : ''}>DOMINIO</option>
            <option value="SEGURIDAD" ${selectedType === 'SEGURIDAD' ? 'selected' : ''}>SEGURIDAD</option>
          </select>
          <label for="config-estado" style="font-size:0.9rem;font-weight:700;color:#0f172a">Estado</label>
          <select id="config-estado" class="swal2-input" style="padding:0 0.9rem">
            <option value="ACTIVO" ${selectedState === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
            <option value="INACTIVO" ${selectedState === 'INACTIVO' ? 'selected' : ''}>INACTIVO</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false,
      preConfirm: () => ({
        clave: (document.getElementById('config-clave') as HTMLInputElement | null)?.value?.trim() || '',
        valor: (document.getElementById('config-valor') as HTMLInputElement | null)?.value?.trim() || '',
        tipo: (document.getElementById('config-tipo') as HTMLSelectElement | null)?.value?.trim() || 'CONFIG',
        estado: (document.getElementById('config-estado') as HTMLSelectElement | null)?.value?.trim() || 'ACTIVO'
      })
    });

    if (!isConfirmed || !value?.clave) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.put(
      `${this.API_URL}/${item.id}`,
      {
        valor: value.valor,
        clave: value.clave,
        tipo: value.tipo,
        estado: value.estado
      },
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    )
    .subscribe({
      next: async () => {
        item.clave = value.clave;
        item.valor = value.valor;
        item.tipo = value.tipo;
        item.estado = value.estado;

        this.integrations = this.integrations.map(config => config.id === item.id ? { ...config, ...item } : config);
        this.cdr.detectChanges();

        await Swal.fire({
          icon: 'success',
          title: 'Configuración actualizada',
          text: 'El valor quedó guardado correctamente.'
        });
      },
      error: async (err) => {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: extractValidationMessage(err, 'No se pudo guardar la configuración.')
        });
      }
    });
  }

  async eliminarConfiguracion(item: any): Promise<void> {
    const { isConfirmed } = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar variable',
      text: `¿Deseas eliminar ${item.clave}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) {
      return;
    }

    const token = await this.requestAdminMfa();
    if (!token) {
      return;
    }

    this.http.delete(
      `${this.API_URL}/${item.id}`,
      {
        headers: this.headers().set('X-MFA-Authorization', token)
      }
    ).subscribe({
      next: async () => {
        await Swal.fire({ icon: 'success', title: 'Variable eliminada', text: 'La configuración se quitó correctamente.' });
        this.listar();
      },
      error: async (err) => {
        await Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: extractValidationMessage(err, 'No se pudo eliminar la configuración.') });
      }
    });
  }

  private async requestAdminMfa(): Promise<string | null> {
    try {
      const email = localStorage.getItem('auth_user_email') || '';
      return await this.http.post<{ mfaActionToken?: string }>(`${APP_API_BASE_URL}/auth/mfa/action-token`, { email, purpose: 'ADMIN_ACTION' }).toPromise()?.then((res: any) => res?.mfaActionToken || null);
    } catch (error) {
      return null;
    }
  }
}
