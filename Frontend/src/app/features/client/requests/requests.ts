import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.html',
  styleUrl: './requests.scss'
})
export class RequestsComponent implements OnInit {

  requests: any[] = [];

  summary = {
    activas: 0,
    preparacion: 0,
    camino: 0,
    entregadas: 0
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {

    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No hay token');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>(
      'http://localhost:8080/api/solicitudes/mis-solicitudes',
      { headers }
    )
    .subscribe({
      next: (res) => {

        console.log("RESPUESTA BACKEND:", res);

        this.requests = res.map(s => ({
          id: s.idSolicitud,

          code: `RFQ-2026-${s.idSolicitud.toString().padStart(4, '0')}`,

          provider: s.nombreProveedor, // 🔥 CORRECTO

          amount: `S/ ${Number(s.total).toLocaleString('es-PE', {
            minimumFractionDigits: 2
          })}`,

          date: new Date(s.fechaCreacion).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),

          status: this.mapStatusText(s.estado),
          statusClass: this.mapStatusClass(s.estado),
          rawStatus: s.estado
        }));

        this.calcularResumen();

        // 🔥 fuerza render Angular
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  private mapStatusText(estado: string): string {

    const map: any = {
      PAGO_PENDIENTE: 'Pendiente pago',
      PAGO_VALIDANDO: 'Validando pago',
      ESPERANDO_ENVIO: 'En preparación',
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregado',
      COMPLETADA: 'Completado'
    };

    return map[estado] || estado;
  }

  private mapStatusClass(estado: string): string {

    const map: any = {
      PAGO_PENDIENTE: 'pending',
      PAGO_VALIDANDO: 'validating',
      ESPERANDO_ENVIO: 'preparing',
      EN_CAMINO: 'shipping',
      ENTREGADA: 'delivered',
      COMPLETADA: 'completed'
    };

    return map[estado] || 'default';
  }

  private calcularResumen(): void {

    this.summary.activas = this.requests.length;

    this.summary.preparacion =
      this.requests.filter(r =>
        r.rawStatus === 'PAGO_VALIDANDO' ||
        r.rawStatus === 'ESPERANDO_ENVIO'
      ).length;

    this.summary.camino =
      this.requests.filter(r =>
        r.rawStatus === 'EN_CAMINO'
      ).length;

    this.summary.entregadas =
      this.requests.filter(r =>
        r.rawStatus === 'ENTREGADA' ||
        r.rawStatus === 'COMPLETADA'
      ).length;
  }
}