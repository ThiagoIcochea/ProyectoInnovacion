import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-provider-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.scss'
})
export class ProviderReviewsComponent implements OnInit {

  product: any = null;
  requestItems: any[] = [];
  providers: any[] = [];
  qty: number = 1;
  loadingProviders: boolean = true;
  expandedProviderKey: string | null = null;
  productImageFailed = false;

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    this.product = state?.['product'] ?? null;

    const stateProviders = state?.['proveedores'] ?? state?.['providers'];
    if (Array.isArray(stateProviders)) {
      this.providers = this.filterProvidersForProduct(stateProviders);
      this.expandedProviderKey = this.providers.length ? this.getProviderKey(this.providers[0], 0) : null;
      this.loadingProviders = false;
    }
  }

  ngOnInit(): void {
    this.cargarCarritoLocal();

    if (!this.product) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    if (this.loadingProviders) {
      this.cargarProveedoresDelProducto();
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

  cargarProveedoresDelProducto(): void {
    this.loadingProviders = true;

    const providersFromProduct = this.getProvidersFromProduct();
    if (providersFromProduct.length > 0) {
      this.providers = providersFromProduct;
      this.expandedProviderKey = this.getProviderKey(this.providers[0], 0);
      this.loadingProviders = false;
      this.cdr.detectChanges();
      return;
    }

    const request = {
      items: [
        {
          idProducto: this.product.idProducto,
          cantidad: 1
        }
      ],
      filtro: {
        precioMin: null,
        precioMax: null,
        marcas: [],
        categorias: []
      },
      prioridad: 'BALANCEADO'
    };

    this.http.post<any[]>(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.providers = Array.isArray(res) ? res : [];
        this.expandedProviderKey = this.providers.length ? this.getProviderKey(this.providers[0], 0) : null;
        this.loadingProviders = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores del producto', err);
        this.providers = [];
        this.loadingProviders = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getProvidersFromProduct(): any[] {
    const possibleLists = [
      this.product?.proveedores,
      this.product?.providers,
      this.product?.proveedoresAsociados,
      this.product?.proveedoresDisponibles
    ];

    const firstList = possibleLists.find(Array.isArray);
    return firstList ? [...firstList] : [];
  }

  private filterProvidersForProduct(providers: any[]): any[] {
    if (!this.product?.idProducto) return providers;

    return providers.filter(provider => {
      const items = provider?.items;
      if (!Array.isArray(items) || items.length === 0) return true;
      return items.some((item: any) => item?.idProducto === this.product.idProducto);
    });
  }

  getProductImage(): string | null {
    if (this.productImageFailed) return null;
    const image = this.product?.imagenes?.[0];
    return image?.URL || image?.url || null;
  }

  markProductImageFailed(): void {
    this.productImageFailed = true;
  }

  getProviderKey(provider: any, index: number): string {
    return String(provider?.idProveedor ?? provider?.idProvider ?? provider?.id ?? index);
  }

  toggleProvider(provider: any, index: number): void {
    const key = this.getProviderKey(provider, index);
    this.expandedProviderKey = this.expandedProviderKey === key ? null : key;
  }

  isProviderExpanded(provider: any, index: number): boolean {
    return this.expandedProviderKey === this.getProviderKey(provider, index);
  }

  getProviderName(provider: any): string {
    return provider?.razonSocial
      || provider?.nombreProveedor
      || provider?.nombre
      || provider?.empresa
      || 'Proveedor sin nombre';
  }

  getProviderDelivery(provider: any): number | null {
    return this.firstNumber(provider, ['tiempoEntregaPromedio', 'tiempoEntregaDias', 'tiempoEntrega']);
  }

  getProviderScore(provider: any): number | null {
    return this.firstNumber(provider, ['scoreFinal', 'scoringGeneral', 'score']);
  }

  getProviderStatus(provider: any): string | null {
    if (provider?.estado) return provider.estado;
    if (provider?.verificado === true || provider?.verified === true) return 'Verificado';
    if (provider?.verificado === false || provider?.verified === false) return 'No verificado';
    return null;
  }

  getReviews(provider: any): any[] {
    const reviews = provider?.reviews
      ?? provider?.resenas
      ?? provider?.['rese\u00f1as']
      ?? provider?.evaluaciones
      ?? provider?.comentarios
      ?? [];

    return Array.isArray(reviews) ? reviews : [];
  }

  getRatingPromedio(provider: any): number | null {
    const directRating = this.firstNumber(provider, [
      'ratingPromedio',
      'promedioRating',
      'calificacionPromedio',
      'rating',
      'calificacion'
    ]);

    if (directRating !== null) return directRating;

    const reviewRatings = this.getReviews(provider)
      .map(review => this.getReviewRating(review))
      .filter((rating): rating is number => rating !== null);

    if (!reviewRatings.length) return null;

    const total = reviewRatings.reduce((sum, rating) => sum + rating, 0);
    return total / reviewRatings.length;
  }

  getReviewCount(provider: any): number {
    const directCount = this.firstNumber(provider, [
      'cantidadResenas',
      'cantidadReviews',
      'totalResenas',
      'totalReviews',
      'numeroResenas'
    ]);

    return directCount !== null ? directCount : this.getReviews(provider).length;
  }

  getReputationSummary(provider: any): string {
    const rating = this.getRatingPromedio(provider);
    const reviews = this.getReviewCount(provider);
    const score = this.getProviderScore(provider);

    if (rating !== null && reviews > 0) {
      return `${rating.toFixed(1)} / 5 segun ${reviews} resena${reviews === 1 ? '' : 's'}`;
    }

    if (score !== null) {
      return `Scoring RFQ ${score.toFixed(1)} / 5`;
    }

    return 'Reputacion pendiente';
  }

  getReviewRating(review: any): number | null {
    return this.firstNumber(review, ['rating', 'calificacion', 'puntaje', 'score']);
  }

  getReviewAuthor(review: any): string {
    return review?.autor || review?.usuario || review?.cliente || review?.nombreCliente || 'Cliente';
  }

  getReviewComment(review: any): string {
    return review?.comentario || review?.comment || review?.descripcion || review?.texto || '';
  }

  getReviewDate(review: any): string {
    return review?.fecha || review?.createdAt || review?.fechaCreacion || '';
  }

  private firstNumber(source: any, keys: string[]): number | null {
    for (const key of keys) {
      const parsed = this.toNumber(source?.[key]);
      if (parsed !== null) return parsed;
    }

    return null;
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  starArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  formatFecha(value: string): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get yaEnCarrito(): boolean {
    return this.requestItems.some(x => x.idProducto === this.product?.idProducto);
  }

  aumentarQty(): void { this.qty++; }
  disminuirQty(): void { if (this.qty > 1) this.qty--; }

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

  volverAlDetalle(): void {
    this.router.navigate(['/app/rfq/product', this.product?.idProducto], {
      state: { product: this.product }
    });
  }
}
