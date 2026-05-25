import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface ReviewLocal {
  autor: string;
  rating: number;
  comentario: string;
  fecha: string;
  verificado: boolean;
}

@Component({
  selector: 'app-provider-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './provider-reviews.html',
  styleUrl: './provider-reviews.scss'
})
export class ProviderReviewsComponent implements OnInit {

  product: any = null;
  requestItems: any[] = [];
  qty: number = 1;

  // Datos de proveedor simulados (en producción vendrían del backend)
  // CONEXIÓN FUTURA: GET /api/proveedores/{id}/perfil cuando el endpoint esté disponible
  proveedor: any = null;
  loadingProveedor: boolean = true;

  // Reseñas locales de demostración
  // CONEXIÓN FUTURA: GET /api/evaluaciones/proveedor/{id} cuando el endpoint esté disponible
  reviews: ReviewLocal[] = [];
  reviewsFiltradas: ReviewLocal[] = [];

  // Formulario de nueva reseña
  nuevaResenaRating: number = 0;
  nuevaResenaHover: number = 0;
  nuevaResenaTexto: string = '';
  resenaEnviada: boolean = false;

  // Filtros de reseñas
  filtroEstrellas: number = 0; // 0 = todas
  ordenResenas: 'reciente' | 'calidad' = 'reciente';

  // Oferta del producto
  proveedorProducto: any = null;

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state?.['product']
      ?? history.state?.['product'];
    if (state) this.product = state;
  }

  ngOnInit(): void {
    this.cargarCarritoLocal();
    if (!this.product) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }
    this.cargarDatosProveedor();
    this.generarReseñasDemo();
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

  // CONEXIÓN FUTURA: cuando exista GET /api/proveedores/{id} se reemplaza este mock
  cargarDatosProveedor(): void {
    // Intentar cargar proveedores reales desde el RFQ scoring
    // Por ahora se usan datos de demostración basados en el producto
    this.proveedor = {
      nombre: 'Global Tech IT SAC',
      scoringGeneral: 98,
      certificacion: 'Cisco Gold Certified Partner',
      ubicacion: 'Lima, Perú',
      desde: 2021,
      descripcion: 'Distribuidor autorizado con más de 15 años de experiencia en equipos de red y telecomunicaciones para el sector empresarial peruano.',
      totalPedidos: 1247,
      tasaEntregaOportuna: 96.8,
      tasaSatisfaccion: 98.4,
      tiempoRespuesta: '< 2 horas',
      scoreCalidad: 4.9,
      scorePrecio: 4.7,
      scoreTiempo: 4.8,
      certificaciones: ['Cisco Gold', 'HP Enterprise', 'Dell EMC', 'ISO 9001']
    };

    this.proveedorProducto = {
      nombreProducto: this.product?.producto,
      stockDisponible: this.product?.stock ?? 150,
      precioReferencia: this.product?.precioUnitario ?? 850,
      tiempoEntrega: this.product?.tiempoEntregaDias ?? 5,
      garantia: this.product?.garantiaMeses ?? 12
    };

    this.loadingProveedor = false;
    this.cdr.detectChanges();
  }

  // Reseñas de demostración para la UI
  // CONEXIÓN FUTURA: GET /api/evaluaciones/proveedor/{idProveedor}
  generarReseñasDemo(): void {
    this.reviews = [
      {
        autor: 'Ricardo Espinoza',
        rating: 5,
        comentario: 'Excelente proveedor, los productos llegaron antes del plazo estimado y la calidad es exactamente la esperada. El equipo de soporte respondió todas nuestras dudas de manera muy profesional.',
        fecha: '2025-03-15',
        verificado: true
      },
      {
        autor: 'María Torres',
        rating: 5,
        comentario: 'Tercera compra con este proveedor y siempre cumple. Los precios son competitivos y la garantía fue honrada sin problemas cuando tuvimos un equipo defectuoso.',
        fecha: '2025-02-28',
        verificado: true
      },
      {
        autor: 'Carlos Quispe',
        rating: 4,
        comentario: 'Buena experiencia en general. La entrega tardó un día más de lo indicado pero el producto llegó en perfectas condiciones y bien embalado.',
        fecha: '2025-02-10',
        verificado: true
      },
      {
        autor: 'Sofía Mendoza',
        rating: 5,
        comentario: 'Increíble nivel de servicio. Hicimos un pedido grande para renovar la infraestructura de red y todo salió perfecto. Definitivamente seguiremos trabajando con ellos.',
        fecha: '2025-01-22',
        verificado: false
      },
      {
        autor: 'Andrés Castillo',
        rating: 5,
        comentario: 'El proceso RFQ fue muy transparente. Las cotizaciones llegaron rápido y los precios por volumen que ofrecieron superaron nuestras expectativas.',
        fecha: '2025-01-08',
        verificado: true
      },
      {
        autor: 'Lucía Vargas',
        rating: 3,
        comentario: 'El producto está bien pero la comunicación podría mejorar. Tuvimos que llamar dos veces para confirmar el estado del pedido.',
        fecha: '2024-12-19',
        verificado: true
      }
    ];
    this.aplicarFiltros();
  }

  // ── Reseñas ────────────────────────────────────────────────
  get ratingPromedio(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  get ratingDistribucion(): { estrellas: number; cantidad: number; porcentaje: number }[] {
    return [5, 4, 3, 2, 1].map(e => {
      const cant = this.reviews.filter(r => r.rating === e).length;
      return {
        estrellas: e,
        cantidad: cant,
        porcentaje: this.reviews.length ? Math.round((cant / this.reviews.length) * 100) : 0
      };
    });
  }

  aplicarFiltros(): void {
    let res = [...this.reviews];
    if (this.filtroEstrellas > 0) res = res.filter(r => r.rating === this.filtroEstrellas);
    if (this.ordenResenas === 'calidad') res.sort((a, b) => b.rating - a.rating);
    else res.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.reviewsFiltradas = res;
  }

  setFiltroEstrellas(n: number): void {
    this.filtroEstrellas = this.filtroEstrellas === n ? 0 : n;
    this.aplicarFiltros();
  }

  setOrden(orden: 'reciente' | 'calidad'): void {
    this.ordenResenas = orden;
    this.aplicarFiltros();
  }

  setHoverStar(n: number): void { this.nuevaResenaHover = n; }
  clearHoverStar(): void { this.nuevaResenaHover = 0; }
  setRatingStar(n: number): void { this.nuevaResenaRating = n; }

  getStarClass(pos: number, rating: number, hover: number): string {
    const val = hover > 0 ? hover : rating;
    return pos <= val ? 'star-filled' : 'star-empty';
  }

  enviarResena(): void {
    if (!this.nuevaResenaRating || !this.nuevaResenaTexto.trim()) return;
    // CONEXIÓN FUTURA: POST /api/evaluaciones { idProveedor, rating, comentario }
    const nueva: ReviewLocal = {
      autor: 'Tú',
      rating: this.nuevaResenaRating,
      comentario: this.nuevaResenaTexto,
      fecha: new Date().toISOString().split('T')[0],
      verificado: true
    };
    this.reviews.unshift(nueva);
    this.nuevaResenaRating = 0;
    this.nuevaResenaTexto = '';
    this.resenaEnviada = true;
    this.aplicarFiltros();
    setTimeout(() => { this.resenaEnviada = false; this.cdr.detectChanges(); }, 3500);
    this.cdr.detectChanges();
  }

  // ── Carrito ────────────────────────────────────────────────
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

  volverAlDetalle(): void {
    this.router.navigate(['/app/rfq/product', this.product?.idProducto], {
      state: { product: this.product }
    });
  }

  // Helpers
  scoreColor(score: number): string {
    if (score >= 90) return 'score-green';
    if (score >= 70) return 'score-yellow';
    return 'score-red';
  }

  starArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
