import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { extractValidationMessage } from '../../../core/utils/form-validation';

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
  categorias: Array<{idCategoria:number; nombre:string}> = [];
  marcas: Array<{idMarca:number; nombre:string}> = [];

  private API_URL = `${APP_API_BASE_URL}/proveedor-productos`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCatalogoBase();
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

  private cargarCatalogoBase(): void {
    this.http.get<any[]>(`${APP_API_BASE_URL}/catalogo/categorias`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.categorias = [];
      }
    });

    this.http.get<any[]>(`${APP_API_BASE_URL}/catalogo/marcas`, { headers: this.headers() }).subscribe({
      next: (data) => {
        this.marcas = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.marcas = [];
      }
    });
  }

  cerrarNuevoProducto(): void {
    if (!this.saving) this.showCreateModal = false;
  }

  async crearProducto(): Promise<void> {
    this.createError = '';
    const validationError = this.validarProducto();
    if (validationError) {
      this.createError = validationError;
      await Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: validationError });
      return;
    }

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
      next: async () => {
        this.showCreateModal = false;
        this.saving = false;
        await Swal.fire({ icon: 'success', title: 'Producto creado', text: 'El producto se publicó correctamente.' });
        this.cargarProductos();
      },
      error: async error => {
        const mensaje = extractValidationMessage(error, 'No se pudo crear el producto.');
        this.createError = mensaje;
        this.saving = false;
        await Swal.fire({ icon: 'error', title: 'No se pudo crear el producto', text: mensaje });
      }
    });
  }

  private validarProducto(): string | null {
    const producto = String(this.newProduct.producto || '').trim();
    const marca = String(this.newProduct.marca || '').trim();
    const categoria = String(this.newProduct.categoria || '').trim();
    const precio = Number(this.newProduct.precioUnitario);
    const stock = Number(this.newProduct.stock);
    const descuento = Number(this.newProduct.porcentajeDescuento || 0);

    if (!producto) return 'Debe indicar el nombre del producto.';
    if (!marca) return 'Debe seleccionar una marca válida.';
    if (!categoria) return 'Debe seleccionar una categoría válida.';
    if (!Number.isFinite(precio) || precio < 0) return 'El precio unitario debe ser un número mayor o igual a cero.';
    if (!Number.isFinite(stock) || stock < 0) return 'El stock debe ser un número mayor o igual a cero.';
    if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) return 'El descuento debe estar entre 0 y 100.';
    return null;
  }

  private emptyProduct() {
    return { sku: '', producto: '', marca: '', categoria: '', descripcion: '', precioUnitario: null as number | null,
      stock: null as number | null, garantiaMeses: 0, tiempoEntregaDias: 0, enOferta: false, porcentajeDescuento: 0 };
  }
}
