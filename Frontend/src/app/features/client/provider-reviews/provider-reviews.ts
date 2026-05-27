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
  requestItems: any[] = [];
  providers: any[] = [];
  qty: number = 1;
  loadingProviders: boolean = true;
  expandedProviderKey: string | null = null;
  productImageFailed = false;
  reviewDrafts: { [key: string]: { comentario: string; tipo: 'LIKE' | 'DISLIKE'; error: string } } = {};

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';
  private readonly LOCAL_REVIEW_STORAGE_KEY = 'rfq_provider_local_reviews';
  private readonly LOCAL_REACTION_STORAGE_KEY = 'rfq_provider_comment_reactions';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;

    this.product = state?.['product'] ?? null;
    this.origin = state?.['origen'] ?? null;

    const stateProvider = state?.['proveedor'] ?? state?.['provider'] ?? null;
    if (stateProvider) {
      this.selectedProvider = this.normalizarProveedor(stateProvider);
      this.providers = [this.selectedProvider];
      this.expandedProviderKey = this.getProviderKey(this.selectedProvider, 0);
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
    if (!this.product) return;

    this.loadingProviders = true;

    const providersFromProduct = this.getProvidersFromProduct();
    if (providersFromProduct.length > 0) {
      this.setProviderList(providersFromProduct);
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
        this.setProviderList(Array.isArray(res) ? res : []);
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

  private setProviderList(providers: any[]): void {
    this.providers = (providers || []).map(provider => this.normalizarProveedor(provider));
    this.expandedProviderKey = this.providers.length ? this.getProviderKey(this.providers[0], 0) : null;
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

  normalizarProveedor(item: any): any {
    const reviews = this.mergeReviews(this.getReviews(item), this.getStoredReviewsForProvider(item));
    this.applyStoredCommentReactions(reviews);
    const likes = reviews.length > 0
      ? this.countReviewReactions(reviews, 'LIKE')
      : this.getReactionCount(item, 'LIKE');
    const dislikes = reviews.length > 0
      ? this.countReviewReactions(reviews, 'DISLIKE')
      : this.getReactionCount(item, 'DISLIKE');
    const directTotalResenas = this.firstNumber(item, [
      'totalResenas',
      'total_resenas',
      'cantidadResenas',
      'cantidad_resenas',
      'cantidadReviews',
      'totalReviews',
      'numeroResenas',
      'comentariosTotal',
      'totalComentarios'
    ]);
    const totalResenas = Math.max(directTotalResenas ?? 0, reviews.length);
    const totalReacciones = likes + dislikes;
    const satisfaccion = totalReacciones > 0
      ? Math.round((likes / totalReacciones) * 100)
      : 0;
    const estado = item?.estado || item?.status || item?.estadoProveedor;
    const verificado = item?.verificado ?? item?.verified ?? this.isPositiveStatus(estado);
    const cumplimiento = this.normalizePercent(this.firstNumber(item, [
      'cumplimiento',
      'porcentajeCumplimiento',
      'cumplimientoEntrega',
      'cumplimiento_entrega'
    ]));
    const entregasATiempo = this.normalizePercent(this.firstNumber(item, [
      'entregasATiempo',
      'entregas_a_tiempo',
      'porcentajeEntregasATiempo',
      'porcentaje_entregas_tiempo'
    ]));
    const scoringGeneral = this.firstNumber(item, ['scoringGeneral', 'scoring_general'])
      ?? this.calculateScoringGeneral(satisfaccion, cumplimiento, entregasATiempo);

    return {
      ...item,
      comentarios: reviews,
      idProveedor: item?.idProveedor || item?.id_proveedor || item?.idProvider || item?.id,
      razonSocial: item?.razonSocial
        || item?.razon_social
        || item?.nombreProveedor
        || item?.nombre_proveedor
        || item?.proveedorPrincipal
        || item?.proveedor_principal
        || item?.proveedor
        || item?.empresa
        || item?.nombre,
      categoriaPrincipal: item?.categoriaPrincipal
        || item?.categoria_principal
        || item?.rubro
        || item?.categoria
        || item?.sector,
      ubicacion: item?.ubicacion || item?.ciudad || item?.direccion || item?.location,
      descripcion: item?.descripcion || item?.description || item?.resumen || item?.bio,
      fechaPlataforma: item?.fechaPlataforma || item?.fecha_plataforma || item?.fechaRegistro || item?.createdAt,
      desde: item?.desde || item?.anioRegistro || item?.anio_registro,
      estado,
      totalResenas,
      totalComentarios: totalResenas,
      likes,
      dislikes,
      totalLikes: likes,
      totalDislikes: dislikes,
      satisfaccion,
      scoringGeneral,
      cumplimiento,
      entregasATiempo,
      tiempoEntregaPromedio: this.firstNumber(item, [
        'tiempoEntregaPromedio',
        'tiempo_entrega_promedio',
        'tiempoEntregaDias',
        'tiempo_entrega_dias',
        'tiempoEntrega',
        'entregaPromedio',
        'entrega_promedio'
      ]),
      tiempoRespuestaPromedio: this.firstNumber(item, [
        'tiempoRespuestaPromedio',
        'tiempo_respuesta_promedio',
        'tiempoRespuesta',
        'tiempo_respuesta'
      ]),
      tiempoRespuesta: item?.tiempoRespuesta || item?.tiempo_respuesta || item?.tiempoRespuestaPromedio,
      pedidosCompletados: this.firstNumber(item, [
        'pedidosCompletados',
        'pedidos_completados',
        'totalPedidosCompletados',
        'total_pedidos_completados'
      ]),
      verificado
    };
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
    return String(provider?.idProveedor ?? provider?.idProvider ?? provider?.id ?? provider?.razonSocial ?? index);
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
      || provider?.razon_social
      || provider?.nombreProveedor
      || provider?.nombre
      || provider?.empresa
      || 'Proveedor sin nombre';
  }

  getProviderCategory(provider: any): string | null {
    return provider?.categoriaPrincipal
      || provider?.categoria_principal
      || provider?.rubro
      || provider?.categoria
      || provider?.sector
      || null;
  }

  getProviderStatus(provider: any): string | null {
    if (provider?.estado) return provider.estado;
    if (provider?.verificado === true || provider?.verified === true) return 'Verificado';
    if (provider?.verificado === false || provider?.verified === false) return 'No verificado';
    return null;
  }

  getProviderLocation(provider: any): string | null {
    return provider?.ubicacion || provider?.ciudad || provider?.direccion || provider?.location || null;
  }

  getProviderDescription(provider: any): string | null {
    return provider?.descripcion || provider?.description || provider?.resumen || provider?.bio || null;
  }

  getProviderSince(provider: any): string {
    if (provider?.desde) return String(provider.desde);

    const date = provider?.fechaPlataforma || provider?.fecha_plataforma || provider?.fechaRegistro || provider?.createdAt;
    return date ? this.formatFecha(date) : 'No disponible';
  }

  getProviderDelivery(provider: any): number | null {
    return this.firstNumber(provider, [
      'tiempoEntregaPromedio',
      'tiempo_entrega_promedio',
      'tiempoEntregaDias',
      'tiempoEntrega'
    ]);
  }

  getProviderResponse(provider: any): number | null {
    return this.firstNumber(provider, [
      'tiempoRespuestaPromedio',
      'tiempo_respuesta_promedio',
      'tiempo_respuesta'
    ]);
  }

  getProviderResponseLabel(provider: any): string {
    const directText = provider?.tiempoRespuesta || provider?.tiempo_respuesta;
    if (directText && Number.isNaN(Number(directText))) return String(directText);

    const response = this.getProviderResponse(provider);
    if (response !== null) return this.formatDays(response);

    return this.formatDays(this.getProviderDelivery(provider));
  }

  getProviderCompliance(provider: any): number | null {
    return this.normalizePercent(this.firstNumber(provider, [
      'cumplimiento',
      'porcentajeCumplimiento',
      'cumplimientoEntrega',
      'cumplimiento_entrega'
    ]));
  }

  getProviderOnTime(provider: any): number | null {
    return this.normalizePercent(this.firstNumber(provider, [
      'entregasATiempo',
      'entregas_a_tiempo',
      'porcentajeEntregasATiempo',
      'porcentaje_entregas_tiempo'
    ]));
  }

  getCompletedOrders(provider: any): number | null {
    return this.firstNumber(provider, [
      'pedidosCompletados',
      'pedidos_completados',
      'totalPedidosCompletados',
      'total_pedidos_completados'
    ]);
  }

  getProviderScore100(provider: any): number | null {
    const directScore = this.firstNumber(provider, [
      'scoringGeneral',
      'scoring_general',
      'scoreGeneral',
      'scoreFinal',
      'score',
      'puntuacion'
    ]);

    if (directScore !== null) {
      if (directScore <= 1 && directScore > 0) return this.progressValue(directScore * 100);
      if (directScore <= 5 && directScore > 0) return this.progressValue(directScore * 20);
      return this.progressValue(directScore);
    }

    return this.calculateScoringGeneral(
      this.getProviderSatisfaction(provider),
      this.getProviderCompliance(provider),
      this.getProviderOnTime(provider)
    );
  }

  getProviderReputation(provider: any): number | null {
    const directReputation = this.normalizePercent(this.firstNumber(provider, [
      'reputacionComercial',
      'reputacion_comercial',
      'reputacion',
      'reputation'
    ]));

    if (directReputation !== null) return directReputation;

    const score = this.getProviderScore100(provider);
    if (score !== null) return score;

    const satisfaction = this.getProviderSatisfaction(provider);
    const compliance = this.getProviderCompliance(provider);
    if (this.getTotalReactions(provider) > 0 && compliance !== null) {
      return this.progressValue((satisfaction + compliance) / 2);
    }

    return this.getTotalReactions(provider) > 0 ? satisfaction : null;
  }

  getReviews(provider: any): any[] {
    const reviews = provider?.comentarios
      ?? provider?.reviews
      ?? provider?.resenas
      ?? provider?.['rese\u00f1as']
      ?? provider?.evaluaciones
      ?? provider?.comments
      ?? [];

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

  setReviewTypeDraft(provider: any, index: number, tipo: 'LIKE' | 'DISLIKE'): void {
    this.ensureReviewDraft(provider, index).tipo = tipo;
  }

  getReviewDraftError(provider: any, index: number): string {
    return this.ensureReviewDraft(provider, index).error;
  }

  canSubmitReview(provider: any, index: number): boolean {
    return this.ensureReviewDraft(provider, index).comentario.trim().length > 0;
  }

  agregarComentarioProveedor(provider: any, index: number): void {
    const draft = this.ensureReviewDraft(provider, index);
    const comentario = draft.comentario.trim();

    if (!comentario) {
      draft.error = 'Escribe un comentario antes de publicarlo.';
      return;
    }

    const idComentario = Date.now();
    const idUsuario = this.getCurrentUserId();
    const tipo = draft.tipo;
    const review = {
      id_comentario: idComentario,
      id_prov_prod: this.getProviderProductId(provider),
      id_usuario: idUsuario,
      usuario: 'Tu comentario',
      comentario,
      tipo,
      fecha: new Date().toISOString().slice(0, 10),
      likes: [
        {
          id_like: idComentario + 1,
          id_comentario: idComentario,
          id_usuario: idUsuario,
          tipo
        }
      ]
    };

    this.getWritableReviews(provider).unshift(review);
    this.recalculateProviderReviewMetrics(provider);
    this.saveStoredReview(provider, review);
    this.reviewDrafts[this.getReviewDraftKey(provider, index)] = {
      comentario: '',
      tipo: 'LIKE',
      error: ''
    };
    this.cdr.detectChanges();
  }

  getReviewCount(provider: any): number {
    const directCount = this.firstNumber(provider, [
      'cantidadResenas',
      'cantidad_resenas',
      'cantidadReviews',
      'totalResenas',
      'total_resenas',
      'totalReviews',
      'numeroResenas',
      'comentariosTotal',
      'totalComentarios'
    ]);

    return directCount !== null ? directCount : this.getReviews(provider).length;
  }

  getProviderTotalComments(provider: any): number {
    return this.getReviewCount(provider);
  }

  getProviderLikes(provider: any): number {
    return this.getReactionCount(provider, 'LIKE');
  }

  getProviderDislikes(provider: any): number {
    return this.getReactionCount(provider, 'DISLIKE');
  }

  getReviewLikes(review: any): number {
    return this.getReactionCount(review, 'LIKE');
  }

  getReviewDislikes(review: any): number {
    return this.getReactionCount(review, 'DISLIKE');
  }

  getCommentLikes(comentario: any): number {
    return this.getReviewLikes(comentario);
  }

  getCommentDislikes(comentario: any): number {
    return this.getReviewDislikes(comentario);
  }

  hasUserReaction(comentario: any, tipo: 'LIKE' | 'DISLIKE'): boolean {
    return this.getUserReaction(comentario) === tipo;
  }

  reactToComment(comentario: any, tipo: 'LIKE' | 'DISLIKE', provider?: any): void {
    const idUsuario = this.getCurrentUserId();
    const reactions = this.ensureCommentReactionList(comentario);
    const currentIndex = reactions.findIndex((reaction: any) => this.isCurrentUserReaction(reaction, idUsuario));
    const currentReaction = currentIndex >= 0 ? reactions[currentIndex] : null;
    const currentType = currentReaction ? this.getReactionType(currentReaction) : '';
    let nextType: 'LIKE' | 'DISLIKE' | null = tipo;

    if (currentReaction && currentType === tipo) {
      reactions.splice(currentIndex, 1);
      nextType = null;
    } else if (currentReaction) {
      currentReaction.tipo = tipo;
      currentReaction.type = tipo;
    } else {
      reactions.push({
        id_like: Date.now(),
        id_comentario: this.getCommentId(comentario),
        id_usuario: idUsuario,
        tipo
      });
    }

    comentario.userReaction = nextType;
    this.removeCurrentUserDuplicatedReactions(comentario, idUsuario);
    this.saveStoredCommentReaction(comentario, nextType);

    if (provider) {
      this.recalculateProviderReviewMetrics(provider);
    }

    this.cdr.detectChanges();
  }

  getTotalReactions(provider: any): number {
    return this.getProviderLikes(provider) + this.getProviderDislikes(provider);
  }

  getProviderSatisfaction(provider: any): number {
    const direct = this.normalizePercent(this.firstNumber(provider, [
      'satisfaccion',
      'satisfaccionClientes',
      'satisfaccion_clientes',
      'porcentajeSatisfaccion',
      'porcentaje_satisfaccion'
    ]));

    if (direct !== null && this.getTotalReactions(provider) === 0) return direct;

    const likes = this.getProviderLikes(provider);
    const dislikes = this.getProviderDislikes(provider);
    const total = likes + dislikes;
    return total > 0 ? Math.round((likes / total) * 100) : 0;
  }

  getReviewAuthor(review: any): string {
    const user = review?.usuario || review?.user;

    if (typeof user === 'string') return user;

    return review?.autor
      || review?.cliente
      || review?.nombreCliente
      || user?.nombre
      || user?.nombreCompleto
      || user?.email
      || (review?.id_usuario ? `Usuario #${review.id_usuario}` : null)
      || 'Cliente';
  }

  getReviewComment(review: any): string {
    return review?.comentario || review?.comment || review?.descripcion || review?.texto || '';
  }

  getReviewDate(review: any): string {
    return review?.fecha || review?.createdAt || review?.fechaCreacion || review?.fecha_creacion || '';
  }

  getReviewReactionType(review: any): 'LIKE' | 'DISLIKE' | '' {
    const directType = this.getReactionType(review);
    if (directType === 'LIKE' || directType === 'DISLIKE') return directType;

    const likes = this.getReactionCount(review, 'LIKE');
    const dislikes = this.getReactionCount(review, 'DISLIKE');
    if (likes > dislikes) return 'LIKE';
    if (dislikes > likes) return 'DISLIKE';
    return '';
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

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No disponible';
    return `${this.progressValue(value)}%`;
  }

  formatDays(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No disponible';
    const rounded = Math.round(Number(value) * 10) / 10;
    return `${rounded} dia${rounded === 1 ? '' : 's'}`;
  }

  progressValue(value: number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Math.max(0, Math.min(100, Math.round(Number(value))));
  }

  private getReactionCount(source: any, type: 'LIKE' | 'DISLIKE'): number {
    const directKeys = type === 'LIKE'
      ? ['likes', 'totalLikes', 'total_likes', 'cantidadLikes', 'cantidad_likes', 'likeCount', 'likesCount']
      : ['dislikes', 'totalDislikes', 'total_dislikes', 'cantidadDislikes', 'cantidad_dislikes', 'dislikeCount', 'dislikesCount'];
    const direct = this.firstNumber(source, directKeys);

    if (direct !== null) return direct;

    const reviewMatches = this.getReviews(source)
      .filter(review => this.getReactionType(review) === type)
      .length;
    const reactionMatches = this.getReactionList(source)
      .filter(reaction => this.getReactionType(reaction) === type)
      .length;

    if (reactionMatches > 0 || reviewMatches > 0) {
      return reviewMatches + reactionMatches;
    }

    const directList = type === 'LIKE' ? source?.likes : source?.dislikes;
    if (Array.isArray(directList)) {
      const typedItems = directList
        .map((reaction: any) => this.getReactionType(reaction))
        .filter(Boolean);

      return typedItems.length > 0
        ? directList.filter((reaction: any) => this.getReactionType(reaction) === type).length
        : directList.length;
    }

    return 0;
  }

  private getReactionList(source: any): any[] {
    const directLists = [
      source?.reacciones,
      source?.reactions,
      source?.likesComentarios,
      source?.reaccionesComentarios,
      source?.likes,
      source?.dislikes
    ].filter(Array.isArray);
    const reviewLists = this.getReviews(source)
      .flatMap(review => [
        review?.reacciones,
        review?.reactions,
        review?.likes
      ].filter(Array.isArray).flat());

    return [...directLists.flat(), ...reviewLists];
  }

  private getReactionType(item: any): string {
    return String(item?.tipo || item?.type || item?.reaccion || item?.reaction || '')
      .trim()
      .toUpperCase();
  }

  private getUserReaction(comentario: any): 'LIKE' | 'DISLIKE' | null {
    const directReaction = comentario?.userReaction;
    if (directReaction === 'LIKE' || directReaction === 'DISLIKE') return directReaction;

    const idUsuario = this.getCurrentUserId();
    const reaction = this.getReactionList(comentario)
      .find((item: any) => this.isCurrentUserReaction(item, idUsuario));
    const type = this.getReactionType(reaction);

    return type === 'LIKE' || type === 'DISLIKE' ? type : null;
  }

  private ensureCommentReactionList(comentario: any): any[] {
    if (Array.isArray(comentario?.likes)) return comentario.likes;

    comentario.likes = [];
    return comentario.likes;
  }

  private isCurrentUserReaction(reaction: any, idUsuario: number): boolean {
    return this.toNumber(reaction?.id_usuario ?? reaction?.idUsuario ?? reaction?.userId) === idUsuario;
  }

  private getCommentId(comentario: any): number {
    return this.toNumber(comentario?.id_comentario ?? comentario?.idComentario ?? comentario?.id) ?? Date.now();
  }

  private removeCurrentUserDuplicatedReactions(comentario: any, idUsuario: number): void {
    const reactions = this.ensureCommentReactionList(comentario);
    let firstReactionFound = false;

    for (let i = reactions.length - 1; i >= 0; i--) {
      if (!this.isCurrentUserReaction(reactions[i], idUsuario)) continue;

      if (firstReactionFound) {
        reactions.splice(i, 1);
        continue;
      }

      firstReactionFound = true;
    }
  }

  private ensureReviewDraft(provider: any, index: number): { comentario: string; tipo: 'LIKE' | 'DISLIKE'; error: string } {
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
    if (Array.isArray(provider?.comentarios)) return provider.comentarios;
    if (Array.isArray(provider?.reviews)) {
      provider.comentarios = provider.reviews;
      return provider.comentarios;
    }
    if (Array.isArray(provider?.resenas)) {
      provider.comentarios = provider.resenas;
      return provider.comentarios;
    }

    provider.comentarios = [];
    return provider.comentarios;
  }

  private recalculateProviderReviewMetrics(provider: any): void {
    const comentarios = this.getReviews(provider);
    const likes = this.countReviewReactions(comentarios, 'LIKE');
    const dislikes = this.countReviewReactions(comentarios, 'DISLIKE');
    const total = likes + dislikes;

    provider.totalComentarios = comentarios.length;
    provider.totalResenas = comentarios.length;
    provider.likes = likes;
    provider.dislikes = dislikes;
    provider.totalLikes = likes;
    provider.totalDislikes = dislikes;
    provider.satisfaccion = total > 0 ? Math.round((likes / total) * 100) : 0;
    provider.scoringGeneral = this.calculateScoringGeneral(
      provider.satisfaccion,
      this.getProviderCompliance(provider),
      this.getProviderOnTime(provider)
    );
  }

  private countReviewReactions(reviews: any[], type: 'LIKE' | 'DISLIKE'): number {
    return reviews.reduce((total, review) => {
      const commentTypeCount = this.getReactionType(review) === type ? 1 : 0;
      const reactionCount = Array.isArray(review?.likes)
        ? review.likes.filter((reaction: any) => this.getReactionType(reaction) === type).length
        : 0;

      return total + commentTypeCount + reactionCount;
    }, 0);
  }

  private getProviderProductId(provider: any): number {
    const directId = this.firstNumber(provider, ['id_prov_prod', 'idProvProd']);
    if (directId !== null) return directId;

    const providerId = this.firstNumber(provider, ['idProveedor', 'id_proveedor', 'idProvider', 'id']);
    return providerId !== null ? providerId * 1000 + this.getReviews(provider).length + 1 : Date.now();
  }

  private getCurrentUserId(): number {
    const possibleKeys = ['id_usuario', 'idUsuario', 'user_id', 'userId'];

    for (const key of possibleKeys) {
      const parsed = this.toNumber(localStorage.getItem(key));
      if (parsed !== null) return parsed;
    }

    const rawUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        const parsed = this.toNumber(user?.id_usuario ?? user?.idUsuario ?? user?.id);
        if (parsed !== null) return parsed;
      } catch {
        return 999;
      }
    }

    return 999;
  }

  private getStoredReviewsForProvider(provider: any): any[] {
    const store = this.readStoredReviews();
    const key = this.getStoredProviderKey(provider);
    return Array.isArray(store[key]) ? store[key] : [];
  }

  private saveStoredReview(provider: any, review: any): void {
    const store = this.readStoredReviews();
    const key = this.getStoredProviderKey(provider);
    store[key] = this.mergeReviews([review], store[key] || []);
    localStorage.setItem(this.LOCAL_REVIEW_STORAGE_KEY, JSON.stringify(store));
  }

  private applyStoredCommentReactions(reviews: any[]): void {
    const storedReactions = this.readStoredCommentReactions();
    const idUsuario = this.getCurrentUserId();

    reviews.forEach(review => {
      const key = String(this.getCommentId(review));
      if (!(key in storedReactions)) return;

      const reactions = this.ensureCommentReactionList(review);

      for (let i = reactions.length - 1; i >= 0; i--) {
        if (this.isCurrentUserReaction(reactions[i], idUsuario)) {
          reactions.splice(i, 1);
        }
      }

      const tipo = storedReactions[key];
      review.userReaction = tipo;

      if (tipo === 'LIKE' || tipo === 'DISLIKE') {
        reactions.push({
          id_like: Date.now() + this.getCommentId(review),
          id_comentario: this.getCommentId(review),
          id_usuario: idUsuario,
          tipo
        });
      }
    });
  }

  private saveStoredCommentReaction(comentario: any, tipo: 'LIKE' | 'DISLIKE' | null): void {
    const store = this.readStoredCommentReactions();
    const key = String(this.getCommentId(comentario));

    if (tipo) {
      store[key] = tipo;
    } else {
      delete store[key];
    }

    localStorage.setItem(this.LOCAL_REACTION_STORAGE_KEY, JSON.stringify(store));
  }

  private readStoredCommentReactions(): { [key: string]: 'LIKE' | 'DISLIKE' } {
    const raw = localStorage.getItem(this.LOCAL_REACTION_STORAGE_KEY);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private readStoredReviews(): { [key: string]: any[] } {
    const raw = localStorage.getItem(this.LOCAL_REVIEW_STORAGE_KEY);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private getStoredProviderKey(provider: any): string {
    return String(
      provider?.idProveedor
      ?? provider?.id_proveedor
      ?? provider?.idProvider
      ?? provider?.id
      ?? provider?.razonSocial
      ?? provider?.razon_social
      ?? provider?.nombreProveedor
      ?? provider?.nombre
      ?? 'proveedor'
    ).trim().toLowerCase();
  }

  private mergeReviews(baseReviews: any[], storedReviews: any[]): any[] {
    const reviewMap = new Map<string, any>();

    [...storedReviews, ...baseReviews].forEach((review, index) => {
      const key = String(review?.id_comentario ?? review?.idComentario ?? review?.id ?? index);
      if (!reviewMap.has(key)) {
        reviewMap.set(key, review);
      }
    });

    return Array.from(reviewMap.values());
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
    if (Array.isArray(value) || typeof value === 'object') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizePercent(value: number | null): number | null {
    if (value === null) return null;
    const normalized = value > 0 && value <= 1 ? value * 100 : value;
    return this.progressValue(normalized);
  }

  private calculateScoringGeneral(
    satisfaccion: number,
    cumplimiento: number | null,
    entregasATiempo: number | null
  ): number {
    const values = [satisfaccion, cumplimiento, entregasATiempo]
      .filter((value): value is number => value !== null && value !== undefined);

    if (!values.length) return 0;

    const total = values.reduce((sum, value) => sum + value, 0);
    return this.progressValue(total / values.length);
  }

  private isPositiveStatus(value: any): boolean {
    const status = String(value || '').trim().toUpperCase();
    return ['ACTIVO', 'VERIFICADO', 'VERIFIED', 'ACTIVE'].includes(status);
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
    if (!this.product) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    this.router.navigate(['/app/rfq/product', this.product?.idProducto], {
      state: { product: this.product }
    });
  }
}
