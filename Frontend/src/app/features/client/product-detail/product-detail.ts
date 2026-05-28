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
  activeTab: 'specs' | 'delivery' | 'providers' = 'specs';
  loading: boolean = true;
  imageZoomed: boolean = false;
  imageLoadFailures: { [key: string]: boolean } = {};

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
    return imgs
      .map((i: any) => i.URL ?? i.url)
      .filter((url: string | null | undefined): url is string => !!url && !this.imageLoadFailures[url]);
  }

  get imagenActiva(): string | null {
    return this.imagenes[this.selectedImageIndex] ?? this.imagenes[0] ?? null;
  }

  handleImageError(url: string | null): void {
    if (!url) return;
    this.imageLoadFailures[url] = true;
    this.selectedImageIndex = 0;
    this.cdr.detectChanges();
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  toggleZoom(): void {
    this.imageZoomed = !this.imageZoomed;
  }

  // ── Tabs ───────────────────────────────────────────────────
  setTab(tab: 'specs' | 'delivery' | 'providers'): void {
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
        detail: `${this.product.marca} - ${this.product.descripcion?.substring(0, 30)}...`,
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
  // Navega a provider-reviews pasando el producto como state
  verResenasProveedores(): void {
  const idProducto = this.product?.idProducto || this.product?.id_producto;

  if (!idProducto) {
    console.error('No se encontró idProducto para cargar proveedores y reseñas.');
    return;
  }

  this.router.navigate(['/app/rfq/provider-reviews'], {
    state: {
      product: this.product,
      idProducto,
      origen: 'PRODUCT_DETAIL'
    }
  });
}

  volver(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }
}
