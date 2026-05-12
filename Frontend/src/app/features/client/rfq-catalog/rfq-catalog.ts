import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rfq-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './rfq-catalog.html',
  styleUrl: './rfq-catalog.scss'
})
export class RfqCatalogComponent implements OnInit {
  products: any[] = [];
  requestItems: any[] = [];
  filtros: any = { categorias: [], marcas: [] };
  
  selectedCategories: number[] = [];
  selectedBrands: number[] = [];
  specsPorCategoria: { [key: number]: string } = {};
  
  precioMin: number | null = null;
  precioMax: number | null = null;
  prioridad: string = 'BALANCEADO';
  
  currentPage: number = 1;
  pageSize: number = 8;

  private readonly API_BASE = 'https://proyectoinnovacion.onrender.com/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCarritoLocal();
    this.cargarFiltrosDisponibles();
    this.aplicarFiltrosRefinado();
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

  cargarFiltrosDisponibles(): void {
    this.http.get<any>(`${this.API_BASE}/productos/filtros`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.filtros = res;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltrosRefinado(): void {
    const listaSpecs = Object.values(this.specsPorCategoria).filter(s => s && s.trim() !== '');

    const body = {
      categorias: this.selectedCategories.length > 0 ? this.selectedCategories : null,
      marcas: this.selectedBrands.length > 0 ? this.selectedBrands : null,
      especificaciones: listaSpecs
    };
    
    this.http.post<any[]>(`${this.API_BASE}/productos/catalogo/filtrado`, body, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.products = res;
          this.currentPage = 1;
          this.cdr.detectChanges();
        },
        error: () => console.error("Error al filtrar")
      });
  }

  toggleFiltro(tipo: 'cat' | 'marca', id: number): void {
    const list = tipo === 'cat' ? this.selectedCategories : this.selectedBrands;
    const index = list.indexOf(id);
    if (index > -1) {
      list.splice(index, 1);
      if (tipo === 'cat') delete this.specsPorCategoria[id];
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

  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; window.scrollTo(0,0); } }
  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; window.scrollTo(0,0); } }

  agregarProducto(product: any): void {
    const existe = this.requestItems.find(x => x.idProducto === product.idProducto);
    if (!existe) {
      this.requestItems.push({
        idProducto: product.idProducto,
        name: product.producto,
        detail: `${product.marca} • ${product.descripcion?.substring(0,30)}...`,
        qty: 1
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
    if (item.qty > 1) item.qty--; 
    else this.eliminarDelCarrito(item);
    this.guardarCarritoLocal(); 
  }

  eliminarDelCarrito(item: any): void {
    this.requestItems = this.requestItems.filter(i => i.idProducto !== item.idProducto);
    this.guardarCarritoLocal();
    this.cdr.detectChanges();
  }

  buscarProveedoresRFQ(): void {
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

    this.http.post(`${this.API_BASE}/rfq/buscar-proveedores`, request, { headers: this.getHeaders() })
      .subscribe({
        next: (res: any) => {
          this.router.navigate(['/app/rfq/results'], { state: { proveedores: res } });
        },
        error: (err) => {
          console.error("Error al buscar proveedores", err);
          alert('No se encontraron proveedores que cumplan con los requisitos de tu carrito.');
        }
      });
  }
}
