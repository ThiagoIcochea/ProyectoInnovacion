import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

  constructor(private router: Router) {
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

  seleccionarProveedor(provider: any): void {
   
    localStorage.setItem('selected_provider', JSON.stringify(provider));
    this.router.navigate(['/app/rfq/quotation']);
  }
}
