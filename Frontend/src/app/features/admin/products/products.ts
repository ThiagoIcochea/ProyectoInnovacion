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

  private API_URL = `${APP_API_BASE_URL}/productos/admin`;

  products: any[] = [];
  filteredProducts: any[] = [];

  estadoSeleccionado = '';

  selectedProduct: any = null;

  searchText = '';

  showManageModal = false;

  productImages: any[] = [];

  selectedImage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerProductos();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  obtenerProductos(): void {

    this.http.get<any[]>(this.API_URL, {
      headers: this.headers()
    }).subscribe({

      next: (res) => {

        this.products = res;
        this.filteredProducts = [...res];

        if (this.filteredProducts.length > 0) {

          this.selectedProduct = this.filteredProducts[0];

          this.cargarImagenes();

        }

        this.cdr.detectChanges();

      }

    });

  }

  seleccionarProducto(product: any): void {

    this.selectedProduct = product;

    this.cargarImagenes();

  }

  filtrarProductos(): void {

    const text = this.searchText.toLowerCase();

    this.filteredProducts = this.products.filter(p =>
      p?.name?.toLowerCase().includes(text) ||
      p?.brand?.toLowerCase().includes(text) ||
      p?.category?.toLowerCase().includes(text)
    );

  }

  openManageModal(): void {

     this.estadoSeleccionado = 'Activo';

    this.showManageModal = true;

    this.cargarImagenes();

  }

  closeManageModal(): void {

    this.showManageModal = false;

  }

  cargarImagenes(): void {

    this.productImages = [
      ...(this.selectedProduct?.images || [])
    ];

    if (this.productImages.length > 0) {

      const principal =
        this.productImages.find(img => img.principal);

      this.selectedImage =
        principal?.url ?? this.productImages[0].url;

    } else {

      this.selectedImage = '';

    }

    this.cdr.detectChanges();

  }

  selectImage(url: string): void {

    this.selectedImage = url;

    this.cdr.detectChanges();

  }

  setPrincipal(index: number): void {

    this.productImages.forEach(img => img.principal = false);

    this.productImages[index].principal = true;

    this.syncPrincipal();

  }

  moveLeft(index: number): void {

    if (index === 0) return;

    [
      this.productImages[index],
      this.productImages[index - 1]
    ] = [
      this.productImages[index - 1],
      this.productImages[index]
    ];

    this.syncPrincipal();

  }

  moveRight(index: number): void {

    if (index >= this.productImages.length - 1) return;

    [
      this.productImages[index],
      this.productImages[index + 1]
    ] = [
      this.productImages[index + 1],
      this.productImages[index]
    ];

    this.syncPrincipal();

  }

  private syncPrincipal(): void {

    this.productImages.forEach((img, i) => {

      img.principal = i === 0;

    });

    this.productImages = [...this.productImages];

    if (this.selectedProduct) {

      this.selectedProduct.images = [...this.productImages];

    }

    if (this.productImages.length > 0) {

      this.selectedImage = this.productImages[0].url;

    } else {

      this.selectedImage = '';

    }

    this.cdr.detectChanges();

  }

  onFileSelected(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      const newImage = {

        url: reader.result as string,

        principal: this.productImages.length === 0

      };

      this.productImages = [
        ...this.productImages,
        newImage
      ];

      if (this.selectedProduct) {

        this.selectedProduct.images = [
          ...this.productImages
        ];

      }

      if (newImage.principal) {

        this.selectedImage = newImage.url;

      }

      this.cdr.detectChanges();

    };

    reader.readAsDataURL(file);

  }

}