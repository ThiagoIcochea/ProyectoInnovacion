import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetailComponent implements OnInit {

  product: any = null;
  requestItems: any[] = [];
  selectedImageIndex: number = 0;
  qty: number = 1;
  activeTab: 'specs' | 'discounts' | 'delivery' = 'specs';
  loading: boolean = true;
  imageZoomed: boolean = false;

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCarritoLocal();

    // El producto puede venir por state (navegación desde catálogo)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state?.['product']
      ?? history.state?.['product'];

    if (state) {
      this.product = state;
      this.loading = false;
      this.cdr.detectChanges();
    } else {
      // Fallback: cargar por ID desde la ruta
      const id = this.route.snapshot.paramMap.get('id');
      if (id) this.cargarProductoPorId(Number(id));
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {
    const saved = localStorage.getItem('rfq_cart');
    if (saved) this.requestItems = JSON.parse(saved);
  }

  guardarCarritoLocal(): void {
    localStorage.setItem('rfq_cart', JSON.stringify(this.requestItems));
  }

  // Carga el producto filtrando por ID cuando no viene por state
  cargarProductoPorId(id: number): void {
    this.loading = true;
    this.http.post<any[]>(
      `${this.API_BASE}/productos/catalogo/filtrado`,
      { categorias: null, marcas: null, especificaciones: [] },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.product = res.find(p => p.idProducto === id) ?? null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Galería ────────────────────────────────────────────────
  get imagenes(): string[] {
    const imgs = this.product?.imagenes ?? [];
    if (imgs.length === 0) return ['assets/no-image.png'];
    return imgs.map((i: any) => i.URL ?? i.url ?? 'assets/no-image.png');
  }

  get imagenActiva(): string {
    return this.imagenes[this.selectedImageIndex] ?? 'assets/no-image.png';
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  toggleZoom(): void {
    this.imageZoomed = !this.imageZoomed;
  }

  // ── Tabs ───────────────────────────────────────────────────
  setTab(tab: 'specs' | 'discounts' | 'delivery'): void {
    this.activeTab = tab;
  }

  // ── Cantidad ───────────────────────────────────────────────
  aumentarQty(): void { this.qty++; }
  disminuirQty(): void { if (this.qty > 1) this.qty--; }

  // ── Carrito ────────────────────────────────────────────────
  get yaEnCarrito(): boolean {
    return this.requestItems.some(x => x.idProducto === this.product?.idProducto);
  }

  agregarAlCarrito(): void {
    if (!this.product) return;
    const existe = this.requestItems.find(x => x.idProducto === this.product.idProducto);
    if (!existe) {
      this.requestItems.push({
        idProducto: this.product.idProducto,
        name: this.product.producto,
        detail: `${this.product.marca} • ${this.product.descripcion?.substring(0, 30)}...`,
        qty: this.qty,
        precioReferencia: this.product.precioUnitario ?? null,
        categoria: this.product.categoria,
        marca: this.product.marca
      });
    } else {
      existe.qty += this.qty;
    }
    this.guardarCarritoLocal();
    this.cdr.detectChanges();
  }

  irAlCarrito(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }

  // ── Helpers de display ─────────────────────────────────────
  get stockLabel(): string {
    const s = this.product?.stock ?? 0;
    if (s > 50) return 'Stock Alto';
    if (s > 10) return 'Stock Disponible';
    if (s > 0)  return 'Stock Limitado';
    return 'Sin Stock';
  }

  get stockClass(): string {
    const s = this.product?.stock ?? 0;
    if (s > 50) return 'stock-high';
    if (s > 10) return 'stock-mid';
    if (s > 0)  return 'stock-low';
    return 'stock-none';
  }

  get precioConDescuento(): number | null {
    const p = this.product;
    if (!p?.precioUnitario) return null;
    if (p.enOferta && p.porcentajeDescuento) {
      return p.precioUnitario * (1 - p.porcentajeDescuento / 100);
    }
    return p.precioUnitario;
  }

  get totalEstimado(): number {
    return (this.precioConDescuento ?? this.product?.precioUnitario ?? 0) * this.qty;
  }

  // Navega a provider-reviews pasando el producto como state
  verResenasProveedores(): void {
    this.router.navigate(['/app/rfq/provider-reviews'], {
      state: { product: this.product }
    });
  }

  volver(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }
}