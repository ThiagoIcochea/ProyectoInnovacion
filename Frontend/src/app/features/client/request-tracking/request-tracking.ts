import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
    if (id) this.cargarTracking(id);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarTracking(id: string): void {

    this.http.get<any>(
      `http://localhost:8080/api/solicitudes/${id}/tracking`,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        this.tracking = res;
        

        localStorage.setItem('current_solicitud_id', String(res.idSolicitud));

        this.steps = (res.timeline || []).map((t: any, i: number) => ({
          title: this.mapEstado(t.estado),
          description: t.descripcion,
          date: t.fecha,
          status: i === res.timeline.length - 1 ? 'active' : 'done'
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: () => this.loading = false
    });
  }

  irAPago(): void {
    if (!this.tracking?.idSolicitud) return;

    localStorage.setItem('current_solicitud_id', String(this.tracking.idSolicitud));
    this.router.navigate(['/app/rfq/payment']);
  }

  cancelarSolicitud(): void {

    const id = this.tracking.idSolicitud;

    this.http.put(
      `http://localhost:8080/api/solicitudes/${id}/cancelar`,
      {},
      { headers: this.headers() }
    ).subscribe({

      next: () => {
        this.router.navigate(['/app/requests']);
      },

      error: () => alert('Error al cancelar')
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
    return this.tracking ? this.mapEstado(this.tracking.estado) : '';
  }
}