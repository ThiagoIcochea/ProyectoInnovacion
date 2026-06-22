import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-provider-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.scss'
})
export class ProviderReviewsComponent implements OnInit {

  product: any = null;
  selectedProvider: any = null;
  origin: string | null = null;

  idProductoActual: number | null = null;

  requestItems: any[] = [];
  providers: any[] = [];

  qty: number = 1;
  loadingProviders: boolean = true;
  expandedProviderKey: string | null = null;
  productImageFailed = false;

  reviewDrafts: any = {};

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    this.product = state?.['product'] ?? null;
    this.origin = state?.['origen'] ?? state?.['origin'] ?? null;

    this.idProductoActual =
      state?.['idProducto'] ||
      this.product?.idProducto ||
      this.product?.id_producto ||
      null;

    const stateProvider =
      state?.['proveedor'] ?? state?.['provider'] ?? null;

    if (stateProvider) {
      this.selectedProvider = this.normalizarProveedor(stateProvider);
      this.providers = [this.selectedProvider];
      this.loadingProviders = false;
      return;
    }

    const stateProviders = state?.['proveedores'] ?? state?.['providers'];

    if (Array.isArray(stateProviders)) {
      this.setProviderList(this.filterProvidersForProduct(stateProviders));
      this.loadingProviders = false;
    }
  }

  ngOnInit(): void {
    this.cargarCarritoLocal();

    if (!this.product && !this.selectedProvider) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    if (this.selectedProvider) {
      this.cargarIndicadoresProveedor(this.selectedProvider);
      this.cargarComentariosProveedor(this.selectedProvider);
      this.loadingProviders = false;
      return;
    }

    if (this.loadingProviders) {
      this.cargarProveedoresDelProducto();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // =========================
  // CAROUSEL PROVEEDORES
  // =========================

  cargarProveedoresDelProducto(): void {
    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) return;

    this.loadingProviders = true;

    const request = {
      items: [{ idProducto, cantidad: 1 }],
      filtro: { precioMin: null, precioMax: null, marcas: [], categorias: [] },
      prioridad: 'BALANCEADO'
    };

    this.http.post<any>(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        const data =
          Array.isArray(res)
            ? res
            : res?.proveedores ||
              res?.proveedoresSeleccionados ||
              res?.data ||
              [];

        this.setProviderList(data);

        this.providers.forEach(p => {
          this.cargarIndicadoresProveedor(p);
          this.cargarComentariosProveedor(p);
        });

        this.loadingProviders = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.providers = [];
        this.loadingProviders = false;
      }
    });
  }

  // =========================
  // INDICADORES (FIX PRINCIPAL)
  // =========================

  cargarIndicadoresProveedor(provider: any): void {
    const idProveedor =
      provider?.idProveedor ??
      provider?.id_proveedor ??
      provider?.idProvider ??
      provider?.id;

    if (!idProveedor) return;

    this.http.get<any>(
      `${this.API_BASE}/provider/${idProveedor}/indicadores`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {

        provider.pedidosCompletados = res?.pedidosCompletados ?? null;
        provider.pedidosTotal = res?.pedidosTotal ?? null;

        provider.cumplimiento = res?.cumplimiento ?? null;

        // FIX: normalizar satisfacción correctamente (0-1 o 0-100)
        const sat = res?.satisfaccion;
        provider.satisfaccion =
          sat === null || sat === undefined
            ? null
            : sat <= 1
              ? sat * 100
              : sat;

        provider.scoreGeneral = res?.scoreGeneral ?? null;

        provider.tiempoEntregaPromedio = res?.tiempoEntregaPromedio ?? null;
        provider.tiempoRespuestaPromedio = res?.tiempoRespuestaPromedio ?? null;

        provider.fechaRegistro = res?.fechaRegistro ?? provider.fechaRegistro;

        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // =========================
  // COMENTARIOS
  // =========================

  cargarComentariosProveedor(provider: any): void {
    const idProveedor =
      provider?.idProveedor ??
      provider?.id_proveedor ??
      provider?.id;

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProveedor || !idProducto) return;

    this.http.get<any[]>(
      `${this.API_BASE}/comentarios/${idProveedor}/${idProducto}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        provider.comentarios = Array.isArray(res)
          ? res.map(c => this.normalizarComentario(c))
          : [];

        this.recalcularMetricasProveedor(provider);
        this.cdr.detectChanges();
      },
      error: () => {
        provider.comentarios = [];
        this.recalcularMetricasProveedor(provider);
      }
    });
  }

  normalizarComentario(c: any): any {
    return {
      ...c,
      idComentario: c?.idComentario ?? c?.id,
      comentario: c?.comentario ?? '',
      tipo: c?.tipo === 'DISLIKE' ? 'DISLIKE' : 'LIKE',
      likes: Number(c?.likes ?? 0),
      dislikes: Number(c?.dislikes ?? 0),
      userReaction: c?.userReaction ?? null
    };
  }

  recalcularMetricasProveedor(provider: any): void {
    const comentarios = provider?.comentarios || [];

    let likes = 0;
    let dislikes = 0;

    comentarios.forEach((c: any) => {
      likes += this.getReviewLikes(c);
      dislikes += this.getReviewDislikes(c);
    });

    provider.likes = likes;
    provider.dislikes = dislikes;
    provider.totalComentarios = comentarios.length;
  }

  // =========================
  // NORMALIZACIÓN PROVEEDOR
  // =========================

  normalizarProveedor(item: any): any {
    return {
      ...item,

      idProveedor: item?.idProveedor ?? item?.id,

      razonSocial: item?.razonSocial ?? item?.nombre ?? 'Proveedor',

      descripcion: item?.descripcion ?? null,

      categoriaPrincipal: item?.categoriaPrincipal ?? item?.categoria ?? null,

      ubicacion: item?.ubicacion ?? null,

      estado: item?.estado ?? 'ACTIVO',

      satisfaccion: item?.satisfaccion ?? null,
      scoreGeneral: item?.scoreGeneral ?? null,

      likes: Number(item?.likes ?? 0),
      dislikes: Number(item?.dislikes ?? 0),

      comentarios: Array.isArray(item?.comentarios)
        ? item.comentarios
        : []
    };
  }

  private setProviderList(providers: any[]): void {
    this.providers = (providers || []).map(p => this.normalizarProveedor(p));
  }

  private filterProvidersForProduct(providers: any[]): any[] {
    return providers || [];
  }

  // =========================
  // GETTERS (NO CAMBIADOS)
  // =========================

  getProviderName(p: any) {
    return p?.razonSocial || 'Proveedor';
  }

  getProviderSatisfaction(p: any) {
    return p?.satisfaccion ?? 0;
  }

  getProviderScore100(p: any) {
    const s = p?.scoreGeneral;
    if (s == null) return null;
    return s <= 1 ? Math.round(s * 100) : Math.round(s);
  }

  getProviderLikes(p: any) {
    return p?.likes ?? 0;
  }

  getProviderDislikes(p: any) {
    return p?.dislikes ?? 0;
  }

  getReviews(p: any) {
    return p?.comentarios ?? [];
  }

  getReviewLikes(r: any) {
    return Number(r?.likes ?? 0);
  }

  getReviewDislikes(r: any) {
    return Number(r?.dislikes ?? 0);
  }

  getProviderResponse(p: any) {
    return p?.tiempoRespuestaPromedio ?? null;
  }

  // =========================
  // RESTO (NO MODIFICADO)
  // =========================

  cargarCarritoLocal() {
    const saved = localStorage.getItem('rfq_cart');
    if (saved) this.requestItems = JSON.parse(saved);
  }

  irAlCarrito() {
    this.router.navigate(['/app/rfq/catalog']);
  }

  volverAlDetalle() {
    this.router.navigate(['/app/rfq/catalog']);
  }
}