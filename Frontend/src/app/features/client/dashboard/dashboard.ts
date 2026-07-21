// Backend touchpoint: client dashboard consumes recommendations, ads and request data.
import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { ClienteDashboardResponse } from './cliente-dashboard-response.model';
import { ClienteDashboardService } from './cliente-dashboard.service';
import { Chart, registerables } from 'chart.js';
import html2pdf from 'html2pdf.js';
Chart.register(...registerables);





@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  providers: [
    DecimalPipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  
  



dashboard?: ClienteDashboardResponse;


cargando = false;

error = false;

 

private graficoSolicitudes?: Chart;

private graficoMontoAprobado?: Chart;

private graficoEstados?: Chart;
private graficoProductos?: Chart;



constructor(
 private dashboardService: ClienteDashboardService,
 private decimalPipe: DecimalPipe,
private cdr: ChangeDetectorRef

){}



ngOnInit(): void {

 this.cargarDashboard();

}



ngOnDestroy(): void {

this.graficoMontoAprobado?.destroy();
    this.graficoEstados?.destroy();
    this.graficoProductos?.destroy();
 


}
  
  
 cargarDashboard(): void {

    this.cargando = true;
    this.error = false;

    this.dashboardService.obtenerDashboard()
      .subscribe({

        next: (response: ClienteDashboardResponse) => {

          this.dashboard = response;

          console.log(this.dashboard?.graficoProductosSolicitados);

          console.log(JSON.stringify(response, null, 2));

          this.cargando = false;

          this.cdr.detectChanges();

          this.actualizarGraficos();

        },

        error: (err) => {

          console.error(err);

          this.error = true;
          this.cargando = false;

        }

      });

  } 


private actualizarGraficos(): void {

    this.actualizarGraficoSolicitudes();

    this.actualizarGraficoMonto();

    this.actualizarGraficoEstados();

    this.actualizarGraficoProductos();

  }


private actualizarGraficoSolicitudes(): void {

  if (!this.dashboard?.graficoEvolucionSolicitudes) {
    return;
  }

  const canvas =
    document.getElementById('graficoSolicitudes') as HTMLCanvasElement;

  if (!canvas) {
    setTimeout(() => this.actualizarGraficoSolicitudes(), 50);
    return;
  }

  const labels =
    this.dashboard.graficoEvolucionSolicitudes.map(x => x.mes);

  const valores =
    this.dashboard.graficoEvolucionSolicitudes.map(
      x => x.cantidadSolicitudes
    );

  if (this.graficoSolicitudes) {

    this.graficoSolicitudes.data.labels = labels;

    this.graficoSolicitudes.data.datasets[0].data = valores;

    this.graficoSolicitudes.update();

  } else {

    if (!(canvas instanceof HTMLCanvasElement)) {
  setTimeout(() => this.actualizarGraficoSolicitudes(), 50);
  return;
}
    
    
    this.graficoSolicitudes = new Chart(canvas, {

      type: 'line',

      data: {

        labels,

        datasets: [

          {

            label: 'Solicitudes',

            data: valores,

            borderColor: '#2563eb',

            backgroundColor: 'rgba(37,99,235,0.15)',

            borderWidth: 3,

            tension: 0.3,

            fill: true,

            pointRadius: 5,

            pointHoverRadius: 7

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            display: true
          }

        },

        scales: {

          y: {

            beginAtZero: true,

            ticks: {

              precision: 0

            }

          }

        }

      }

    });

  }

}


private actualizarGraficoMonto(): void {

  if (!this.dashboard?.graficoMontoAprobado) {
    return;
  }

  const canvas = document.getElementById("graficoMonto");

  if (!(canvas instanceof HTMLCanvasElement)) {
    setTimeout(() => this.actualizarGraficoMonto(), 50);
    return;
  }

  const labels =
    this.dashboard.graficoMontoAprobado.map(x => x.mes);

  const valores =
    this.dashboard.graficoMontoAprobado.map(x => x.monto);

  if (this.graficoMontoAprobado) {

    this.graficoMontoAprobado.data.labels = labels;

    this.graficoMontoAprobado.data.datasets[0].data = valores;

    this.graficoMontoAprobado.update();

  } else {

    this.graficoMontoAprobado = new Chart(canvas, {

      type: 'bar',

      data: {

        labels,

        datasets: [

          {

            label: 'Monto aprobado',

            data: valores,

            backgroundColor: "#3b82f6",

            borderColor: "#1d4ed8",

            borderWidth: 1,

            borderRadius: 6

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {

            display: true

          }

        },

        scales: {

          y: {

            beginAtZero: true,

            ticks: {

              callback(value) {

                return "S/ " + value;

              }

            }

          }

        }

      }

    });

  }

}


private actualizarGraficoEstados(): void {

  if (!this.dashboard?.graficoEstadosSolicitudes) {
    return;
  }

  const canvas = document.getElementById("graficoEstados");

  if (!(canvas instanceof HTMLCanvasElement)) {
    setTimeout(() => this.actualizarGraficoEstados(), 50);
    return;
  }

  const labels =
    this.dashboard.graficoEstadosSolicitudes.map(
      x => x.estado
    );

  const valores =
    this.dashboard.graficoEstadosSolicitudes.map(
      x => x.cantidad
    );

  if (this.graficoEstados) {

    this.graficoEstados.data.labels = labels;

    this.graficoEstados.data.datasets[0].data = valores;

    this.graficoEstados.update();

  } else {

    this.graficoEstados = new Chart(canvas, {

      type: 'doughnut',

      data: {

        labels,

        datasets: [

          {

            data: valores,

            backgroundColor: [

              "#2563eb",   // Creada
              "#16a34a",   // Aprobada
              "#dc2626",   // Cancelada
              "#f59e0b",   // Entregada
              "#7c3aed",   // Confirmada
              "#06b6d4"

            ],

            borderWidth: 1

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {

            position: "bottom"

          }

        }

      }

    });

  }

}


private actualizarGraficoProductos(): void {

  if (!this.dashboard?.graficoProductosSolicitados) {
    return;
  }

  const canvas = document.getElementById("graficoProductos");

  if (!(canvas instanceof HTMLCanvasElement)) {
    setTimeout(() => this.actualizarGraficoProductos(), 50);
    return;
  }

  const labels =
    this.dashboard.graficoProductosSolicitados.map(
      x => x.nombreProducto
    );

  const valores =
    this.dashboard.graficoProductosSolicitados.map(
      x => x.cantidadSolicitada
    );

  if (this.graficoProductos) {

    this.graficoProductos.data.labels = labels;

    this.graficoProductos.data.datasets[0].data = valores;

    this.graficoProductos.update();

  } else {

    this.graficoProductos = new Chart(canvas, {

      type: "bar",

      data: {

        labels,

        datasets: [

          {

            label: "Cantidad solicitada",

            data: valores,

            backgroundColor: "#10b981",

            borderColor: "#059669",

            borderWidth: 1,

            borderRadius: 6

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        indexAxis: "y",   // ← barras horizontales

        plugins: {

          legend: {

            display: false

          }

        },

        scales: {

          x: {

            beginAtZero: true,

            ticks: {

              precision: 0

            }

          }

        }

      }

    });

  }

}




















  
  
  
  /*
  recommendedProducts: any[] = [];
  requestItems: any[] = [];
  mostrarCarritoMovil = false;
  loadingRecommended = true;
  loadingPublicidad = true;
  readonly productSkeletons = Array.from({ length: 6 });
  imageLoadFailures: { [key: string]: boolean } = {};

  publicidades: any[] = [];
  currentPublicidadIndex: number = 0;

  prioridad: string = 'BALANCEADO';
  precioMin: number | null = null;
  precioMax: number | null = null;

  private API = APP_API_BASE_URL;
  private intervaloPublicidad: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCarrito();
    this.cargarTodo();
  }

  getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token) || ''}`
      })
    };
  }

  cargarTodo(): void {
    this.cargarRecomendados();
    this.cargarPublicidad();
  }

  cargarRecomendados(): void {

    this.loadingRecommended = true;

    this.http.get<any[]>(
      `${this.API}/recomendados/productos`,
      this.getHeaders()
    ).subscribe({
      next: (data) => {
        this.recommendedProducts = Array.isArray(data) ? data : [];
        this.loadingRecommended = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendedProducts = [];
        this.loadingRecommended = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarPublicidad(): void {

    this.loadingPublicidad = true;

    this.http.get<any[]>(
      `${this.API}/publicidad/activas`,
      this.getHeaders()
    ).subscribe({
      next: (data) => {

        this.publicidades = Array.isArray(data) ? data : [];
        this.currentPublicidadIndex = 0;
        this.loadingPublicidad = false;

        this.cdr.detectChanges();

        if (this.publicidades.length > 0) {
          this.iniciarCarrusel();
        }

      },
      error: () => {
        this.publicidades = [];
        this.loadingPublicidad = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarCarrusel(): void {

    if (this.intervaloPublicidad) {
      clearInterval(this.intervaloPublicidad);
    }

    this.intervaloPublicidad = setInterval(() => {

      if (this.publicidades.length > 1) {

        this.currentPublicidadIndex++;

        if (this.currentPublicidadIndex >= this.publicidades.length) {
          this.currentPublicidadIndex = 0;
        }

        this.cdr.detectChanges();
      }

    }, 20000);
  }

  irPublicidad(pub: any): void {
    if (pub?.idProducto) {
      this.router.navigate(['/app/rfq/product', pub.idProducto]);
      return;
    }

    if (pub?.enlace?.startsWith('/app/')) {
      this.router.navigate([pub.enlace]);
      return;
    }

    if (pub?.enlace) {
      window.open(pub.enlace, '_blank');
    }
  }

  getPublicidadDetalle(pub: any): string {
    if (!pub) {
      return '';
    }

    if (pub.origen === 'PROVEEDOR_PREMIUM') {
      const ventas = Number(pub.unidadesVendidas || 0);
      return `${pub.proveedor} promociona uno de sus productos mas vendidos: ${ventas} unidad${ventas === 1 ? '' : 'es'} vendida${ventas === 1 ? '' : 's'}.`;
    }

    return pub.enlace || pub.proveedor || '';
  }

  cargarCarrito(): void {
    const carrito = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    this.requestItems = carrito ? JSON.parse(carrito) : [];
  }

  guardarCarrito(): void {
    localStorage.setItem(APP_STORAGE_KEYS.rfqCart, JSON.stringify(this.requestItems));
  }

  agregarAlCarrito(product: any): void {

    const existe = this.requestItems.find(
      x => x.idProducto === product.idProducto
    );

    if (existe) {
      existe.qty++;
    } else {
      this.requestItems.push({
        idProducto: product.idProducto,
        name: product.producto,
        qty: 1
      });
    }

    this.guardarCarrito();
    this.cdr.detectChanges();
  }

  verDetalle(product: any): void {
    if (!product?.idProducto) {
      return;
    }

    this.router.navigate(['/app/rfq/product', product.idProducto], {
      state: { product }
    });
  }

  getProductImage(product: any): string | null {
    const productId = product?.idProducto;

    if (productId && this.imageLoadFailures[productId]) {
      return null;
    }

    const image = product?.imagenes?.[0];
    return image?.url || image?.URL || null;
  }

  markImageAsFailed(product: any): void {
    if (product?.idProducto) {
      this.imageLoadFailures[product.idProducto] = true;
      this.cdr.detectChanges();
    }
  }

  getPrimarySpec(product: any): any | null {
    return product?.especificaciones?.find((spec: any) => spec?.nombre || spec?.valor) ?? null;
  }

  formatRecommendedCount(value: any): string {
    const count = Number(value || 0);
    return `${count} pedido${count === 1 ? '' : 's'}`;
  }

  aumentar(item: any): void {
    item.qty++;
    this.guardarCarrito();
  }

  disminuir(item: any): void {
    if (item.qty > 1) {
      item.qty--;
    } else {
      this.eliminar(item);
    }
    this.guardarCarrito();
  }

  eliminar(item: any): void {
    this.requestItems = this.requestItems.filter(
      x => x.idProducto !== item.idProducto
    );
    this.guardarCarrito();
  }

  buscarProveedoresRFQ(): void {

    const request = {
      items: this.requestItems.map(i => ({
        idProducto: i.idProducto,
        cantidad: i.qty
      })),
      filtro: {
        precioMin: this.precioMin,
        precioMax: this.precioMax
      },
      prioridad: this.prioridad
    };

    this.http.post<any>(
      `${this.API}/rfq/buscar-proveedores`,
      request,
      this.getHeaders()
    ).subscribe({

      next: (res) => {
        this.router.navigate(
          ['/app/rfq/results'],
          { state: { proveedores: res } }
        );
      },

      error: () => {
        alert('No se encontraron proveedores compatibles.');
      }

    });
  }
    */
}
