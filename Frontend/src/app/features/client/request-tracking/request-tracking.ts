// Backend touchpoint: request tracking timeline, cancel action and payment handoff.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-request-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-tracking.html',
  styleUrl: './request-tracking.scss'
})
export class RequestTrackingComponent implements OnInit {

  tracking: any = null;
  steps: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarTracking(id);
    }
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarTracking(id: string): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/solicitudes/${id}/tracking`,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('TRACKING:', res);

        this.tracking = res;

        localStorage.setItem(
          APP_STORAGE_KEYS.currentSolicitudId,
          String(res.idSolicitud)
        );

        this.steps = (res.timeline || []).map((t: any, i: number) => ({
          title: this.mapEstado(t.estado),
          description: t.descripcion,
          date: t.fecha,
          status: i === res.timeline.length - 1
            ? 'active'
            : 'done'
        }));

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  irAPago(): void {

    if (!this.tracking?.idSolicitud) {
      return;
    }

    localStorage.setItem(
      APP_STORAGE_KEYS.currentSolicitudId,
      String(this.tracking.idSolicitud)
    );

    this.router.navigate([APP_ROUTE_PATHS.rfqPayment]);
  }

  cancelarSolicitud(): void {

    const id = this.tracking.idSolicitud;

    this.http.put(
      `${APP_API_BASE_URL}/solicitudes/${id}/cancelar`,
      {},
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('CANCELADO:', res);

        this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
      },

      error: (err) => {

        console.error('ERROR CANCELAR:', err);

        alert('Error al cancelar');
      }
    });
  }

  mapEstado(estado: string): string {

    const map: any = {
      CREADA: 'Creada',
      PAGO_PENDIENTE: 'Pago pendiente',
      PAGO_VALIDANDO: 'Validando pago',
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregado',
      CANCELADA: 'Cancelada'
    };

    return map[estado] || estado;
  }

  getEstadoTexto(): string {

    if (!this.tracking) {
      return '';
    }

    return this.mapEstado(this.tracking.estado);
  }
}