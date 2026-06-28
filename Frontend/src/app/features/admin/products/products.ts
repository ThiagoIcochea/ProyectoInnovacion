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
export class AdminProductsComponent implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/productos/admin`;

  products: any[] = [];
  filteredProducts: any[] = [];

  selectedProduct: any = null;

  searchText: string = '';

  showManageModal = false;

  productImages: any[] = [];
  selectedImage: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerProductos();
  }

  // 🔐 headers auth
  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  // 📦 CARGA PRODUCTOS (YA INCLUYE IMÁGENES DESDE BACKEND)
  obtenerProductos(): void {

    this.http.get<any[]>(
      this.API_URL,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        this.products = res;
        this.filteredProducts = [...res];

        if (this.filteredProducts.length > 0) {
          this.selectedProduct = this.filteredProducts[0];

          // opcional: inicializar imágenes del primer producto
          this.cargarImagenesSeleccionado();
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error obteniendo productos', err);
      }
    });
  }

  // 📌 seleccionar producto
  seleccionarProducto(product: any): void {

    this.selectedProduct = product;

    this.cargarImagenesSeleccionado();

    this.cdr.detectChanges();
  }

  // 🔥 centraliza carga de imágenes desde backend ya embebido
  private cargarImagenesSeleccionado(): void {

    this.productImages =
      this.selectedProduct?.images || [];

    if (this.productImages.length > 0) {

      const principal =
        this.productImages.find((img: any) => img.principal);

      this.selectedImage =
        principal?.url || this.productImages[0].url;

    } else {
      this.selectedImage = '';
    }
  }

  // 🔍 filtro
  filtrarProductos(): void {

    const text = this.searchText.toLowerCase();

    this.filteredProducts = this.products.filter(product =>
      product?.name?.toLowerCase().includes(text) ||
      product?.brand?.toLowerCase().includes(text) ||
      product?.category?.toLowerCase().includes(text)
    );

    if (this.filteredProducts.length > 0) {
      this.selectedProduct = this.filteredProducts[0];
      this.cargarImagenesSeleccionado();
    }

    this.cdr.detectChanges();
  }

  // 🧩 modal
  openManageModal(): void {

    this.showManageModal = true;

    this.cargarImagenesSeleccionado();
  }

  closeManageModal(): void {
    this.showManageModal = false;
  }

  // 🖼️ cambiar imagen en galería
  selectImage(url: string): void {
    this.selectedImage = url;
  }
}