import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-provider-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProviderProductsComponent implements OnInit {

  products: any[] = [];

  activos = 0;
  stockDisponibleCount = 0;
  bajoStockCount = 0;

  private API_URL = 'https://proyectoinnovacion.onrender.com/api/proveedor-productos';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarProductos() {

    const correo = localStorage.getItem('correo');

    this.http.get<any[]>(
      `${this.API_URL}/mis-productos?correo=${correo}`,
      { headers: this.headers() }
    )
    .subscribe({

      next: (data) => {
        this.products = data;
        this.calcularResumen();
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error cargando productos:', err);
      }
    });
  }

  calcularResumen() {

    this.activos = 0;
    this.stockDisponibleCount = 0;
    this.bajoStockCount = 0;

    for (let p of this.products) {

      if (p.estado === 'ACTIVO') {
        this.activos++;
      }

      if (p.stockDisponible > 0) {
        this.stockDisponibleCount++;
      }

      if (p.stock < 10) {
        this.bajoStockCount++;
      }
    }
  }
}