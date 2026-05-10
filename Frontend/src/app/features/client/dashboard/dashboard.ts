import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  recommendedProducts: any[] = [];
  requestItems: any[] = [];

  prioridad: string = 'BALANCEADO';

  precioMin: number | null = null;
  precioMax: number | null = null;

  private API = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCarrito();
    this.cargarRecomendados();
  }

  getHeaders() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      })
    };
  }

  cargarRecomendados(): void {

    this.http.get<any[]>(
      `${this.API}/recomendados/productos`,
      this.getHeaders()
    ).subscribe({

      next: (data: any[]) => {

        this.recommendedProducts = Array.isArray(data)
          ? data
          : [];

      },

      error: () => {
        this.recommendedProducts = [];
      }

    });
  }

  cargarCarrito(): void {

    const carrito = localStorage.getItem('rfq_cart');

    if (carrito) {

      this.requestItems = JSON.parse(carrito);

    } else {

      this.requestItems = [];

    }
  }

  guardarCarrito(): void {

    localStorage.setItem(
      'rfq_cart',
      JSON.stringify(this.requestItems)
    );
  }

  agregarAlCarrito(product: any): void {

    const existe = this.requestItems.find(
      x => x.idProducto === product.idProducto
    );

    if (existe) {

      existe.qty++;

    } else {

      this.requestItems.push({
        idProducto: product.idProducto,
        name: product.producto,
        qty: 1
      });

    }

    this.guardarCarrito();
  }

  aumentar(item: any): void {

    item.qty++;

    this.guardarCarrito();
  }

  disminuir(item: any): void {

    if (item.qty > 1) {

      item.qty--;

    } else {

      this.eliminar(item);

    }

    this.guardarCarrito();
  }

  eliminar(item: any): void {

    this.requestItems = this.requestItems.filter(
      x => x.idProducto !== item.idProducto
    );

    this.guardarCarrito();
  }

  buscarProveedoresRFQ(): void {

    const request = {

      items: this.requestItems.map(i => ({
        idProducto: i.idProducto,
        cantidad: i.qty
      })),

      filtro: {
        precioMin: this.precioMin,
        precioMax: this.precioMax
      },

      prioridad: this.prioridad
    };

    this.http.post<any>(
      `${this.API}/rfq/buscar-proveedores`,
      request,
      this.getHeaders()
    ).subscribe({

      next: (res: any) => {

        this.router.navigate(
          ['/app/rfq/results'],
          {
            state: {
              proveedores: res
            }
          }
        );

      },

      error: (err) => {

        console.error(err);

        alert(
          'No se encontraron proveedores compatibles.'
        );
      }

    });
  }
}