import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-provider-reviews',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.scss'
})
export class ProviderReviewsComponent implements OnInit {

  product: any = null;
  selectedProvider: any = null;
  origin: string | null = null;

  requestItems: any[] = [];
  providers: any[] = [];

  qty: number = 1;

  loadingProviders: boolean = true;

  expandedProviderKey: string | null = null;

  productImageFailed = false;

  reviewDrafts: {
    [key: string]: {
      comentario: string;
      tipo: 'LIKE' | 'DISLIKE';
      error: string;
    }
  } = {};

  private readonly API_BASE =
    'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {

    const nav = this.router.getCurrentNavigation();

    const state =
      nav?.extras?.state
      ?? history.state;

    this.product =
      state?.['product']
      ?? null;

    this.origin =
      state?.['origen']
      ?? null;

    const stateProvider =
      state?.['proveedor']
      ?? state?.['provider']
      ?? null;

    if (stateProvider) {

      this.selectedProvider =
        this.normalizarProveedor(
          stateProvider
        );

      this.providers = [
        this.selectedProvider
      ];

      this.expandedProviderKey =
        this.getProviderKey(
          this.selectedProvider,
          0
        );

      this.loadingProviders = false;

      return;
    }

    const stateProviders =
      state?.['proveedores']
      ?? state?.['providers'];

    if (Array.isArray(stateProviders)) {

      this.setProviderList(
        this.filterProvidersForProduct(
          stateProviders
        )
      );

      this.loadingProviders = false;
    }
  }

  ngOnInit(): void {

    this.cargarCarritoLocal();

    if (
      !this.product
      && !this.selectedProvider
    ) {

      this.router.navigate([
        '/app/rfq/catalog'
      ]);

      return;
    }

    if (this.selectedProvider) {

      this.cargarIndicadoresProveedor(
        this.selectedProvider
      );

      this.cargarComentariosProveedor(
        this.selectedProvider
      );

      this.loadingProviders = false;

      return;
    }

    if (this.loadingProviders) {
      this.cargarProveedoresDelProducto();
    }
  }

  private getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {

    const saved =
      localStorage.getItem('rfq_cart');

    if (saved) {

      this.requestItems =
        JSON.parse(saved);
    }
  }

  guardarCarritoLocal(): void {

    localStorage.setItem(
      'rfq_cart',
      JSON.stringify(this.requestItems)
    );
  }

  cargarProveedoresDelProducto(): void {

    if (!this.product) {
      return;
    }

    this.loadingProviders = true;

    const providersFromProduct =
      this.getProvidersFromProduct();

    if (providersFromProduct.length > 0) {

      this.setProviderList(
        providersFromProduct
      );

      this.providers.forEach(provider => {

        this.cargarIndicadoresProveedor(
          provider
        );

        this.cargarComentariosProveedor(
          provider
        );
      });

      this.loadingProviders = false;

      this.cdr.detectChanges();

      return;
    }

    const request = {
      items: [
        {
          idProducto:
            this.product.idProducto,
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
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        this.setProviderList(
          Array.isArray(res)
            ? res
            : []
        );

        this.providers.forEach(provider => {

          this.cargarIndicadoresProveedor(
            provider
          );

          
          this.cargarComentariosProveedor(
            provider
          );
        });

        this.loadingProviders = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error al cargar proveedores',
          err
        );

        this.providers = [];

        this.loadingProviders = false;

        this.cdr.detectChanges();
      }
    });
  }

  cargarComentariosProveedor(
    provider: any
  ): void {

    const idProvProd =
      provider?.idProvProd
      ?? provider?.id_prov_prod
      ?? provider?.idProveedorProducto
      ?? provider?.idProveedor;

    if (!idProvProd) {

      provider.comentarios = [];

      return;
    }

    this.http.get<any[]>(
      `${this.API_BASE}/comentarios/${idProvProd}`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        provider.comentarios =
          Array.isArray(res)
            ? res.map(c => ({

                ...c,

                likes:
                  Number(c.likes ?? 0),

                dislikes:
                  Number(c.dislikes ?? 0),

                tipo:
                  c.tipo === 'NEGATIVO'
                    ? 'DISLIKE'
                    : 'LIKE',

                userReaction: null
              }))
            : [];

        this.recalculateProviderReviewMetrics(
          provider
        );

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error cargando comentarios',
          err
        );

        provider.comentarios = [];

        this.cdr.detectChanges();
      }
    });
  }

  cargarIndicadoresProveedor(
    provider: any
  ): void {

    const idProveedor =
      provider?.idProveedor
      ?? provider?.id_proveedor
      ?? provider?.idProvider
      ?? provider?.id;

    if (!idProveedor) {
      return;
    }

    this.http.get<any>(
      `${this.API_BASE}/provider/${idProveedor}/indicadores`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        provider.pedidosCompletados =
          res?.pedidosCompletados ?? 0;

        provider.pedidosTotal =
          res?.pedidosTotal ?? 0;

        provider.cumplimiento =
          res?.cumplimiento ?? 0;

        provider.scoreGeneral =
          res?.scoreGeneral ?? 0;

        provider.scoringGeneral =
          Math.round(
            (provider.scoreGeneral || 0)
            * 100
          );

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error cargando indicadores',
          err
        );
      }
    });
  }

  private setProviderList(
    providers: any[]
  ): void {

    this.providers =
      (providers || []).map(
        provider =>
          this.normalizarProveedor(
            provider
          )
      );

    this.expandedProviderKey =
      this.providers.length
        ? this.getProviderKey(
            this.providers[0],
            0
          )
        : null;
  }

  private getProvidersFromProduct(): any[] {

    const possibleLists = [
      this.product?.proveedores,
      this.product?.providers,
      this.product?.proveedoresAsociados,
      this.product?.proveedoresDisponibles
    ];

    const firstList =
      possibleLists.find(Array.isArray);

    return firstList
      ? [...firstList]
      : [];
  }

  private filterProvidersForProduct(
    providers: any[]
  ): any[] {

    if (!this.product?.idProducto) {
      return providers;
    }

    return providers.filter(
      provider => {

        const items =
          provider?.items;

        if (
          !Array.isArray(items)
          || items.length === 0
        ) {
          return true;
        }

        return items.some(
          (item: any) =>
            item?.idProducto ===
            this.product.idProducto
        );
      }
    );
  }

  normalizarProveedor(
    item: any
  ): any {

    return {

      ...item,

      comentarios:
        item?.comentarios
        ?? item?.reviews
        ?? [],

      idProveedor:
        item?.idProveedor
        || item?.id_proveedor
        || item?.idProvider
        || item?.id,

      razonSocial:
        item?.razonSocial
        || item?.razon_social
        || item?.nombreProveedor
        || item?.nombre
        || 'Proveedor',

      categoriaPrincipal:
        item?.categoriaPrincipal
        || item?.categoria
        || item?.rubro
        || null,

      ubicacion:
        item?.ubicacion
        || item?.direccion
        || item?.ciudad
        || null,

      descripcion:
        item?.descripcion
        || item?.description
        || null,

      estado:
        item?.estado
        || 'ACTIVO',

      pedidosCompletados:
        item?.pedidosCompletados
        ?? 0,

      pedidosTotal:
        item?.pedidosTotal
        ?? 0,

      cumplimiento:
        item?.cumplimiento
        ?? 0,

      scoringGeneral:
        item?.scoringGeneral
        ?? 0,

      likes:
        Number(item?.likes ?? 0),

      dislikes:
        Number(item?.dislikes ?? 0),

      satisfaccion:
        item?.satisfaccion
        ?? 0
    };
  }

  getProductImage(): string | null {

    if (this.productImageFailed) {
      return null;
    }

    const image =
      this.product?.imagenes?.[0];

    return image?.URL
      || image?.url
      || null;
  }

  markProductImageFailed(): void {
    this.productImageFailed = true;
  }

  verDetalleProveedor(provider: any): void {
    this.origin = 'PRODUCTO_PROVEEDORES';

    this.selectedProvider =
      this.normalizarProveedor(provider);

    this.providers = [
      this.selectedProvider
    ];

    this.expandedProviderKey =
      this.getProviderKey(
        this.selectedProvider,
        0
      );

    this.loadingProviders = false;

    this.cargarIndicadoresProveedor(
      this.selectedProvider
    );

    this.cargarComentariosProveedor(
      this.selectedProvider
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.cdr.detectChanges();
  }

  getProviderKey(
    provider: any,
    index: number
  ): string {

    return String(
      provider?.idProveedor
      ?? provider?.id
      ?? provider?.razonSocial
      ?? index
    );
  }

  toggleProvider(
    provider: any,
    index: number
  ): void {

    const key =
      this.getProviderKey(
        provider,
        index
      );

    this.expandedProviderKey =
      this.expandedProviderKey === key
        ? null
        : key;

    if (this.expandedProviderKey) {

      this.cargarComentariosProveedor(
        provider
      );
    }
  }

  isProviderExpanded(
    provider: any,
    index: number
  ): boolean {

    return this.expandedProviderKey ===
      this.getProviderKey(
        provider,
        index
      );
  }

  getProviderName(
    provider: any
  ): string {

    return provider?.razonSocial
      || provider?.nombreProveedor
      || provider?.nombre
      || 'Proveedor';
  }

  getProviderCategory(
    provider: any
  ): string | null {

    return provider?.categoriaPrincipal
      || provider?.categoria
      || provider?.rubro
      || null;
  }

  getProviderStatus(
    provider: any
  ): string | null {

    return provider?.estado
      || null;
  }

  getProviderLocation(
    provider: any
  ): string | null {

    return provider?.ubicacion
      || provider?.direccion
      || provider?.ciudad
      || null;
  }

  getProviderDescription(
    provider: any
  ): string | null {

    return provider?.descripcion
      || null;
  }

  getProviderSince(
    provider: any
  ): string {

    return provider?.fechaRegistro
      ? this.formatFecha(
          provider.fechaRegistro
        )
      : 'No disponible';
  }

  getProviderDelivery(
    provider: any
  ): number | null {

    return provider?.tiempoEntregaPromedio
      ?? null;
  }

  getProviderResponse(
    provider: any
  ): number | null {

    return provider?.tiempoRespuestaPromedio
      ?? null;
  }

  getProviderResponseLabel(
    provider: any
  ): string {

    const value =
      this.getProviderResponse(
        provider
      );

    if (value === null) {
      return 'No disponible';
    }

    return `${value} dias`;
  }

  getProviderCompliance(
    provider: any
  ): number | null {

    return provider?.cumplimiento
      ?? 0;
  }

  getProviderOnTime(
    provider: any
  ): number | null {

    return provider?.cumplimiento
      ?? 0;
  }

  getCompletedOrders(
    provider: any
  ): number | null {

    return provider?.pedidosCompletados
      ?? 0;
  }

  getProviderScore100(
    provider: any
  ): number | null {

    const score =
      provider?.scoringGeneral
      ?? provider?.scoreGeneral;

    if (
      score === null
      || score === undefined
    ) {
      return 0;
    }

    if (score <= 1) {
      return Math.round(score * 100);
    }

    return Math.round(score);
  }

  getProviderReputation(
    provider: any
  ): number | null {

    return this.getProviderScore100(
      provider
    );
  }

  getReviews(
    provider: any
  ): any[] {

    const reviews =
      provider?.comentarios
      ?? provider?.reviews
      ?? [];

    return Array.isArray(reviews)
      ? reviews
      : [];
  }

  getReviewCommentDraft(
    provider: any,
    index: number
  ): string {

    return this.ensureReviewDraft(
      provider,
      index
    ).comentario;
  }

  setReviewCommentDraft(
    provider: any,
    index: number,
    value: string
  ): void {

    const draft =
      this.ensureReviewDraft(
        provider,
        index
      );

    draft.comentario = value;

    draft.error = '';
  }

  getReviewTypeDraft(
    provider: any,
    index: number
  ): 'LIKE' | 'DISLIKE' {

    return this.ensureReviewDraft(
      provider,
      index
    ).tipo;
  }

  setReviewTypeDraft(
    provider: any,
    index: number,
    tipo: 'LIKE' | 'DISLIKE'
  ): void {

    this.ensureReviewDraft(
      provider,
      index
    ).tipo = tipo;
  }

  getReviewDraftError(
    provider: any,
    index: number
  ): string {

    return this.ensureReviewDraft(
      provider,
      index
    ).error;
  }

  canSubmitReview(
    provider: any,
    index: number
  ): boolean {

    return this.ensureReviewDraft(
      provider,
      index
    ).comentario
      .trim()
      .length > 0;
  }

  agregarComentarioProveedor(
    provider: any,
    index: number
  ): void {

    const draft =
      this.ensureReviewDraft(
        provider,
        index
      );

    const comentario =
      draft.comentario.trim();

    if (!comentario) {

      draft.error =
        'Escribe un comentario';

      return;
    }
    console.log(provider);
    const request = {

      idProvProd:
        provider?.idProvProd
        ?? provider?.id_prov_prod
        ?? provider?.idProveedorProducto
        ?? provider?.idProveedor,

     

      comentario: comentario
    };

    this.http.post<any>(
      `${this.API_BASE}/comentarios`,
      request,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (res) => {

        const nuevoComentario = {

          ...res,

          usuario: 'Tu comentario',

          comentario: comentario,

          tipo: draft.tipo,

          fecha:
            new Date().toISOString(),

          likes: 0,

          dislikes: 0,

          userReaction: null
        };

        this.getWritableReviews(
          provider
        ).unshift(
          nuevoComentario
        );

        this.recalculateProviderReviewMetrics(
          provider
        );

        draft.comentario = '';

        draft.error = '';

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Comentario rechazado',
          err
        );

        draft.error =
          'No se pudo registrar el comentario';
      }
    });
  }

  getReviewCount(
    provider: any
  ): number {

    return this.getReviews(
      provider
    ).length;
  }

  getProviderTotalComments(
    provider: any
  ): number {

    return this.getReviewCount(
      provider
    );
  }

  getProviderLikes(
    provider: any
  ): number {

    return Number(
      provider?.likes ?? 0
    );
  }

  getProviderDislikes(
    provider: any
  ): number {

    return Number(
      provider?.dislikes ?? 0
    );
  }

  getReviewLikes(
    review: any
  ): number {

    return Number(
      review?.likes ?? 0
    );
  }

  getReviewDislikes(
    review: any
  ): number {

    return Number(
      review?.dislikes ?? 0
    );
  }

  getCommentLikes(
    comentario: any
  ): number {

    return this.getReviewLikes(
      comentario
    );
  }

  getCommentDislikes(
    comentario: any
  ): number {

    return this.getReviewDislikes(
      comentario
    );
  }

  hasUserReaction(
    comentario: any,
    tipo: 'LIKE' | 'DISLIKE'
  ): boolean {

    return comentario?.userReaction
      === tipo;
  }

  reactToComment(
  comentario: any,
  tipo: 'LIKE' | 'DISLIKE',
  provider?: any
): void {

  if (!comentario?.idComentario) {
    return;
  }

  const request = {

    idComentario:
      comentario.idComentario,

  

    tipo: tipo
  };

  this.http.post(
    `${this.API_BASE}/comentarios/reaccion`,
    request,
    {
      headers: this.getHeaders()
    }
  ).subscribe({

    next: () => {

      comentario.userReaction =
        tipo;

      if (provider) {

        this.cargarComentariosProveedor(
          provider
        );
      }

      this.cdr.detectChanges();
    },

    error: (err) => {

      console.error(
        'Error reaccionando comentario',
        err
      );
    }
  });
}

  getTotalReactions(
    provider: any
  ): number {

    return this.getProviderLikes(
      provider
    )
    + this.getProviderDislikes(
      provider
    );
  }

  getProviderSatisfaction(
    provider: any
  ): number {

    return provider?.satisfaccion
      ?? 0;
  }

  getReviewAuthor(
    review: any
  ): string {

    return review?.usuario
      || review?.autor
      || 'Cliente';
  }

  getReviewComment(
    review: any
  ): string {

    return review?.comentario
      || '';
  }

  getReviewDate(
    review: any
  ): string {

    return review?.fecha
      || '';
  }

  getReviewReactionType(
    review: any
  ): 'LIKE' | 'DISLIKE' | '' {

    return review?.tipo || '';
  }

  formatFecha(
    value: string
  ): string {

    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      'es-PE',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  formatPercent(
    value:
      number
      | null
      | undefined
  ): string {

    if (
      value === null
      || value === undefined
    ) {
      return '0%';
    }

    return `${Math.round(value)}%`;
  }

  formatDays(
    value:
      number
      | null
      | undefined
  ): string {

    if (
      value === null
      || value === undefined
    ) {
      return 'No disponible';
    }

    return `${value} dias`;
  }

  progressValue(
    value:
      number
      | null
      | undefined
  ): number {

    if (
      value === null
      || value === undefined
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(value)
        )
      )
    );
  }

  private ensureReviewDraft(
    provider: any,
    index: number
  ): {
    comentario: string;
    tipo: 'LIKE' | 'DISLIKE';
    error: string;
  } {

    const key =
      this.getReviewDraftKey(
        provider,
        index
      );

    if (!this.reviewDrafts[key]) {

      this.reviewDrafts[key] = {

        comentario: '',

        tipo: 'LIKE',

        error: ''
      };
    }

    return this.reviewDrafts[key];
  }

  private getReviewDraftKey(
    provider: any,
    index: number
  ): string {

    return this.getProviderKey(
      provider,
      index
    );
  }

  private getWritableReviews(
    provider: any
  ): any[] {

    if (
      !Array.isArray(
        provider.comentarios
      )
    ) {

      provider.comentarios = [];
    }

    return provider.comentarios;
  }

  private recalculateProviderReviewMetrics(
    provider: any
  ): void {

    const comentarios =
      this.getReviews(provider);

    let likes = 0;

    let dislikes = 0;

    comentarios.forEach(review => {

      likes += Number(
        review?.likes || 0
      );

      dislikes += Number(
        review?.dislikes || 0
      );

      if (
        Number(review?.likes || 0) === 0
        && Number(review?.dislikes || 0) === 0
      ) {

        if (
          review?.tipo === 'LIKE'
        ) {
          likes++;
        }

        if (
          review?.tipo === 'DISLIKE'
        ) {
          dislikes++;
        }
      }
    });

    provider.likes = likes;

    provider.dislikes = dislikes;

    const total =
      likes + dislikes;

    provider.satisfaccion =
      total > 0
        ? Math.round(
            (likes / total) * 100
          )
        : 0;
  }

  get yaEnCarrito(): boolean {

    return this.requestItems.some(
      x =>
        x.idProducto ===
        this.product?.idProducto
    );
  }

  aumentarQty(): void {
    this.qty++;
  }

  disminuirQty(): void {

    if (this.qty > 1) {
      this.qty--;
    }
  }

  agregarAlCarrito(): void {

    if (!this.product) {
      return;
    }

    const existe =
      this.requestItems.find(
        x =>
          x.idProducto ===
          this.product.idProducto
      );

    if (!existe) {

      this.requestItems.push({

        idProducto:
          this.product.idProducto,

        name:
          this.product.producto,

        detail:
          `${this.product.marca}`,

        qty: this.qty,

        precioReferencia:
          this.product.precioUnitario
          ?? null,

        categoria:
          this.product.categoria,

        marca:
          this.product.marca
      });

    } else {

      existe.qty += this.qty;
    }

    this.guardarCarritoLocal();

    this.cdr.detectChanges();
  }

  irAlCarrito(): void {

    this.router.navigate([
      '/app/rfq/catalog'
    ]);
  }

  volverAlDetalle(): void {

    if (!this.product) {

      this.router.navigate([
        '/app/rfq/catalog'
      ]);

      return;
    }

    this.router.navigate(
      [
        '/app/rfq/product',
        this.product?.idProducto
      ],
      {
        state: {
          product: this.product
        }
      }
    );
  }
}
