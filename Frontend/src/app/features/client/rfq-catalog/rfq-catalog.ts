import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-catalog.html',
  styleUrl: './rfq-catalog.scss'
})
export class RfqCatalogComponent implements OnInit {
  products: any[] = [];
  productsOriginal: any[] = [];
  requestItems: any[] = [];
  filtros: any = { categorias: [], marcas: [] };
  mostrarSolicitudMovil = false;
  mostrarFiltros = false;
  loadingProducts = true;
  loadingFilters = true;
  searchingProviders = false;
  searchTerm = '';
  activeTab: 'productos' | 'proveedores' = 'productos';
  topProviders: any[] = [];
  usarTopProveedoresSimulado = true;
  topProvidersSimulados: any[] = [
    {
      idProveedor: 1,
      ranking: 1,
      razonSocial: 'Tech Solutions S.A.C.',
      categoriaPrincipal: 'Laptops y accesorios',
      ubicacion: 'Lima, Peru',
      verificado: true,
      desde: '2021',
      pedidosCompletados: 1280,
      entregasATiempo: 98,
      tiempoRespuesta: '< 2 horas',
      tiempoEntregaPromedio: 2,
      cumplimiento: 98,
      descripcion: 'Proveedor especializado en equipos corporativos, renovacion de laptops y soporte de abastecimiento B2B.',
      comentarios: [
        {
          id_comentario: 1,
          id_prov_prod: 101,
          id_usuario: 12,
          comentario: 'Proveedor cumplido, entrego dentro del plazo acordado.',
          tipo: 'LIKE',
          fecha: '2026-05-20',
          likes: [
            { id_like: 1, id_comentario: 1, id_usuario: 15, tipo: 'LIKE' },
            { id_like: 2, id_comentario: 1, id_usuario: 18, tipo: 'LIKE' },
            { id_like: 3, id_comentario: 1, id_usuario: 21, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 2,
          id_prov_prod: 102,
          id_usuario: 18,
          comentario: 'Buena comunicacion comercial y stock confirmado antes de emitir la orden.',
          tipo: 'LIKE',
          fecha: '2026-05-18',
          likes: [
            { id_like: 4, id_comentario: 2, id_usuario: 22, tipo: 'LIKE' },
            { id_like: 5, id_comentario: 2, id_usuario: 24, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 3,
          id_prov_prod: 103,
          id_usuario: 27,
          comentario: 'Un lote llego con documentacion incompleta, pero lo corrigieron rapido.',
          tipo: 'DISLIKE',
          fecha: '2026-05-11',
          likes: [
            { id_like: 6, id_comentario: 3, id_usuario: 30, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 2,
      ranking: 2,
      razonSocial: 'Andes Network Group',
      categoriaPrincipal: 'Redes empresariales',
      ubicacion: 'Arequipa, Peru',
      verificado: true,
      desde: '2020',
      pedidosCompletados: 1145,
      entregasATiempo: 97,
      tiempoRespuesta: '< 3 horas',
      tiempoEntregaPromedio: 3,
      cumplimiento: 97,
      descripcion: 'Partner B2B para switches, routers y proyectos de conectividad de sedes corporativas.',
      comentarios: [
        {
          id_comentario: 4,
          id_prov_prod: 201,
          id_usuario: 31,
          comentario: 'Cotizacion clara y tiempos reales para equipos de red.',
          tipo: 'LIKE',
          fecha: '2026-05-21',
          likes: [
            { id_like: 7, id_comentario: 4, id_usuario: 34, tipo: 'LIKE' },
            { id_like: 8, id_comentario: 4, id_usuario: 36, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 5,
          id_prov_prod: 202,
          id_usuario: 33,
          comentario: 'Cumplieron la entrega de routers para una implementacion urgente.',
          tipo: 'LIKE',
          fecha: '2026-05-16',
          likes: [
            { id_like: 9, id_comentario: 5, id_usuario: 35, tipo: 'LIKE' },
            { id_like: 10, id_comentario: 5, id_usuario: 38, tipo: 'LIKE' },
            { id_like: 11, id_comentario: 5, id_usuario: 39, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 6,
          id_prov_prod: 203,
          id_usuario: 41,
          comentario: 'El soporte postventa respondio el mismo dia.',
          tipo: 'LIKE',
          fecha: '2026-05-09',
          likes: [
            { id_like: 12, id_comentario: 6, id_usuario: 44, tipo: 'LIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 3,
      ranking: 3,
      razonSocial: 'Importaciones Digitales Peru',
      categoriaPrincipal: 'Monitores y perifericos',
      ubicacion: 'Lima, Peru',
      verificado: true,
      desde: '2019',
      pedidosCompletados: 980,
      entregasATiempo: 96,
      tiempoRespuesta: '< 4 horas',
      tiempoEntregaPromedio: 2.5,
      cumplimiento: 96,
      descripcion: 'Distribuidor enfocado en perifericos, pantallas corporativas y accesorios de productividad.',
      comentarios: [
        {
          id_comentario: 7,
          id_prov_prod: 301,
          id_usuario: 51,
          comentario: 'Buena disponibilidad de monitores para compra por volumen.',
          tipo: 'LIKE',
          fecha: '2026-05-19',
          likes: [
            { id_like: 13, id_comentario: 7, id_usuario: 52, tipo: 'LIKE' },
            { id_like: 14, id_comentario: 7, id_usuario: 54, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 8,
          id_prov_prod: 302,
          id_usuario: 55,
          comentario: 'El embalaje llego en buen estado y con guias completas.',
          tipo: 'LIKE',
          fecha: '2026-05-14',
          likes: [
            { id_like: 15, id_comentario: 8, id_usuario: 57, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 9,
          id_prov_prod: 303,
          id_usuario: 58,
          comentario: 'Tuvieron una demora menor por reposicion de stock.',
          tipo: 'DISLIKE',
          fecha: '2026-05-06',
          likes: [
            { id_like: 16, id_comentario: 9, id_usuario: 61, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 4,
      ranking: 4,
      razonSocial: 'Data Center Supply S.R.L.',
      categoriaPrincipal: 'Servidores y almacenamiento',
      ubicacion: 'Lima, Peru',
      verificado: true,
      desde: '2022',
      pedidosCompletados: 740,
      entregasATiempo: 95,
      tiempoRespuesta: '< 3 horas',
      tiempoEntregaPromedio: 4,
      cumplimiento: 96,
      descripcion: 'Proveedor de infraestructura critica, servidores, discos empresariales y componentes para datacenter.',
      comentarios: [
        {
          id_comentario: 10,
          id_prov_prod: 401,
          id_usuario: 64,
          comentario: 'Buen manejo tecnico de compatibilidades para servidores.',
          tipo: 'LIKE',
          fecha: '2026-05-22',
          likes: [
            { id_like: 17, id_comentario: 10, id_usuario: 66, tipo: 'LIKE' },
            { id_like: 18, id_comentario: 10, id_usuario: 69, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 11,
          id_prov_prod: 402,
          id_usuario: 67,
          comentario: 'Entregaron discos certificados con trazabilidad.',
          tipo: 'LIKE',
          fecha: '2026-05-13',
          likes: [
            { id_like: 19, id_comentario: 11, id_usuario: 70, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 12,
          id_prov_prod: 403,
          id_usuario: 71,
          comentario: 'La validacion inicial tomo mas tiempo del previsto.',
          tipo: 'DISLIKE',
          fecha: '2026-05-05',
          likes: [
            { id_like: 20, id_comentario: 12, id_usuario: 72, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 5,
      ranking: 5,
      razonSocial: 'Cloud Hardware Partners',
      categoriaPrincipal: 'Infraestructura cloud',
      ubicacion: 'Trujillo, Peru',
      verificado: true,
      desde: '2021',
      pedidosCompletados: 690,
      entregasATiempo: 94,
      tiempoRespuesta: '< 5 horas',
      tiempoEntregaPromedio: 5,
      cumplimiento: 94,
      descripcion: 'Abastecimiento de hardware para nube privada, virtualizacion y ampliacion de capacidad.',
      comentarios: [
        {
          id_comentario: 13,
          id_prov_prod: 501,
          id_usuario: 76,
          comentario: 'Respondieron rapido con alternativas equivalentes.',
          tipo: 'LIKE',
          fecha: '2026-05-17',
          likes: [
            { id_like: 21, id_comentario: 13, id_usuario: 78, tipo: 'LIKE' },
            { id_like: 22, id_comentario: 13, id_usuario: 80, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 14,
          id_prov_prod: 502,
          id_usuario: 79,
          comentario: 'La propuesta tecnica estuvo bien sustentada.',
          tipo: 'LIKE',
          fecha: '2026-05-12',
          likes: [
            { id_like: 23, id_comentario: 14, id_usuario: 81, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 15,
          id_prov_prod: 503,
          id_usuario: 82,
          comentario: 'Falto mayor detalle en la fecha exacta de entrega.',
          tipo: 'DISLIKE',
          fecha: '2026-05-04',
          likes: [
            { id_like: 24, id_comentario: 15, id_usuario: 84, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 6,
      ranking: 6,
      razonSocial: 'SecureTech Mayoristas',
      categoriaPrincipal: 'Seguridad y firewalls',
      ubicacion: 'Lima, Peru',
      verificado: true,
      desde: '2018',
      pedidosCompletados: 860,
      entregasATiempo: 93,
      tiempoRespuesta: '< 2 horas',
      tiempoEntregaPromedio: 3.5,
      cumplimiento: 94,
      descripcion: 'Mayorista de seguridad perimetral, licenciamiento y appliances para redes corporativas.',
      comentarios: [
        {
          id_comentario: 16,
          id_prov_prod: 601,
          id_usuario: 86,
          comentario: 'Muy buen soporte para seleccionar firewall por capacidad.',
          tipo: 'LIKE',
          fecha: '2026-05-18',
          likes: [
            { id_like: 25, id_comentario: 16, id_usuario: 88, tipo: 'LIKE' },
            { id_like: 26, id_comentario: 16, id_usuario: 90, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 17,
          id_prov_prod: 602,
          id_usuario: 89,
          comentario: 'El licenciamiento llego activado y documentado.',
          tipo: 'LIKE',
          fecha: '2026-05-10',
          likes: [
            { id_like: 27, id_comentario: 17, id_usuario: 91, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 18,
          id_prov_prod: 603,
          id_usuario: 93,
          comentario: 'El precio final cambio por disponibilidad de modelo.',
          tipo: 'DISLIKE',
          fecha: '2026-05-03',
          likes: [
            { id_like: 28, id_comentario: 18, id_usuario: 94, tipo: 'DISLIKE' },
            { id_like: 29, id_comentario: 18, id_usuario: 95, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 7,
      ranking: 7,
      razonSocial: 'OfiTech Corporate',
      categoriaPrincipal: 'Equipamiento de oficina',
      ubicacion: 'Chiclayo, Peru',
      verificado: true,
      desde: '2020',
      pedidosCompletados: 620,
      entregasATiempo: 92,
      tiempoRespuesta: '< 6 horas',
      tiempoEntregaPromedio: 4.5,
      cumplimiento: 92,
      descripcion: 'Proveedor de equipamiento tecnologico para oficinas, salas de reunion y usuarios finales.',
      comentarios: [
        {
          id_comentario: 19,
          id_prov_prod: 701,
          id_usuario: 97,
          comentario: 'Buen seguimiento de pedido y despacho por sedes.',
          tipo: 'LIKE',
          fecha: '2026-05-15',
          likes: [
            { id_like: 30, id_comentario: 19, id_usuario: 99, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 20,
          id_prov_prod: 702,
          id_usuario: 100,
          comentario: 'Atencion correcta para compras recurrentes.',
          tipo: 'LIKE',
          fecha: '2026-05-08',
          likes: [
            { id_like: 31, id_comentario: 20, id_usuario: 101, tipo: 'LIKE' },
            { id_like: 32, id_comentario: 20, id_usuario: 102, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 21,
          id_prov_prod: 703,
          id_usuario: 103,
          comentario: 'Un accesorio se reemplazo despues de la entrega.',
          tipo: 'DISLIKE',
          fecha: '2026-05-02',
          likes: [
            { id_like: 33, id_comentario: 21, id_usuario: 104, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 8,
      ranking: 8,
      razonSocial: 'Global Components Peru',
      categoriaPrincipal: 'Componentes y repuestos',
      ubicacion: 'Lima, Peru',
      verificado: false,
      desde: '2023',
      pedidosCompletados: 410,
      entregasATiempo: 91,
      tiempoRespuesta: '< 8 horas',
      tiempoEntregaPromedio: 6,
      cumplimiento: 91,
      descripcion: 'Proveedor de repuestos, memorias, fuentes y componentes para mantenimiento de parque tecnologico.',
      comentarios: [
        {
          id_comentario: 22,
          id_prov_prod: 801,
          id_usuario: 106,
          comentario: 'Consiguieron repuestos con buen tiempo de respuesta.',
          tipo: 'LIKE',
          fecha: '2026-05-14',
          likes: [
            { id_like: 34, id_comentario: 22, id_usuario: 108, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 23,
          id_prov_prod: 802,
          id_usuario: 109,
          comentario: 'La compatibilidad fue validada antes del envio.',
          tipo: 'LIKE',
          fecha: '2026-05-07',
          likes: [
            { id_like: 35, id_comentario: 23, id_usuario: 110, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 24,
          id_prov_prod: 803,
          id_usuario: 111,
          comentario: 'No todos los repuestos estaban disponibles al cierre de compra.',
          tipo: 'DISLIKE',
          fecha: '2026-05-01',
          likes: [
            { id_like: 36, id_comentario: 24, id_usuario: 112, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 9,
      ranking: 9,
      razonSocial: 'Norte Telecom S.A.C.',
      categoriaPrincipal: 'Telecomunicaciones',
      ubicacion: 'Piura, Peru',
      verificado: true,
      desde: '2022',
      pedidosCompletados: 540,
      entregasATiempo: 90,
      tiempoRespuesta: '< 5 horas',
      tiempoEntregaPromedio: 5.5,
      cumplimiento: 90,
      descripcion: 'Abastecimiento de equipos de telecomunicaciones, enlaces y accesorios para redes distribuidas.',
      comentarios: [
        {
          id_comentario: 25,
          id_prov_prod: 901,
          id_usuario: 113,
          comentario: 'Buen acompanamiento para compras de enlaces y radios.',
          tipo: 'LIKE',
          fecha: '2026-05-13',
          likes: [
            { id_like: 37, id_comentario: 25, id_usuario: 115, tipo: 'LIKE' },
            { id_like: 38, id_comentario: 25, id_usuario: 117, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 26,
          id_prov_prod: 902,
          id_usuario: 116,
          comentario: 'La entrega a provincia fue coordinada correctamente.',
          tipo: 'LIKE',
          fecha: '2026-05-06',
          likes: [
            { id_like: 39, id_comentario: 26, id_usuario: 118, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 27,
          id_prov_prod: 903,
          id_usuario: 119,
          comentario: 'Hubo retraso en una guia de transporte.',
          tipo: 'DISLIKE',
          fecha: '2026-04-29',
          likes: [
            { id_like: 40, id_comentario: 27, id_usuario: 120, tipo: 'DISLIKE' }
          ]
        }
      ]
    },
    {
      idProveedor: 10,
      ranking: 10,
      razonSocial: 'Sur IT Logistics',
      categoriaPrincipal: 'Logistica tecnologica',
      ubicacion: 'Cusco, Peru',
      verificado: true,
      desde: '2021',
      pedidosCompletados: 470,
      entregasATiempo: 89,
      tiempoRespuesta: '< 6 horas',
      tiempoEntregaPromedio: 6.5,
      cumplimiento: 89,
      descripcion: 'Proveedor orientado a despacho, consolidacion y entrega de equipos tecnologicos para sedes regionales.',
      comentarios: [
        {
          id_comentario: 28,
          id_prov_prod: 1001,
          id_usuario: 121,
          comentario: 'Buen control de despacho para sedes fuera de Lima.',
          tipo: 'LIKE',
          fecha: '2026-05-12',
          likes: [
            { id_like: 41, id_comentario: 28, id_usuario: 123, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 29,
          id_prov_prod: 1002,
          id_usuario: 124,
          comentario: 'Mantuvieron informado el avance de la entrega.',
          tipo: 'LIKE',
          fecha: '2026-05-04',
          likes: [
            { id_like: 42, id_comentario: 29, id_usuario: 126, tipo: 'LIKE' }
          ]
        },
        {
          id_comentario: 30,
          id_prov_prod: 1003,
          id_usuario: 127,
          comentario: 'La entrega final tomo un dia adicional.',
          tipo: 'DISLIKE',
          fecha: '2026-04-28',
          likes: [
            { id_like: 43, id_comentario: 30, id_usuario: 128, tipo: 'DISLIKE' }
          ]
        }
      ]
    }
  ];
  readonly skeletonCards = Array.from({ length: 8 });
  imageLoadFailures: { [key: number]: boolean } = {};

  selectedCategories: number[] = [];
  selectedBrands: number[] = [];
  specsPorCategoria: { [key: number]: string } = {};

  precioMin: number | null = null;
  precioMax: number | null = null;
  prioridad: string = 'BALANCEADO';

  currentPage: number = 1;
  pageSize: number = 8;

  private readonly API_BASE = APP_API_BASE_URL;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarCarritoLocal();
    this.route.queryParamMap.subscribe(params => {
      this.searchTerm = params.get('search')?.trim() || '';
      this.currentPage = 1;
      this.aplicarBusquedaLocal();
    });
    this.cargarFiltrosDisponibles();
    this.aplicarFiltrosRefinado();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(APP_STORAGE_KEYS.token);
    return new HttpHeaders({ 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarCarritoLocal(): void {
    const saved = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    if (saved) this.requestItems = JSON.parse(saved);
  }

  guardarCarritoLocal(): void {
    localStorage.setItem(APP_STORAGE_KEYS.rfqCart, JSON.stringify(this.requestItems));
  }

  cargarFiltrosDisponibles(): void {
    this.loadingFilters = true;

    this.http.get<any>(`${this.API_BASE}/productos/filtros`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.filtros = res;
        this.loadingFilters = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar filtros', err);
        this.loadingFilters = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltrosRefinado(): void {
    this.loadingProducts = true;

    const listaSpecs = Object.values(this.specsPorCategoria).filter(
      s => s && s.trim() !== ''
    );

    const body = {
      categorias: this.selectedCategories.length > 0 ? this.selectedCategories : null,
      marcas: this.selectedBrands.length > 0 ? this.selectedBrands : null,
      especificaciones: listaSpecs
    };

    this.http.post<any[]>(
      `${this.API_BASE}/productos/catalogo/filtrado`,
      body,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.productsOriginal = res || [];
        this.actualizarTopProviders();
        this.aplicarBusquedaLocal();
        this.currentPage = 1;
        this.loadingProducts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al filtrar', err);
        this.products = [];
        this.productsOriginal = [];
        this.actualizarTopProviders();
        this.loadingProducts = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarBusquedaLocal(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.products = [...this.productsOriginal];
      this.currentPage = 1;
      this.cdr.detectChanges();
      return;
    }

    this.products = this.productsOriginal.filter(product => {
      const specs = (product.especificaciones || [])
        .map((spec: any) => `${spec?.nombre || ''} ${spec?.valor || ''}`)
        .join(' ');

      return [
        product.producto,
        product.marca,
        product.categoria,
        product.descripcion,
        specs
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });

    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  toggleFiltro(tipo: 'cat' | 'marca', id: number): void {
    const list = tipo === 'cat' ? this.selectedCategories : this.selectedBrands;
    const index = list.indexOf(id);

    if (index > -1) {
      list.splice(index, 1);

      if (tipo === 'cat') {
        delete this.specsPorCategoria[id];
      }
    } else {
      list.push(id);
    }
  }

  get totalPages(): number {
    return Math.ceil(this.products.length / this.pageSize);
  }

  get paginatedProducts(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo(0, 0);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo(0, 0);
    }
  }

  verDetalle(product: any): void {
    this.router.navigate(['/app/rfq/product', product.idProducto], {
      state: { product }
    });
  }

  agregarProducto(product: any): void {
    const existe = this.requestItems.find(x => x.idProducto === product.idProducto);

    if (!existe) {
      this.requestItems.push({
        idProducto: product.idProducto,
        name: product.producto,
        detail: `${product.marca} - ${product.descripcion?.substring(0, 30)}...`,
        qty: 1,
        precioReferencia: product.precioUnitario ?? null,
        categoria: product.categoria,
        marca: product.marca
      });
    } else {
      existe.qty++;
    }

    this.guardarCarritoLocal();
    this.cdr.detectChanges();
  }

  aumentar(item: any): void {
    item.qty++;
    this.guardarCarritoLocal();
  }

  disminuir(item: any): void {
    if (item.qty > 1) {
      item.qty--;
    } else {
      this.eliminarDelCarrito(item);
    }

    this.guardarCarritoLocal();
  }

  eliminarDelCarrito(item: any): void {
    this.requestItems = this.requestItems.filter(
      i => i.idProducto !== item.idProducto
    );

    this.guardarCarritoLocal();
    this.cdr.detectChanges();
  }

  toggleSolicitudMovil(): void {
    this.mostrarSolicitudMovil = !this.mostrarSolicitudMovil;
  }

  cerrarSolicitudMovil(): void {
    this.mostrarSolicitudMovil = false;
  }

  buscarProveedoresRFQ(): void {
    if (this.searchingProviders) {
      return;
    }

    this.searchingProviders = true;

    const request = {
      items: this.requestItems.map(i => ({
        idProducto: i.idProducto,
        cantidad: i.qty
      })),
      filtro: {
        precioMin: this.precioMin,
        precioMax: this.precioMax,
        marcas: this.selectedBrands,
        categorias: this.selectedCategories
      },
      prioridad: this.prioridad
    };

    this.http.post(
      `${this.API_BASE}/rfq/buscar-proveedores`,
      request,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        this.router.navigate(['/app/rfq/results'], {
          state: { proveedores: res }
        });
      },
      error: (err) => {
        console.error('Error al buscar proveedores', err);
        this.searchingProviders = false;
        this.cdr.detectChanges();
        alert('No se encontraron proveedores que cumplan con los requisitos de tu carrito.');
      }
    });
  }

  get activeFilterCount(): number {
    const specsActivas = Object.values(this.specsPorCategoria)
      .filter(spec => spec && spec.trim() !== '').length;

    return this.selectedCategories.length + this.selectedBrands.length + specsActivas;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  cerrarFiltros(): void {
    this.mostrarFiltros = false;
  }

  aplicarFiltrosDesdePanel(): void {
    this.aplicarFiltrosRefinado();
    this.cerrarFiltros();
  }

  limpiarFiltros(): void {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.specsPorCategoria = {};
    this.currentPage = 1;
    this.aplicarFiltrosRefinado();
    this.cerrarFiltros();
  }

  setActiveTab(tab: 'productos' | 'proveedores'): void {
    this.activeTab = tab;

    if (tab === 'proveedores') {
      this.actualizarTopProviders();
    }

    this.cdr.detectChanges();
  }

  verResenasProveedor(proveedor: any): void {
    this.router.navigate(['/app/rfq/provider-reviews'], {
      state: {
        proveedor,
        origen: this.usarTopProveedoresSimulado ? 'TOP_PROVEEDORES_SIMULADO' : 'TOP_PROVEEDORES'
      }
    });
  }

  normalizarProveedor(item: any): any {
    const reviews = this.getProviderReviews(item);
    const likes = this.getReactionCount(item, 'LIKE');
    const dislikes = this.getReactionCount(item, 'DISLIKE');
    const totalResenas = this.firstNumber(item, [
      'totalResenas',
      'total_resenas',
      'cantidadResenas',
      'cantidad_resenas',
      'cantidadReviews',
      'totalReviews',
      'numeroResenas',
      'comentariosTotal',
      'totalComentarios'
    ]) ?? reviews.length;
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
      estado,
      totalResenas,
      totalComentarios: totalResenas,
      likes,
      dislikes,
      totalLikes: likes,
      totalDislikes: dislikes,
      satisfaccion,
      scoringGeneral,
      ranking: this.firstNumber(item, ['ranking', 'rank', 'posicion', 'position', 'orden']),
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
      tiempoRespuesta: item?.tiempoRespuesta || item?.tiempo_respuesta || item?.tiempoRespuestaPromedio,
      verificado
    };
  }

  getTopProviderProgress(value: number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Math.max(0, Math.min(100, Math.round(Number(value))));
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No disponible';
    return `${this.getTopProviderProgress(value)}%`;
  }

  formatDays(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'No disponible';
    const rounded = Math.round(Number(value) * 10) / 10;
    return `${rounded} dia${rounded === 1 ? '' : 's'}`;
  }

  private actualizarTopProviders(): void {
    const candidates = this.usarTopProveedoresSimulado
      ? this.topProvidersSimulados
      : this.getProviderCandidatesFromProducts(this.productsOriginal);
    const normalized = candidates
      .map(item => this.normalizarProveedor(item))
      .filter(provider => !!provider.razonSocial);

    this.topProviders = this.sortTopProviders(this.mergeProviders(normalized)).slice(0, 10);
  }

  private getProviderCandidatesFromProducts(products: any[]): any[] {
    const candidates: any[] = [];

    (products || []).forEach(product => {
      [
        product?.proveedores,
        product?.providers,
        product?.proveedoresAsociados,
        product?.proveedoresDisponibles,
        product?.proveedoresRFQ
      ]
        .filter(Array.isArray)
        .forEach((list: any) => {
          list.forEach((provider: any) => {
            candidates.push({
              categoria: product?.categoria,
              tiempoEntregaDias: product?.tiempoEntregaDias,
              ...provider
            });
          });
        });

      const directProviderName = product?.razonSocial
        || product?.razon_social
        || product?.nombreProveedor
        || product?.nombre_proveedor
        || product?.proveedorPrincipal
        || product?.proveedor_principal
        || product?.proveedor;

      if (directProviderName || product?.idProveedor || product?.id_proveedor) {
        candidates.push({
          ...product,
          razonSocial: directProviderName,
          categoriaPrincipal: product?.categoriaPrincipal || product?.categoria_principal || product?.categoria
        });
      }
    });

    return candidates;
  }

  private mergeProviders(providers: any[]): any[] {
    const providerMap = new Map<string, any>();

    providers.forEach((provider, index) => {
      const key = String(provider.idProveedor || provider.razonSocial).trim().toLowerCase();
      const current = providerMap.get(key);

      if (!current) {
        providerMap.set(key, { ...provider, ordenOriginal: index });
        return;
      }

      current.totalResenas = Math.max(current.totalResenas || 0, provider.totalResenas || 0);
      current.likes = Math.max(current.likes || 0, provider.likes || 0);
      current.dislikes = Math.max(current.dislikes || 0, provider.dislikes || 0);
      current.satisfaccion = this.calculateSatisfaction(current.likes, current.dislikes);
      current.cumplimiento = this.pickBestPercent(current.cumplimiento, provider.cumplimiento);
      current.tiempoEntregaPromedio = this.pickShortestTime(
        current.tiempoEntregaPromedio,
        provider.tiempoEntregaPromedio
      );
      current.verificado = current.verificado || provider.verificado;
      current.estado = current.estado || provider.estado;
      current.categoriaPrincipal = current.categoriaPrincipal || provider.categoriaPrincipal;
    });

    return Array.from(providerMap.values());
  }

  private sortTopProviders(providers: any[]): any[] {
    const hasExplicitRanking = providers.some(provider => provider.ranking !== null && provider.ranking !== undefined);

    if (hasExplicitRanking) {
      return [...providers].sort((a, b) => {
        const aRanking = a.ranking ?? Number.POSITIVE_INFINITY;
        const bRanking = b.ranking ?? Number.POSITIVE_INFINITY;
        if (aRanking !== bRanking) return aRanking - bRanking;
        return (a.ordenOriginal || 0) - (b.ordenOriginal || 0);
      });
    }

    return [...providers].sort((a, b) => {
      const satisfactionDiff = (b.satisfaccion || 0) - (a.satisfaccion || 0);
      if (satisfactionDiff !== 0) return satisfactionDiff;

      const reviewsDiff = (b.totalResenas || 0) - (a.totalResenas || 0);
      if (reviewsDiff !== 0) return reviewsDiff;

      const complianceDiff = (b.cumplimiento ?? -1) - (a.cumplimiento ?? -1);
      if (complianceDiff !== 0) return complianceDiff;

      const aDelivery = a.tiempoEntregaPromedio ?? Number.POSITIVE_INFINITY;
      const bDelivery = b.tiempoEntregaPromedio ?? Number.POSITIVE_INFINITY;
      if (aDelivery !== bDelivery) return aDelivery - bDelivery;

      return (a.ordenOriginal || 0) - (b.ordenOriginal || 0);
    });
  }

  private getProviderReviews(source: any): any[] {
    const reviews = source?.reviews
      ?? source?.resenas
      ?? source?.['rese\u00f1as']
      ?? source?.evaluaciones
      ?? source?.comentarios
      ?? source?.comments
      ?? [];

    return Array.isArray(reviews) ? reviews : [];
  }

  private getReactionCount(source: any, type: 'LIKE' | 'DISLIKE'): number {
    const directKeys = type === 'LIKE'
      ? ['likes', 'totalLikes', 'total_likes', 'cantidadLikes', 'cantidad_likes', 'likeCount', 'likesCount']
      : ['dislikes', 'totalDislikes', 'total_dislikes', 'cantidadDislikes', 'cantidad_dislikes', 'dislikeCount', 'dislikesCount'];
    const direct = this.firstNumber(source, directKeys);

    if (direct !== null) return direct;

    const directList = type === 'LIKE' ? source?.likes : source?.dislikes;
    if (Array.isArray(directList)) return directList.length;

    const reviewMatches = this.getProviderReviews(source)
      .filter(review => this.getReactionType(review) === type)
      .length;
    const reactionMatches = this.getReactionList(source)
      .filter(reaction => this.getReactionType(reaction) === type)
      .length;

    return reviewMatches + reactionMatches;
  }

  private getReactionList(source: any): any[] {
    const directLists = [
      source?.reacciones,
      source?.reactions,
      source?.likesComentarios,
      source?.reaccionesComentarios
    ].filter(Array.isArray);
    const reviewLists = this.getProviderReviews(source)
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

  private normalizePercent(value: number | null): number | null {
    if (value === null) return null;
    const normalized = value > 0 && value <= 1 ? value * 100 : value;
    return this.getTopProviderProgress(normalized);
  }

  private calculateSatisfaction(likes: number, dislikes: number): number {
    const total = likes + dislikes;
    return total > 0 ? Math.round((likes / total) * 100) : 0;
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
    return this.getTopProviderProgress(total / values.length);
  }

  private pickBestPercent(current: number | null, incoming: number | null): number | null {
    if (current === null || current === undefined) return incoming ?? null;
    if (incoming === null || incoming === undefined) return current;
    return Math.max(current, incoming);
  }

  private pickShortestTime(current: number | null, incoming: number | null): number | null {
    if (current === null || current === undefined) return incoming ?? null;
    if (incoming === null || incoming === undefined) return current;
    return Math.min(current, incoming);
  }

  private isPositiveStatus(value: any): boolean {
    const status = String(value || '').trim().toUpperCase();
    return ['ACTIVO', 'VERIFICADO', 'VERIFIED', 'ACTIVE'].includes(status);
  }

  getProductImage(product: any): string | null {
    const productId = product?.idProducto;

    if (productId && this.imageLoadFailures[productId]) {
      return null;
    }

    const img = product?.imagenes?.[0];
    return img?.URL || img?.url || null;
  }

  markImageAsFailed(product: any): void {
    if (product?.idProducto) {
      this.imageLoadFailures[product.idProducto] = true;
      this.cdr.detectChanges();
    }
  }

  getPrimarySpec(product: any): any | null {
    return product?.especificaciones?.find((spec: any) => spec?.nombre || spec?.valor) ?? null;
  }
}
