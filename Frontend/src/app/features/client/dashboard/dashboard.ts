// Backend touchpoint: client dashboard consumes recommendations, ads and request data.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  recommendedProducts: any[] = [];
  requestItems: any[] = [];
  mostrarCarritoMovil = false;
  loadingRecommended = true;
  loadingPublicidad = true;
  readonly productSkeletons = Array.from({ length: 6 });

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
    if (pub?.enlace) {
      window.open(pub.enlace, '_blank');
    }
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
}
