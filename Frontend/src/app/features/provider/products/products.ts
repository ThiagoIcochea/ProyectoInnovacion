import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-provider-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProviderProductsComponent {
  products = [
    {
      sku: 'C9300-48P-E',
      name: 'Cisco Catalyst 9300 48-port PoE+',
      category: 'Switch',
      stock: 24,
      price: 'US$ 3,600.00',
      status: 'Activo'
    },
    {
      sku: 'UAP-AC-PRO-US',
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      category: 'Access Point',
      stock: 80,
      price: 'US$ 300.00',
      status: 'Activo'
    },
    {
      sku: 'ISR-4321-SEC',
      name: 'Cisco ISR 4321 Sec Bundle',
      category: 'Router',
      stock: 6,
      price: 'US$ 1,250.00',
      status: 'Bajo stock'
    }
  ];
}