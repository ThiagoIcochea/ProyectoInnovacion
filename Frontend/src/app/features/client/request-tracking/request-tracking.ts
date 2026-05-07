import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    console.log('TRACKING COMPONENT INICIADO');

    const id = this.route.snapshot.paramMap.get('id');

    console.log('ID TRACKING:', id);

    if (id) {
      this.cargarTracking(id);
    }
  }

  cargarTracking(id: string): void {

    this.http.get<any>(
      `http://localhost:8080/api/solicitudes/${id}/tracking`
    )
    .subscribe({

      next: (res) => {

        try {

          console.log('TRACKING RESPONSE:', res);

          this.tracking = res;

          if (res.timeline && Array.isArray(res.timeline)) {

            this.steps = res.timeline.map((item: any, index: number) => {

              let status = 'pending';

              if (index < res.timeline.length - 1) {
                status = 'done';
              }

              if (index === res.timeline.length - 1) {
                status = 'active';
              }

              return {
                title: this.mapEstado(item.estado),
                description: item.descripcion || 'Sin descripción',
                date: item.fecha
  ? this.formatFecha(item.fecha)
  : 'Sin fecha',
                status
              };
            });

          } else {

            this.steps = [];
          }

          console.log('STEPS:', this.steps);

          this.loading = false;

          this.cdr.detectChanges();

        } catch (e) {

          console.error('ERROR INTERNO:', e);

          this.loading = false;

          this.cdr.detectChanges();
        }
      },

      error: (err) => {

        console.error('ERROR HTTP:', err);

        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  mapEstado(estado: string): string {

    const map: any = {
      CREADA: 'Solicitud creada',
      PAGO_PENDIENTE: 'Pago pendiente',
      PAGO_VALIDANDO: 'Pago validando',
      PAGADA: 'Pago aprobado',
      ESPERANDO_ENVIO: 'En preparación',
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregado',
      COMPLETADA: 'Completado'
    };

    return map[estado] || estado;
  }

  formatFecha(fecha: string): string {

    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoTexto(): string {

    if (!this.tracking) {
      return '';
    }

    return this.mapEstado(this.tracking.estado);
  }
}