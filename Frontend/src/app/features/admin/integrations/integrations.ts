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
  selector: 'app-admin-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrations.html',
  styleUrl: './integrations.scss'
})
export class AdminIntegrationsComponent
implements OnInit {

  private API_URL =
    'https://proyectoinnovacion.onrender.com/api/config';

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

  configurar(item: any): void {

    const nuevoValor = prompt(
      `Editar valor para ${item.clave}`,
      item.valor
    );

    if (
      nuevoValor === null ||
      nuevoValor.trim() === ''
    ) {
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

      next: () => {

        item.valor = nuevoValor;

        this.cdr.detectChanges();

        alert(
          'Configuración actualizada'
        );
      },

      error: (err) => {

        console.error(err);

        alert(
          'No se pudo actualizar'
        );
      }
    });
  }
}
