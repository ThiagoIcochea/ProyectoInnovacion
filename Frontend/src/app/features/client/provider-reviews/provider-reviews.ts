import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

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

  idProductoActual: number | null = null;

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

  private readonly API_BASE = APP_API_BASE_URL;

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
      state?.['proveedor'] ??
      state?.['provider'] ??
      null;

    if (stateProvider) {
      this.selectedProvider = this.normalizarProveedor(stateProvider);
      this.providers = [this.selectedProvider];

      this.expandedProviderKey = this.getProviderKey(
        this.selectedProvider,
        0
      );

      this.loadingProviders = false;
      return;
    }

    const stateProviders =
      state?.['proveedores'] ??
      state?.['providers'];

    if (Array.isArray(stateProviders)) {
      this.setProviderList(
        this.filterProvidersForProduct(stateProviders)
      );

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

      if (this.idProductoActual) {
        this.cargarComentariosProveedor(this.selectedProvider);
      } else {
        this.recalcularMetricasProveedor(this.selectedProvider);
      }

      this.loadingProviders = false;
      return;
    }

    if (this.loadingProviders) {
      this.cargarProveedoresDelProducto();
      return;
    }

    if (this.providers.length > 0) {
      this.providers.forEach(provider => {
        this.cargarIndicadoresProveedor(provider);
        this.cargarComentariosProveedor(provider);
      });
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {
    const saved = localStorage.getItem('rfq_cart');

    if (saved) {
      this.requestItems = JSON.parse(saved);
    }
  }

  guardarCarritoLocal(): void {
    localStorage.setItem('rfq_cart', JSON.stringify(this.requestItems));
  }

  cargarProveedoresDelProducto(): void {
    if (!this.product) {
      return;
    }

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) {
      console.error('No se encontró idProducto para cargar proveedores.');
      this.providers = [];
      this.loadingProviders = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingProviders = true;

    const providersFromProduct = this.getProvidersFromProduct();

    if (providersFromProduct.length > 0) {
      this.setProviderList(providersFromProduct);

      this.providers.forEach(provider => {
        this.cargarIndicadoresProveedor(provider);
        this.cargarComentariosProveedor(provider);
      });

      this.loadingProviders = false;
      this.cdr.detectChanges();
      return;
    }

    const request = {
      items: [
        {
          idProducto,
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

    this.http.post<any>(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        const proveedoresRaw =
          Array.isArray(res)
            ? res
            : res?.proveedores ||
              res?.proveedoresSeleccionados ||
              res?.data ||
              [];

        this.setProviderList(proveedoresRaw);

        this.providers.forEach(provider => {
          this.cargarIndicadoresProveedor(provider);
          this.cargarComentariosProveedor(provider);
        });

        this.loadingProviders = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores', err);

        this.providers = [];
        this.loadingProviders = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarComentariosProveedor(provider: any): void {
    const idProveedor =
      provider?.idProveedor ||
      provider?.id_proveedor ||
      provider?.idProvider ||
      provider?.id;

    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProveedor || !idProducto) {
      console.warn('No se puede cargar comentarios. Falta idProveedor o idProducto.', {
        idProveedor,
        idProducto,
        provider,
        product: this.product
      });

      provider.comentarios = Array.isArray(provider?.comentarios)
        ? provider.comentarios.map((comentario: any) => this.normalizarComentario(comentario))
        : [];

      this.recalcularMetricasProveedor(provider);
      this.cdr.detectChanges();
      return;
    }

    this.http.get<any[]>(
      `${this.API_BASE}/comentarios/${idProveedor}/${idProducto}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
          console.log("RESPUESTA COMENTARIOS", res);
        provider.comentarios = Array.isArray(res)
          ? res.map((comentario) => this.normalizarComentario(comentario))
          : [];

        this.recalcularMetricasProveedor(provider);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          'Error cargando comentarios del proveedor para este producto',
          err
        );

        provider.comentarios = [];
        this.recalcularMetricasProveedor(provider);
        this.cdr.detectChanges();
      }
    });
  }

 normalizarComentario(comentario: any): any {

  const tipoNormalizado =
    comentario?.tipo === 'DISLIKE' ||
    comentario?.tipo === 'NEGATIVO'
      ? 'DISLIKE'
      : 'LIKE';

  return {
    ...comentario,

    idComentario:
      comentario?.idComentario ||
      comentario?.id_comentario ||
      comentario?.id,

    idProvProd:
      comentario?.idProvProd ||
      comentario?.id_prov_prod ||
      null,

    idUsuario:
      comentario?.idUsuario ||
      comentario?.id_usuario ||
      null,

    comentario:
      comentario?.comentario || '',

    tipo: tipoNormalizado,

    fecha:
      comentario?.fecha || null,

    likes:
      Number(comentario?.likes ?? 0),

    dislikes:
      Number(comentario?.dislikes ?? 0),

    likesCount:
      Number(comentario?.likes ?? 0),

    dislikesCount:
      Number(comentario?.dislikes ?? 0),

    userReaction:
      comentario?.userReaction || null
  };
}

  contarReacciones(reacciones: any[], tipo: 'LIKE' | 'DISLIKE'): number {
    if (!Array.isArray(reacciones)) {
      return 0;
    }

    return reacciones.filter(reaccion => reaccion?.tipo === tipo).length;
  }

  recalcularMetricasProveedor(provider: any): void {
    const comentarios = Array.isArray(provider?.comentarios)
      ? provider.comentarios
      : [];

    let likes = 0;
    let dislikes = 0;

    comentarios.forEach((comentario: any) => {
      likes += this.getReviewLikes(comentario);
      dislikes += this.getReviewDislikes(comentario);

      if (
        this.getReviewLikes(comentario) === 0 &&
        this.getReviewDislikes(comentario) === 0
      ) {
        if (comentario?.tipo === 'DISLIKE') {
          dislikes++;
        } else {
          likes++;
        }
      }
    });

    const total = likes + dislikes;

    provider.totalComentarios = comentarios.length;
    provider.likes = likes;
    provider.dislikes = dislikes;
    provider.satisfaccion = total > 0
      ? Math.round((likes / total) * 100)
      : 0;
  }

  private recalculateProviderReviewMetrics(provider: any): void {
    this.recalcularMetricasProveedor(provider);
  }

  cargarIndicadoresProveedor(provider: any): void {
    const idProveedor =
      provider?.idProveedor ??
      provider?.id_proveedor ??
      provider?.idProvider ??
      provider?.id;

    if (!idProveedor) {
      return;
    }

    this.http.get<any>(
      `${this.API_BASE}/provider/${idProveedor}/indicadores`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        provider.pedidosCompletados = res?.pedidosCompletados ?? 0;
        provider.pedidosTotal = res?.pedidosTotal ?? 0;
        provider.cumplimiento = res?.cumplimiento ?? 0;
        provider.scoreGeneral = res?.scoreGeneral ?? 0;

        provider.scoringGeneral = Math.round(
          (provider.scoreGeneral || 0) * 100
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando indicadores', err);
      }
    });
  }

  private setProviderList(providers: any[]): void {
    this.providers = (providers || []).map(provider =>
      this.normalizarProveedor(provider)
    );

    this.expandedProviderKey =
      this.providers.length
        ? this.getProviderKey(this.providers[0], 0)
        : null;
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
    const idProducto =
      this.idProductoActual ||
      this.product?.idProducto ||
      this.product?.id_producto;

    if (!idProducto) {
      return providers;
    }

    return providers.filter(provider => {
      const providerProductId =
        provider?.idProducto ||
        provider?.id_producto;

      if (providerProductId) {
        return Number(providerProductId) === Number(idProducto);
      }

      const items = provider?.items || provider?.productos;

      if (!Array.isArray(items) || items.length === 0) {
        return true;
      }

      return items.some((item: any) => {
        const itemId =
          item?.idProducto ||
          item?.id_producto;

        return Number(itemId) === Number(idProducto);
      });
    });
  }

  normalizarProveedor(item: any): any {
    return {
      ...item,

      idProvProd:
        item?.idProvProd ||
        item?.id_prov_prod ||
        item?.idProveedorProducto ||
        null,

      idProducto:
        item?.idProducto ||
        item?.id_producto ||
        this.idProductoActual ||
        this.product?.idProducto ||
        this.product?.id_producto ||
        null,

      idProveedor:
        item?.idProveedor ||
        item?.id_proveedor ||
        item?.idProvider ||
        item?.id ||
        null,

      proveedor:
        item?.proveedor ||
        item?.razonSocial ||
        item?.razon_social ||
        item?.nombreProveedor ||
        item?.nombre ||
        'Proveedor',

      razonSocial:
        item?.razonSocial ||
        item?.razon_social ||
        item?.proveedor ||
        item?.nombreProveedor ||
        item?.nombre ||
        'Proveedor',

      categoriaPrincipal:
        item?.categoriaPrincipal ||
        item?.categoria ||
        item?.rubro ||
        null,

      ubicacion:
        item?.ubicacion ||
        item?.direccion ||
        item?.ciudad ||
        null,

      descripcion:
        item?.descripcion ||
        item?.description ||
        null,

      estado:
        item?.estado ||
        'ACTIVO',

      precioUnitario:
        item?.precioUnitario ||
        item?.precio_unitario ||
        item?.precio ||
        null,

      stock:
        item?.stock ?? null,

      tiempoEntregaDias:
        item?.tiempoEntregaDias ||
        item?.tiempo_entrega_dias ||
        null,

      garantiaMeses:
        item?.garantiaMeses ||
        item?.garantia_meses ||
        null,

      pedidosCompletados:
        item?.pedidosCompletados ?? 0,

      pedidosTotal:
        item?.pedidosTotal ?? 0,

      cumplimiento:
        item?.cumplimiento ?? 0,

      scoringGeneral:
        item?.scoringGeneral ?? 0,

      comentarios:
        Array.isArray(item?.comentarios)
          ? item.comentarios.map((c: any) => this.normalizarComentario(c))
          : Array.isArray(item?.reviews)
            ? item.reviews.map((c: any) => this.normalizarComentario(c))
            : [],

      likes:
        Number(item?.likes ?? 0),

      dislikes:
        Number(item?.dislikes ?? 0),

      satisfaccion:
        item?.satisfaccion ?? 0,

      totalComentarios:
        item?.totalComentarios ||
        item?.total_comentarios ||
        0
    };
  }

  getProductImage(): string | null {
    if (this.productImageFailed) {
      return null;
    }

    const image = this.product?.imagenes?.[0];

    return image?.URL || image?.url || null;
  }

  markProductImageFailed(): void {
    this.productImageFailed = true;
  }

  verDetalleProveedor(provider: any): void {
    this.origin = 'PRODUCTO_PROVEEDORES';
    this.selectedProvider = this.normalizarProveedor(provider);
    this.providers = [this.selectedProvider];

    this.expandedProviderKey = this.getProviderKey(
      this.selectedProvider,
      0
    );

    this.loadingProviders = false;

    this.cargarIndicadoresProveedor(this.selectedProvider);
    this.cargarComentariosProveedor(this.selectedProvider);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.cdr.detectChanges();
  }

  getProviderKey(provider: any, index: number): string {
    return String(
      provider?.idProveedor ??
      provider?.id ??
      provider?.razonSocial ??
      index
    );
  }

  toggleProvider(provider: any, index: number): void {
    const key = this.getProviderKey(provider, index);

    this.expandedProviderKey =
      this.expandedProviderKey === key
        ? null
        : key;

    if (this.expandedProviderKey) {
      this.cargarComentariosProveedor(provider);
    }
  }

  isProviderExpanded(provider: any, index: number): boolean {
    return this.expandedProviderKey === this.getProviderKey(provider, index);
  }

  getProviderName(provider: any): string {
    return provider?.razonSocial ||
      provider?.nombreProveedor ||
      provider?.nombre ||
      'Proveedor';
  }

  getProviderCategory(provider: any): string | null {
    return provider?.categoriaPrincipal ||
      provider?.categoria ||
      provider?.rubro ||
      null;
  }

  getProviderStatus(provider: any): string | null {
    return provider?.estado || null;
  }

  getProviderLocation(provider: any): string | null {
    return provider?.ubicacion ||
      provider?.direccion ||
      provider?.ciudad ||
      null;
  }

  getProviderDescription(provider: any): string | null {
    return provider?.descripcion || null;
  }

  getProviderSince(provider: any): string {
    return provider?.fechaRegistro
      ? this.formatFecha(provider.fechaRegistro)
      : 'No disponible';
  }

  getProviderDelivery(provider: any): number | null {
    return provider?.tiempoEntregaPromedio ??
      provider?.tiempoEntregaDias ??
      null;
  }

  getProviderResponse(provider: any): number | null {
    return provider?.tiempoRespuestaPromedio ?? null;
  }

  getProviderResponseLabel(provider: any): string {
    const value = this.getProviderResponse(provider);

    if (value === null) {
      return 'No disponible';
    }

    return `${value} días`;
  }

  getProviderCompliance(provider: any): number | null {
    return provider?.cumplimiento ?? 0;
  }

  getProviderOnTime(provider: any): number | null {
    return provider?.cumplimiento ?? 0;
  }

  getCompletedOrders(provider: any): number | null {
    return provider?.pedidosCompletados ?? 0;
  }

  getProviderScore100(provider: any): number | null {
    const score =
      provider?.scoringGeneral ??
      provider?.scoreGeneral;

    if (score === null || score === undefined) {
      return 0;
    }

    if (score <= 1) {
      return Math.round(score * 100);
    }

    return Math.round(score);
  }

  getProviderReputation(provider: any): number | null {
    return this.getProviderScore100(provider);
  }

  getReviews(provider: any): any[] {
    const reviews =
      provider?.comentarios ??
      provider?.reviews ??
      [];

    return Array.isArray(reviews) ? reviews : [];
  }

  getReviewCommentDraft(provider: any, index: number): string {
    return this.ensureReviewDraft(provider, index).comentario;
  }

  setReviewCommentDraft(provider: any, index: number, value: string): void {
    const draft = this.ensureReviewDraft(provider, index);
    draft.comentario = value;
    draft.error = '';
  }

  getReviewTypeDraft(provider: any, index: number): 'LIKE' | 'DISLIKE' {
    return this.ensureReviewDraft(provider, index).tipo;
  }

  setReviewTypeDraft(
    provider: any,
    index: number,
    tipo: 'LIKE' | 'DISLIKE'
  ): void {
    this.ensureReviewDraft(provider, index).tipo = tipo;
  }

  getReviewDraftError(provider: any, index: number): string {
    return this.ensureReviewDraft(provider, index).error;
  }

  canSubmitReview(provider: any, index: number): boolean {
    return this.ensureReviewDraft(provider, index)
      .comentario
      .trim()
      .length > 0;
  }

  agregarComentarioProveedor(provider: any, index: number): void {
  const draft = this.ensureReviewDraft(provider, index);
  const comentario = draft.comentario.trim();

  if (!comentario) {
    draft.error = 'Escribe un comentario';
    return;
  }

  const idProveedor =
    provider?.idProveedor ||
    provider?.id_proveedor ||
    provider?.idProvider ||
    provider?.id;

  const idProducto =
    this.idProductoActual ||
    this.product?.idProducto ||
    this.product?.id_producto ||
    provider?.idProducto ||
    provider?.id_producto;

  if (!idProveedor || !idProducto) {
    draft.error = 'No se encontró la relación proveedor-producto.';
    console.warn('Faltan datos para registrar comentario', {
      idProveedor,
      idProducto,
      provider,
      product: this.product
    });
    return;
  }

  const request = {
    idProv: idProveedor,
    idProd: idProducto,
    comentario
  };

  this.http.post<any>(
    `${this.API_BASE}/comentarios`,
    request,
    { headers: this.getHeaders() }
  ).subscribe({
    next: () => {
      draft.comentario = '';
      draft.error = '';

      this.cargarComentariosProveedor(provider);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Comentario rechazado', err);
      draft.error = 'No se pudo registrar el comentario';
    }
  });
}

  getReviewCount(provider: any): number {
    return this.getReviews(provider).length;
  }

  getProviderTotalComments(provider: any): number {
    return this.getReviewCount(provider);
  }

  getProviderLikes(provider: any): number {
    return Number(provider?.likes ?? 0);
  }

  getProviderDislikes(provider: any): number {
    return Number(provider?.dislikes ?? 0);
  }

getReviewLikes(review: any): number {
  return Number(review?.likes ?? review?.likesCount ?? 0);
}

  getReviewDislikes(review: any): number {
  return Number(review?.dislikes ?? review?.dislikesCount ?? 0);
}
  getCommentLikes(comentario: any): number {
    return this.getReviewLikes(comentario);
  }

  getCommentDislikes(comentario: any): number {
    return this.getReviewDislikes(comentario);
  }

  hasUserReaction(
    comentario: any,
    tipo: 'LIKE' | 'DISLIKE'
  ): boolean {
    return comentario?.userReaction === tipo;
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
      idComentario: comentario.idComentario,
      tipo
    };

    this.http.post(
      `${this.API_BASE}/comentarios/reaccion`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        comentario.userReaction = tipo;

        if (provider) {
          this.cargarComentariosProveedor(provider);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error reaccionando comentario', err);
      }
    });
  }

  getTotalReactions(provider: any): number {
    return this.getProviderLikes(provider) + this.getProviderDislikes(provider);
  }

  getProviderSatisfaction(provider: any): number {
    return provider?.satisfaccion ?? 0;
  }

  getReviewAuthor(review: any): string {
    return review?.usuario ||
      review?.autor ||
      `${review?.nombreUsuario || ''}`.trim() ||
      'Cliente';
  }

  getReviewComment(review: any): string {
    return review?.comentario || '';
  }

  getReviewDate(review: any): string {
    return review?.fecha || '';
  }

  getReviewReactionType(review: any): 'LIKE' | 'DISLIKE' | '' {
    return review?.tipo || '';
  }

  formatFecha(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '0%';
    }

    return `${Math.round(value)}%`;
  }

  formatDays(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'No disponible';
    }

    return `${value} días`;
  }

  progressValue(value: number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(Number(value))
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
    const key = this.getReviewDraftKey(provider, index);

    if (!this.reviewDrafts[key]) {
      this.reviewDrafts[key] = {
        comentario: '',
        tipo: 'LIKE',
        error: ''
      };
    }

    return this.reviewDrafts[key];
  }

  private getReviewDraftKey(provider: any, index: number): string {
    return this.getProviderKey(provider, index);
  }

  private getWritableReviews(provider: any): any[] {
    if (!Array.isArray(provider.comentarios)) {
      provider.comentarios = [];
    }

    return provider.comentarios;
  }

  get yaEnCarrito(): boolean {
    return this.requestItems.some(
      x => x.idProducto === this.product?.idProducto
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

    const existe = this.requestItems.find(
      x => x.idProducto === this.product.idProducto
    );

    if (!existe) {
      this.requestItems.push({
        idProducto: this.product.idProducto,
        name: this.product.producto,
        detail: `${this.product.marca}`,
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
    if (!this.product) {
      this.router.navigate(['/app/rfq/catalog']);
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
