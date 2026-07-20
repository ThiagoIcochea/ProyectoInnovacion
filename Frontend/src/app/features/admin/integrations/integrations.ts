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

  async configurar(item: any): Promise<void> {
    const { isConfirmed, value } = await Swal.fire({
      title: `Editar ${item.clave}`,
      input: 'text',
      inputValue: item.valor,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false
    });

    const nuevoValor = String(value || '').trim();

    if (!isConfirmed || nuevoValor === '') {
      return;
    }

    this.http.put(
      `${this.API_URL}/${item.id}`,
      {
        valor: nuevoValor
      },
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: async () => {

        item.valor = nuevoValor;

        this.cdr.detectChanges();

        await Swal.fire({
          icon: 'success',
          title: 'Configuración actualizada',
          text: 'El valor quedó guardado correctamente.'
        });
      },

      error: async (err) => {

        console.error(err);

        await Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: 'No se pudo guardar la configuración.'
        });
      }
    });
  }
}
