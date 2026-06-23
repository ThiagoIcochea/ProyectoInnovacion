import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProductsComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/productos/admin`;

  products: any[] = [];

  filteredProducts: any[] = [];

  selectedProduct: any = null;

  searchText: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.obtenerProductos();
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  obtenerProductos(): void {

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.products = res;

        this.filteredProducts = [...res];

        if (this.filteredProducts.length > 0) {

          this.selectedProduct =
            this.filteredProducts[0];
        }

        this.filtrarProductos();

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error obteniendo productos',
          err
        );
      }
    });
  }

  seleccionarProducto(
    product: any
  ): void {

    this.selectedProduct = product;

    this.cdr.detectChanges();
  }

  filtrarProductos(): void {

    const text =
      this.searchText.toLowerCase();

    this.filteredProducts =
      this.products.filter(product =>

        product?.name
          ?.toLowerCase()
          .includes(text)

        ||

        product?.brand
          ?.toLowerCase()
          .includes(text)

        ||

        product?.category
          ?.toLowerCase()
          .includes(text)
      );

    if (
      this.filteredProducts.length > 0
    ) {

      this.selectedProduct =
        this.filteredProducts[0];
    }

    this.cdr.detectChanges();
  }
}
