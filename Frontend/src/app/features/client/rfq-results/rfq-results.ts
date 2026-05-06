import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-rfq-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-results.html',
  styleUrl: './rfq-results.scss'
})
export class RfqResultsComponent implements OnInit {
  providers: any[] = [];
  summaryItems: any[] = [];
  
  // 🔹 Variables para el Modal
  showModal: boolean = false;
  selectedProvDetails: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef // Necesario para refrescar el modal
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['proveedores']) {
      this.providers = navigation.extras.state['proveedores'];
    }
  }

  ngOnInit(): void {
    const savedCart = localStorage.getItem('rfq_cart');
    if (savedCart) {
      this.summaryItems = JSON.parse(savedCart);
    }

    if (this.providers.length === 0) {
      this.router.navigate(['/app/rfq/catalog']);
    }
  }

  verDetalle(provider: any): void {
    this.selectedProvDetails = provider;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.showModal = false;
    this.selectedProvDetails = null;
  }

  seleccionarProveedor(provider: any): void {
    localStorage.setItem('selected_provider', JSON.stringify(provider));
    this.router.navigate(['/app/rfq/quotation']);
  }
}
