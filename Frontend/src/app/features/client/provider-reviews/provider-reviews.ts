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

  qty = 1;
  loadingProviders = true;
  productImageFailed = false;

  reviewDrafts: any = {};

  private API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {

    const state = this.router.getCurrentNavigation()?.extras?.state ?? history.state;

    this.product = state?.product ?? null;
    this.origin = state?.origen ?? state?.origin ?? null;

    this.idProductoActual =
      state?.idProducto ||
      this.product?.idProducto ||
      this.product?.id_producto ||
      null;

    const provider = state?.proveedor ?? state?.provider ?? null;

    if (provider) {
      this.selectedProvider = this.normalizarProveedor(provider);
      this.providers = [this.selectedProvider];
      this.loadingProviders = false;
      return;
    }

    const providers = state?.proveedores ?? state?.providers;

    if (Array.isArray(providers)) {
      this.providers = providers.map(p => this.normalizarProveedor(p));
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
      return;
    }

    this.cargarProveedoresDelProducto();
  }

  // =========================
  // HTTP
  // =========================
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });
  }

  // =========================
  // NORMALIZACIÓN
  // =========================
  private normPct(v: any): number {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return n <= 1 ? Math.round(n * 100) : Math.round(n);
  }

  normalizarProveedor(p: any): any {
    return {
      ...p,
      idProveedor: p?.idProveedor ?? p?.id_proveedor ?? p?.id ?? null,
      comentarios: Array.isArray(p?.comentarios) ? p.comentarios : [],
      likes: Number(p?.likes ?? 0),
      dislikes: Number(p?.dislikes ?? 0),
      satisfaccion: this.normPct(p?.satisfaccion),
      cumplimiento: this.normPct(p?.cumplimiento),
      scoreGeneral: this.normPct(p?.scoreGeneral)
    };
  }

  // =========================
  // PROVEEDORES
  // =========================
  cargarProveedoresDelProducto(): void {

    if (!this.product) return;

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) return;

    this.loadingProviders = true;

    const body = {
      items: [{ idProducto, cantidad: 1 }],
      filtro: { precioMin: null, precioMax: null, marcas: [], categorias: [] },
      prioridad: 'BALANCEADO'
    };

    this.http.post<any>(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      body,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {

        const raw =
          Array.isArray(res)
            ? res
            : res?.proveedores ?? res?.data ?? [];

        this.providers = raw.map((p: any) => this.normalizarProveedor(p));

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
  // INDICADORES
  // =========================
  cargarIndicadoresProveedor(provider: any): void {

    const id =
      provider?.idProveedor ?? provider?.id_proveedor ?? provider?.id;

    if (!id) return;

    this.http.get<any>(
      `${this.API_BASE}/provider/${id}/indicadores`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {

        provider.pedidosCompletados = res?.pedidosCompletados ?? 0;
        provider.pedidosTotal = res?.pedidosTotal ?? 0;

        provider.cumplimiento = this.normPct(res?.cumplimiento);
        provider.satisfaccion = this.normPct(res?.satisfaccion);
        provider.scoreGeneral = this.normPct(res?.scoreGeneral);

        provider.tiempoEntregaPromedio = res?.tiempoEntregaPromedio ?? 0;

        this.cdr.detectChanges();
      }
    });
  }

  // =========================
  // COMENTARIOS
  // =========================
  cargarComentariosProveedor(provider: any): void {

    const idProveedor = provider?.idProveedor;
    const idProducto = this.idProductoActual || this.product?.idProducto;

    if (!idProveedor || !idProducto) return;

    this.http.get<any[]>(
      `${this.API_BASE}/comentarios/${idProveedor}/${idProducto}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {

        provider.comentarios = (res || []).map(c => ({
          ...c,
          likes: Number(c?.likes ?? 0),
          dislikes: Number(c?.dislikes ?? 0)
        }));

        this.recalcularMetricasProveedor(provider);
        this.cdr.detectChanges();
      },
      error: () => {
        provider.comentarios = [];
        this.recalcularMetricasProveedor(provider);
      }
    });
  }

  recalcularMetricasProveedor(provider: any): void {

    const comentarios = provider?.comentarios ?? [];

    provider.likes = comentarios.reduce((a: number, c: any) => a + (c.likes ?? 0), 0);
    provider.dislikes = comentarios.reduce((a: number, c: any) => a + (c.dislikes ?? 0), 0);

    provider.totalComentarios = comentarios.length;
  }

  // =========================
  // GETTERS EXACTOS DEL HTML
  // =========================
  getProviderName(p: any): string {
    return p?.razonSocial ?? p?.nombre ?? 'Proveedor';
  }

  getProviderDescription(p: any): string {
    return p?.descripcion ?? '';
  }

  getProviderStatus(p: any): string {
    return p?.estado ?? '';
  }

  getProviderCategory(p: any): string {
    return p?.categoriaPrincipal ?? '';
  }

  getProviderLocation(p: any): string {
    return p?.ubicacion ?? '';
  }

  getProviderSince(p: any): string {
    return p?.fechaRegistro ?? 'No disponible';
  }

  getProviderDelivery(p: any): number {
    return p?.tiempoEntregaPromedio ?? p?.tiempoEntregaDias ?? 0;
  }

  getProviderScore100(p: any): number {
    return this.normPct(p?.scoreGeneral);
  }

  getProviderSatisfaction(p: any): number {
    return this.normPct(p?.satisfaccion);
  }

  getProviderCompliance(p: any): number {
    return this.normPct(p?.cumplimiento);
  }

  getProviderLikes(p: any): number {
    return Number(p?.likes ?? 0);
  }

  getProviderDislikes(p: any): number {
    return Number(p?.dislikes ?? 0);
  }

  getProviderTotalComments(p: any): number {
    return p?.totalComentarios ?? 0;
  }

  formatPercent(v: number): string {
    return `${Math.round(v ?? 0)}%`;
  }

  progressValue(v: number): number {
    return Math.max(0, Math.min(100, Math.round(v ?? 0)));
  }

  formatDays(v: number): string {
    return v ? `${v} días` : 'No disponible';
  }

  // =========================
  // REVIEWS (SOLO PARA QUE NO ROMPA HTML)
  // =========================
  getReviews(p: any): any[] {
    return p?.comentarios ?? [];
  }

  getReviewTypeDraft(): any {}
  setReviewTypeDraft(): any {}
  getReviewCommentDraft(): any {}
  setReviewCommentDraft(): any {}
  getReviewDraftError(): any {}
  canSubmitReview(): boolean { return true; }

  agregarComentarioProveedor(): void {}
  reactToComment(): void {}

  // =========================
  // CARRITO
  // =========================
  cargarCarritoLocal(): void {
    this.requestItems = JSON.parse(localStorage.getItem('rfq_cart') || '[]');
  }

  irAlCarrito(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }

  volverAlDetalle(): void {
    this.router.navigate(['/app/rfq/catalog']);
  }
}