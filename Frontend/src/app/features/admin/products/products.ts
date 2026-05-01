import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class AdminProductsComponent {
  selectedProduct = {
    name: 'Cisco Catalyst 9300 48-port PoE+',
    brand: 'Cisco',
    category: 'Switch',
    totalStock: 24,
    providersCount: 3
  };

  products = [
    {
      name: 'Cisco Catalyst 9300 48-port PoE+',
      brand: 'Cisco',
      category: 'Switch',
      providersCount: 3,
      totalStock: 24,
      status: 'Stock medio'
    },
    {
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      brand: 'Ubiquiti',
      category: 'Access Point',
      providersCount: 4,
      totalStock: 82,
      status: 'Stock alto'
    },
    {
      name: 'Fortinet FortiGate 60F',
      brand: 'Fortinet',
      category: 'Firewall',
      providersCount: 2,
      totalStock: 6,
      status: 'Bajo stock'
    }
  ];

  providers = [
    {
      name: 'Global Tech Solutions',
      stock: 12,
      price: 'US$ 3,600.00',
      api: 'Sincronizado'
    },
    {
      name: 'InfraLink Perú',
      stock: 8,
      price: 'US$ 3,720.00',
      api: 'Sincronizado'
    },
    {
      name: 'NetWorks Corp',
      stock: 4,
      price: 'US$ 3,680.00',
      api: 'Stock bajo'
    }
  ];
}