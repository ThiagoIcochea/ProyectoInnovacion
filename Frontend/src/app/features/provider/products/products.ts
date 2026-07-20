import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-provider-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProviderProductsComponent implements OnInit {

  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  readonly skeletonRows = Array.from({ length: 5 });

  search = '';

  activos = 0;
  stockDisponibleCount = 0;
  bajoStockCount = 0;
  showCreateModal = false;
  saving = false;
  createError = '';
  newProduct = this.emptyProduct();

  private API_URL = `${APP_API_BASE_URL}/proveedor-productos`;

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

    this.loading = true;

    this.http.get<any[]>(
      `${this.API_URL}/mis-productos`,
      { headers: this.headers() }
    )
    .subscribe({

      next: (data) => {

        this.products = data;
        this.filteredProducts = data;

        this.calcularResumenFiltrado();
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error cargando productos:', err);
        this.products = [];
        this.filteredProducts = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarProductos() {

    const texto = this.search.toLowerCase();

    this.filteredProducts = this.products.filter(p =>

      p.skuGlobal?.toLowerCase().includes(texto) ||
      p.nombre?.toLowerCase().includes(texto) ||
      p.categoria?.toLowerCase().includes(texto)

    );

    this.calcularResumenFiltrado();
  }

  calcularResumenFiltrado() {

    this.activos = 0;
    this.stockDisponibleCount = 0;
    this.bajoStockCount = 0;

    for (let p of this.filteredProducts) {

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

  abrirNuevoProducto(): void {
    this.newProduct = this.emptyProduct();
    this.createError = '';
    this.showCreateModal = true;
  }

  cerrarNuevoProducto(): void {
    if (!this.saving) this.showCreateModal = false;
  }

  crearProducto(): void {
    this.createError = '';
    this.saving = true;
    const payload = {
      sku: this.newProduct.sku || null,
      producto: this.newProduct.producto,
      marca: this.newProduct.marca,
      categoria: this.newProduct.categoria,
      descripcion: this.newProduct.descripcion || null,
      precioUnitario: Number(this.newProduct.precioUnitario),
      stock: Number(this.newProduct.stock),
      garantiaMeses: Number(this.newProduct.garantiaMeses || 0),
      tiempoEntregaDias: Number(this.newProduct.tiempoEntregaDias || 0),
      enOferta: this.newProduct.enOferta,
      porcentajeDescuento: Number(this.newProduct.porcentajeDescuento || 0),
      estado: 'ACTIVO',
      imagenes: [], especificaciones: [], descuentosVolumen: []
    };
    this.http.post<any>(`${this.API_URL}/mis-productos`, payload, { headers: this.headers() }).subscribe({
      next: () => { this.showCreateModal = false; this.saving = false; this.cargarProductos(); },
      error: error => { this.createError = error?.error?.message || 'No se pudo crear el producto.'; this.saving = false; }
    });
  }

  private emptyProduct() {
    return { sku: '', producto: '', marca: '', categoria: '', descripcion: '', precioUnitario: null as number | null,
      stock: null as number | null, garantiaMeses: 0, tiempoEntregaDias: 0, enOferta: false, porcentajeDescuento: 0 };
  }
}
