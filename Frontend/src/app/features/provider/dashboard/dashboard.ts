import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProveedorDashboardService } from './dashboard.service';
import { DashboardResponse } from './dashboard-response.model';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { Chart, registerables } from 'chart.js';
import html2pdf from 'html2pdf.js';
Chart.register(...registerables);


@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  providers:[DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
  
  dashboard?: DashboardResponse;

  cargando = false;
  error = false;

private graficoIngresos?: Chart;

  


  constructor(
    private dashboardService: ProveedorDashboardService,
    private decimalPipe: DecimalPipe


  ) { }

  ngOnInit(): void {
    this.cargarDashboard();
  }


ngOnDestroy(): void {
    if (this.graficoIngresos) {
      this.graficoIngresos.destroy();
    }
  }



  cargarDashboard(): void {

    this.cargando = true;
    this.error = false;

    this.dashboardService.getDashboard()
      .subscribe({

        next: (response: DashboardResponse) => {

          this.dashboard = response;
           console.log(
  JSON.stringify(response, null, 2)
);

          this.cargando = false;

          // Aquí luego puedes crear tus gráficos
          //this.crearGraficoIngresos();
          // Si el gráfico no existe, se creará solo cuando el HTML esté listo.
        this.actualizarOGenerarGrafico();

        },

        error: (err) => {

          console.error(err);

          this.error = true;
          this.cargando = false;

        }

      });
    
    }



private actualizarOGenerarGrafico(): void {
    if (!this.dashboard?.graficoIngresos) return;

    const canvas = document.getElementById('graficoIngresos') as HTMLCanvasElement;
    
    // Si el usuario acaba de cargar la página, reintentamos en el siguiente ciclo del event loop nativo
    /*if (!canvas) {
      queueMicrotask(() => this.actualizarOGenerarGrafico()); // 👈 Alternativa limpia a setTimeout
      return;
    }*/

    if (!canvas) {
      setTimeout(() => this.actualizarOGenerarGrafico(), 50); // 👈 Reemplaza queueMicrotask por esto
      return;
    }

    const labels = this.dashboard.graficoIngresos.map(x => x.mes);
    const valores = this.dashboard.graficoIngresos.map(x => x.ingresos);

    if (this.graficoIngresos) {
      // 👈 REUTILIZACIÓN DE MEMORIA: En lugar de destruir y recrear, solo actualizamos los datos
      this.graficoIngresos.data.labels = labels;
      this.graficoIngresos.data.datasets[0].data = valores;
      this.graficoIngresos.update();
    } else {
      // Creación inicial limpia
      this.graficoIngresos = new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Ingresos",
            data: valores,
            borderColor: "#ff9f1c",
            backgroundColor: "rgba(255, 159, 28, 0.05)",
            borderWidth: 3,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }


exportarInforme(): void {
    if (!this.dashboard) return;

    // Obtener la fecha y hora de emisión del reporte en formato local
    const fechaEmision = new Date().toLocaleDateString('es-PE', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const nombreProveedor = this.dashboard.nombreProveedor || 'PROVEEDOR PLATAFORMA';
    const totalMesActual = this.decimalPipe.transform(this.dashboard.ingresosMesActual, '1.2-2') || '0.00';

    // Compilación dinámica del listado histórico mensual
    const filasHistorico = this.dashboard.graficoIngresos.map(item => `
      <tr style="border-bottom: 1px solid #f2f2f2;">
        <td style="padding: 10px; color: #444; font-size: 13px;">${item.mes}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #2ec4b6; font-size: 13px;">
          S/ ${this.decimalPipe.transform(item.ingresos, '1.2-2')}
        </td>
      </tr>
    `).join('');

    // Compilación dinámica del top 5 de productos comercializados
    const filasProductos = this.dashboard.productosMasVendidos.map((prod, index) => `
      <tr style="border-bottom: 1px solid #f2f2f2;">
        <td style="padding: 10px; color: #ff9f1c; font-weight: bold; font-size: 13px; width: 50px;">#0${index + 1}</td>
        <td style="padding: 10px; color: #444; font-size: 13px; text-transform: capitalize;">${prod.nombreProducto}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #555; font-size: 13px;">
          ${this.decimalPipe.transform(prod.cantidadVendida, '1.0-0')} u.
        </td>
      </tr>
    `).join('');

    // Estructura HTML corporativa adaptada a formato de hoja A4 de impresión
    const cuerpoDocumento = `
      <div style="padding: 45px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #333; background: #ffffff;">
        
        <!-- Bloque de Cabecera (Logo/Título/Metadatos) -->
        <table style="width: 100%; border-bottom: 2px solid #ff9f1c; padding-bottom: 20px; margin-bottom: 25px;">
          <tr>
            <td>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ff9f1c; letter-spacing: 1.5px;">Sistema B2B Comercial</span>
              <h1 style="margin: 4px 0 0 0; font-size: 24px; color: #222; font-weight: 700;">Informe de Rendimiento Operativo</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">Reporte analítico mensual consolidado del proveedor.</p>
            </td>
            <td style="text-align: right; vertical-align: bottom;">
              <p style="margin: 0; font-size: 12px; color: #333;"><strong>ID Reporte:</strong> RPT-${Math.floor(100000 + Math.random() * 900000)}</p>
              <p style="margin: 3px 0 0 0; font-size: 11px; color: #777;">${fechaEmision}</p>
            </td>
          </tr>
        </table>

        <!-- Datos del Proveedor Firmante -->
        <div style="background: #fafafa; border: 1px solid #eef0f2; border-radius: 6px; padding: 12px 18px; margin-bottom: 30px; font-size: 13px; color: #555;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Razón Social / Aliado:</strong> ${nombreProveedor}</td>
              <td style="text-align: right;"><strong>Moneda Base:</strong> Soles Peruanos (S/)</td>
            </tr>
          </table>
        </div>

        <!-- Fila de Tarjetas Ejecutivas de KPIs -->
        <h3 style="font-size: 13px; text-transform: uppercase; color: #777; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600;">Resumen del Mes Comercial</h3>
        <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px; margin-right: -12px; margin-bottom: 35px;">
          <tr>
            <td style="background: #ffffff; border: 1px solid #e3e6ea; border-top: 4px solid #444444; border-radius: 4px; padding: 16px; text-align: center; width: 33%;">
              <span style="font-size: 11px; color: #777; text-transform: uppercase; display: block; margin-bottom: 6px; font-weight: 600;">Solicitudes Ingresadas</span>
              <strong style="font-size: 22px; color: #222; display: block; margin-bottom: 2px;">${this.dashboard.solicitudesMesActual}</strong>
              <span style="font-size: 11px; color: ${this.dashboard.porcentajeSolicitudes >= 0 ? '#2ec4b6' : '#ff4d4d'}; font-weight: bold;">
                ${this.dashboard.porcentajeSolicitudes >= 0 ? '▲' : '▼'} ${this.dashboard.porcentajeSolicitudes}% var.
              </span>
            </td>
            <td style="background: #ffffff; border: 1px solid #e3e6ea; border-top: 4px solid #ff9f1c; border-radius: 4px; padding: 16px; text-align: center; width: 33%;">
              <span style="font-size: 11px; color: #777; text-transform: uppercase; display: block; margin-bottom: 6px; font-weight: 600;">Ingresos Totales</span>
              <strong style="font-size: 22px; color: #222; display: block; margin-bottom: 2px;">S/ ${totalMesActual}</strong>
              <span style="font-size: 11px; color: ${this.dashboard.porcentajeIngresos >= 0 ? '#2ec4b6' : '#ff4d4d'}; font-weight: bold;">
                ${this.dashboard.porcentajeIngresos >= 0 ? '▲' : '▼'} ${this.dashboard.porcentajeIngresos}% var.
              </span>
            </td>
            <td style="background: #ffffff; border: 1px solid #e3e6ea; border-top: 4px solid #2ec4b6; border-radius: 4px; padding: 16px; text-align: center; width: 33%;">
              <span style="font-size: 11px; color: #777; text-transform: uppercase; display: block; margin-bottom: 6px; font-weight: 600;">Tasa de Aprobación</span>
              <strong style="font-size: 22px; color: #222; display: block; margin-bottom: 2px;">${this.dashboard.solicitudesAprobadasMesActual}</strong>
              <span style="font-size: 11px; color: #2ec4b6; font-weight: bold;">
                ✔ ${this.dashboard.porcentajeSolicitudesAprobadas}% efectividad
              </span>
            </td>
          </tr>
        </table>

        <!-- Tablas de Datos en Columnas Paralelas (Diseño de Cierre de Página) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <tr>
            <!-- Columna Izquierda: Historial de Ingresos -->
            <td style="width: 48%; vertical-align: top; padding-right: 15px;"> 
<h3 style="font-size: 13px; text-transform: uppercase; color: #777; letter-spacing: 1px; margin-bottom: 12px; margin-top:0; font-weight: 600;">Historial Cronológico</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa; border-bottom: 2px solid #e3e6ea; text-align: left;">
                    <th style="padding: 10px; font-size: 12px; color: #555; font-weight: 600;">Periodo / Mes</th>
                    <th style="padding: 10px; font-size: 12px; color: #555; font-weight: 600; text-align: right;">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasHistorico}
                </tbody>
              </table>
            </td>
            <!-- Columna Derecha: Productos Más Vendidos -->
            <td style="width: 48%; vertical-align: top; padding-left: 15px;">
              <h3 style="font-size: 13px; text-transform: uppercase; color: #777; letter-spacing: 1px; margin-bottom: 12px; margin-top:0; font-weight: 600;">Top Artículos Alta Rotación</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f9fa; border-bottom: 2px solid #e3e6ea; text-align: left;">
                    <th style="padding: 10px; font-size: 12px; color: #555; font-weight: 600;">Top</th>
                    <th style="padding: 10px; font-size: 12px; color: #555; font-weight: 600;">Descripción</th>
                    <th style="padding: 10px; font-size: 12px; color: #555; font-weight: 600; text-align: right;">Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasProductos}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <div style="margin-top: 50px; border-top: 1px dashed #ced4da; padding-top: 15px; font-size: 10px; color: #888; text-align: center; line-height: 1.5;">
          <p style="margin: 0;">Este documento constituye un balance oficial automatizado expedido por los servicios logísticos internos B2B.</p>
          <p style="margin: 2px 0 0 0;">© 2026 Plataforma de Abastecimiento Corporativo B2B. Información Confidencial.</p>
        </div>

      </div>
    `;

    // Parámetros técnicos rígidos para forzar el PDF a una hoja limpia A4
    const parametrosConfig = {
      margin: 0,
      filename: `Informe_Dashboard_${nombreProveedor.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // Disparar renderizado del buffer en memoria y descargar
    html2pdf().from(cuerpoDocumento).set(parametrosConfig).save();
  }






















  


   /*private crearGraficoIngresos():void{



    if (!this.dashboard) {
        return;
    }

    const labels =
        this.dashboard.graficoIngresos.map(
            x => x.mes
        );

    const valores =
        this.dashboard.graficoIngresos.map(
            x => x.ingresos
        );

    if (this.graficoIngresos) {
        this.graficoIngresos.destroy();
    }

    this.graficoIngresos = new Chart("graficoIngresos", {

        type: "line",

        data: {

            labels,

            datasets: [

                {

                    label: "Ingresos",

                    data: valores,

                    borderWidth: 3,

                    tension: 0.3,

                    fill: false

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}*/
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  /*
  
  
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
  insightItems: string[] = [];
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
      moneda: 'PEN',
      contexto: 'Peru',
      formatoEsperado: 'exactamente 5 ideas clave y criticas a mejorar en lista numerada',
      apiConectada: this.apiConnected,
      historico: this.historyChart,
      estados: this.statusChart
    }).subscribe({
      next: res => {
        this.insights = res?.analysis || 'No se recibio analisis.';
        this.insightItems = this.parseInsightItems(this.insights);
        this.loadingInsights = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.insights = [
          'Pagos por validar: reduce los estados PAGO_VALIDANDO con revisiones diarias.',
          'Solicitudes pendientes: responde RFQ dentro de un SLA operativo.',
          'API del proveedor: conecta stock, precios y estados sin reprocesos manuales.',
          'Reclamos abiertos: cierra casos con evidencia y resolucion.',
          'Ingresos en soles: prioriza solicitudes de mayor valor estimado en S/.'
        ].join('\n');
        this.insightItems = this.parseInsightItems(this.insights);
        this.loadingInsights = false;
        this.cdr.detectChanges();
      }
    });
  }  */
/*
  private parseInsightItems(value: string): string[] {
    const cleaned = String(value || '')
      .replace(/\r/g, '\n')
      .replace(/\*\*(Diagnostico breve|Diagnóstico breve|Riesgos operativos|Tres acciones priorizadas)\*\*//*gi, '\n')*/
     /* .replace(/\bUSD\b|\bdolares\b|\bdólares\b|k\s*USD/gi, 'S/')
      .replace(/\bsoles peruanos\b/gi, 'soles');

    const items = cleaned
      .split(/\n+|(?=\s*\d+[\).\s-]+\s*)/)
      .map(item => item.replace(/^\s*\d+[\).\-\s]+/, '').replace(/\*\*//*g, '').trim())
     /* .filter(Boolean)
      .slice(0, 5);

    if (items.length >= 5) {
      return items;
    }

    const fallback = [
      'Pagos por validar: reduce estados PAGO_VALIDANDO con responsables diarios y evidencia de pago.',
      'Solicitudes pendientes: responde RFQ dentro de un SLA corto para evitar cancelaciones.',
      'API del proveedor: integra stock, precios y estados para disminuir reprocesos manuales.',
      'Reclamos abiertos: prioriza cierres con sustento para proteger ranking y confianza.',
      'Ingresos en soles: enfoca aprobaciones de mayor valor y mide oportunidades en S/.'
    ];

    return [...items, ...fallback].slice(0, 5);
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
*/

}

