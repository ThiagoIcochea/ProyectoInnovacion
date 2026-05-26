import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProductsComponent implements OnInit {

  private http = inject(HttpClient);

  products: any[] = [];

  selectedProduct: any = null;

  providers: any[] = [];

  ngOnInit(): void {
    this.obtenerProductos();
  }

  obtenerProductos(): void {

    this.http.get<any[]>(
      'https://proyectoinnovacion.onrender.com/api/productos/admin'
    ).subscribe({

      next: (resp) => {

        this.products = resp;

        if (resp.length > 0) {
          this.selectedProduct = resp[0];
        }
      },

      error: (err) => {
        console.error('Error obteniendo productos', err);
      }
    });
  }

  seleccionarProducto(product: any): void {
    this.selectedProduct = product;
  }
}