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
  historyChart: any[] = [];
  statusChart: any[] = [];
  insights = 'Generando analisis...';
  loadingInsights = false;

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
      apiConfig: this.http.get<any>(`${APP_API_BASE_URL}/proveedor-api`).pipe(catchError(() => of(null))),
      claims: this.http.get<any[]>(`${APP_API_BASE_URL}/reclamos/proveedor/mis-reclamos`).pipe(catchError(() => of([])))
    }).subscribe(({ requests, apiConfig, claims }) => {
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

      this.historyChart = this.buildMonthlyHistory(requests);
      this.statusChart = this.buildStatusChart(requests);
      this.generarInsights(requests, claims, estimatedIncome);

      this.cdr.detectChanges();
    });
  }

  exportarDashboard(): void {
    const html = `
      <html>
        <head>
          <title>Dashboard proveedor NETHINK B2B</title>
          <style>
            body{font-family:Arial,sans-serif;color:#0f172a;padding:28px}
            .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
            .card{border:1px solid #cbd5e1;border-radius:10px;padding:14px}
            .bar{height:18px;background:#2563eb;margin:6px 0;border-radius:5px}
            pre{white-space:pre-wrap;font-family:Arial,sans-serif}
          </style>
        </head>
        <body>
          <h1>Dashboard proveedor - ${this.providerName}</h1>
          <div class="grid">${this.metrics.map(metric => `<div class="card"><b>${metric.title}</b><h2>${metric.value}</h2><p>${metric.change}</p></div>`).join('')}</div>
          <h2>Historico mensual</h2>
          ${this.historyChart.map(item => `<p>${item.label}: ${item.count} solicitudes / S/ ${item.total.toFixed(2)}</p><div class="bar" style="width:${item.width}%"></div>`).join('')}
          <h2>Estados</h2>
          ${this.statusChart.map(item => `<p>${item.label}: ${item.count}</p><div class="bar" style="width:${item.width}%;background:${item.color}"></div>`).join('')}
          <h2>Analisis IA</h2>
          <pre>${this.insights}</pre>
        </body>
      </html>`;

    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  }

  private generarInsights(requests: any[], claims: any[], estimatedIncome: number): void {
    this.loadingInsights = true;

    this.http.post<any>(`${APP_API_BASE_URL}/assistant/provider-insights`, {
      solicitudes: requests.length,
      aprobadas: requests.filter(request => this.isApproved(request?.estado)).length,
      pendientes: this.countPending(requests),
      rechazadas: this.countRejected(requests),
      reclamosAbiertos: claims.filter(claim => !['RESUELTO', 'RECHAZADO'].includes(String(claim?.estado || '').toUpperCase())).length,
      ingresosEstimados: estimatedIncome,
      apiConectada: this.apiConnected,
      historico: this.historyChart,
      estados: this.statusChart
    }).subscribe({
      next: res => {
        this.insights = res?.analysis || 'No se recibio analisis.';
        this.loadingInsights = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.insights = 'No pude consultar Groq ahora. Reduce reclamos abiertos, responde solicitudes pendientes y actualiza inventario para mejorar ranking.';
        this.loadingInsights = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildMonthlyHistory(requests: any[]): any[] {
    const buckets = new Map<string, { count: number; total: number }>();

    requests.forEach(request => {
      const date = request?.fechaCreacion ? new Date(request.fechaCreacion) : new Date();
      const label = date.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
      const current = buckets.get(label) || { count: 0, total: 0 };
      current.count++;
      current.total += Number(request?.total || 0);
      buckets.set(label, current);
    });

    const max = Math.max(1, ...Array.from(buckets.values()).map(item => item.count));
    return Array.from(buckets.entries()).slice(-6).map(([label, item]) => ({
      label,
      ...item,
      width: Math.max(8, Math.round(item.count / max * 100))
    }));
  }

  private buildStatusChart(requests: any[]): any[] {
    const colors: Record<string, string> = {
      COMPLETADA: '#22c55e',
      ENTREGADA: '#14b8a6',
      CANCELADA: '#ef4444',
      RECHAZADA: '#f97316',
      PAGO_PENDIENTE: '#f59e0b',
      PAGO_VALIDANDO: '#60a5fa'
    };
    const buckets = new Map<string, number>();
    requests.forEach(request => buckets.set(request?.estado || 'SIN_ESTADO', (buckets.get(request?.estado || 'SIN_ESTADO') || 0) + 1));
    const max = Math.max(1, ...Array.from(buckets.values()));
    return Array.from(buckets.entries()).map(([label, count]) => ({
      label,
      count,
      width: Math.max(8, Math.round(count / max * 100)),
      color: colors[label] || '#3b82f6'
    }));
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
