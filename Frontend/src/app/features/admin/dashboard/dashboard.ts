import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

interface AdminUserSummary {
  rol?: string;
  estado?: string;
}

interface AdminProviderSummary {
  estado?: string;
}

interface AdminRfqSummary {
  total?: number | string;
  estado?: string;
  fechaCreacion?: string;
}

interface AdminLogSummary {
  accion?: string;
  modulo?: string;
  descripcion?: string;
  fecha?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {
  metrics = [
    { title: 'Usuarios activos', value: '0', change: 'Cargando datos', type: 'positive' },
    { title: 'Proveedores registrados', value: '0', change: 'Cargando datos', type: 'positive' },
    { title: 'Solicitudes RFQ totales', value: '0', change: 'Cargando datos', type: 'positive' },
    { title: 'Volumen transaccional', value: 'S/ 0.00', change: 'Cargando datos', type: 'positive' }
  ];

  activity: Array<{ title: string; detail: string; status: string }> = [];

  chartBars = [
    { label: 'Ene', height: 8, active: false },
    { label: 'Feb', height: 8, active: false },
    { label: 'Mar', height: 8, active: false },
    { label: 'Abr', height: 8, active: false },
    { label: 'May', height: 8, active: false },
    { label: 'Jun', height: 8, active: false },
    { label: 'Jul', height: 8, active: true }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token) || ''}`
    });
  }

  private cargarDashboard(): void {
    const options = { headers: this.headers() };

    this.http.get<AdminUserSummary[]>(`${APP_API_BASE_URL}/usuarios/admin/listar`, options)
      .pipe(catchError(() => of([])))
      .subscribe(users => {
        const visibleUsers = users.filter(user => user?.rol !== 'ADMIN');
        const activeUsers = visibleUsers.filter(user => (user?.estado || '').toUpperCase() === 'ACTIVO');

        this.updateMetric(0, {
          value: this.formatCount(activeUsers.length || visibleUsers.length),
          change: `${this.formatCount(visibleUsers.length)} usuarios registrados`,
          type: 'positive'
        });
      });

    this.http.get<AdminProviderSummary[]>(`${APP_API_BASE_URL}/provider/admin/listar`, options)
      .pipe(catchError(() => of([])))
      .subscribe(providers => {
        const activeProviders = providers.filter(provider => (provider?.estado || '').toUpperCase() === 'ACTIVO');

        this.updateMetric(1, {
          value: this.formatCount(providers.length),
          change: `${this.formatCount(activeProviders.length)} activos`,
          type: 'positive'
        });
      });

    this.http.get<AdminRfqSummary[]>(`${APP_API_BASE_URL}/solicitudes/admin/listar`, options)
      .pipe(catchError(() => of([])))
      .subscribe(rfqs => {
        const totalAmount = rfqs.reduce((sum, rfq) => sum + Number(rfq?.total || 0), 0);

        this.updateMetric(2, {
          value: this.formatCount(rfqs.length),
          change: `${this.formatCount(this.countOpenRfqs(rfqs))} en curso`,
          type: 'positive'
        });

        this.updateMetric(3, {
          value: this.formatMoney(totalAmount),
          change: 'Calculado desde RFQs registradas',
          type: totalAmount > 0 ? 'positive' : 'negative'
        });

        this.chartBars = this.buildChartBars(rfqs);
        this.cdr.detectChanges();
      });

    this.http.get<AdminLogSummary[]>(`${APP_API_BASE_URL}/logs/admin`, options)
      .pipe(catchError(() => of([])))
      .subscribe(logs => {
        this.activity = this.buildActivity(logs);
        this.cdr.detectChanges();
      });
  }

  private updateMetric(index: number, changes: Partial<{ value: string; change: string; type: string }>): void {
    this.metrics = this.metrics.map((metric, currentIndex) =>
      currentIndex === index
        ? { ...metric, ...changes }
        : metric
    );

      this.cdr.detectChanges();
  }

  private countOpenRfqs(rfqs: AdminRfqSummary[]): number {
    return rfqs.filter(rfq => !['CANCELADA', 'COMPLETADA', 'ENTREGADA'].includes((rfq?.estado || '').toUpperCase())).length;
  }

  private buildActivity(logs: AdminLogSummary[]): Array<{ title: string; detail: string; status: string }> {
    return logs.slice(0, 5).map(log => ({
      title: log?.accion || log?.modulo || 'Actividad del sistema',
      detail: log?.descripcion || this.formatDate(log?.fecha) || 'Registro sin descripcion',
      status: log?.modulo || 'Log'
    }));
  }

  private buildChartBars(rfqs: AdminRfqSummary[]): Array<{ label: string; height: number; active: boolean }> {
    const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'short' });
    const months = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (6 - index));
      return {
        date,
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthFormatter.format(date).replace('.', ''),
        count: 0
      };
    });

    rfqs.forEach(rfq => {
      if (!rfq.fechaCreacion) {
        return;
      }

      const date = new Date(rfq.fechaCreacion);
      const month = months.find(item => item.key === `${date.getFullYear()}-${date.getMonth()}`);

      if (month) {
        month.count++;
      }
    });

    const max = Math.max(...months.map(month => month.count), 1);

    return months.map((month, index) => ({
      label: month.label,
      height: month.count === 0 ? 8 : Math.max(18, Math.round((month.count / max) * 100)),
      active: index === months.length - 1
    }));
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

  private formatDate(date?: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
