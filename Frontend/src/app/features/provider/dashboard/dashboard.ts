import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class ProviderDashboardComponent implements OnInit {
  metrics = [
    {
      title: 'Solicitudes recibidas',
      value: '0',
      change: 'Cargando datos',
      icon: '#'
    },
    {
      title: 'Solicitudes aprobadas',
      value: '0',
      change: 'Cargando datos',
      icon: 'OK'
    },
    {
      title: 'Ingresos estimados',
      value: 'S/ 0.00',
      change: 'Cargando datos',
      icon: 'S/'
    }
  ];

  recentRequests: any[] = [];
  providerName = 'proveedor';
  apiStatus = 'API sin estado';
  apiConnected = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  private cargarDashboard(): void {
    forkJoin({
      requests: this.http.get<any[]>(`${APP_API_BASE_URL}/solicitudes/proveedor/mis-solicitudes`).pipe(catchError(() => of([]))),
      apiConfig: this.http.get<any>(`${APP_API_BASE_URL}/proveedor-api`).pipe(catchError(() => of(null)))
    }).subscribe(({ requests, apiConfig }) => {
      const approved = requests.filter(request => this.isApproved(request?.estado));
      const estimatedIncome = approved.reduce((sum, request) => sum + Number(request?.total || 0), 0);

      this.providerName = requests[0]?.nombreProveedor || 'proveedor';
      this.apiConnected = (apiConfig?.estado || '').toUpperCase() === 'OK' || (apiConfig?.estado || '').toUpperCase() === 'ACTIVO';
      this.apiStatus = this.apiConnected ? 'API conectada' : 'API pendiente';

      this.metrics = [
        {
          title: 'Solicitudes recibidas',
          value: this.formatCount(requests.length),
          change: `${this.formatCount(this.countPending(requests))} pendientes de accion`,
          icon: '#'
        },
        {
          title: 'Solicitudes aprobadas',
          value: this.formatCount(approved.length),
          change: `${this.formatCount(this.countRejected(requests))} rechazadas/canceladas`,
          icon: 'OK'
        },
        {
          title: 'Ingresos estimados',
          value: this.formatMoney(estimatedIncome),
          change: 'Sobre solicitudes aprobadas',
          icon: 'S/'
        }
      ];

      this.recentRequests = requests.slice(0, 5).map(request => ({
        id: this.getRfQCode(request),
        client: request?.nombreEmpresa || request?.nombreCliente || 'Cliente sin nombre',
        location: request?.direccionEnvio || request?.rucEmpresa || 'Sin direccion registrada',
        products: `${request?.detalles?.length || 0} item${request?.detalles?.length === 1 ? '' : 's'}`,
        date: this.formatDateTime(request?.fechaCreacion),
        status: request?.estado || 'Sin estado'
      }));

      this.cdr.detectChanges();
    });
  }

  private isApproved(status: string): boolean {
    return ['PAGADA', 'EN_PREPARACION', 'EN_CAMINO', 'ENTREGADA', 'COMPLETADA', 'Pedido aprobado'].includes(status || '');
  }

  private countPending(requests: any[]): number {
    return requests.filter(request => ['PAGO_PENDIENTE', 'PAGO_VALIDANDO', 'Pago pendiente'].includes(request?.estado || '')).length;
  }

  private countRejected(requests: any[]): number {
    return requests.filter(request => ['CANCELADA', 'RECHAZADA', 'Pedido rechazado'].includes(request?.estado || '')).length;
  }

  private getRfQCode(request: any): string {
    const date = request?.fechaCreacion ? new Date(request.fechaCreacion) : new Date();
    const id = String(request?.idSolicitud || 0).padStart(4, '0');

    return `RFQ-${date.getFullYear()}-${id}`;
  }

  private formatDateTime(date?: string): string {
    if (!date) {
      return 'Sin fecha';
    }

    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatCount(value: number): string {
    return Number(value || 0).toLocaleString('es-PE');
  }

  private formatMoney(value: number): string {
    return `S/ ${Number(value || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
