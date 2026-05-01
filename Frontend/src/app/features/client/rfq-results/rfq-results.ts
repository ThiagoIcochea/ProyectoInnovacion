import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rfq-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-results.html',
  styleUrl: './rfq-results.scss'
})
export class RfqResultsComponent {
  providers = [
    {
      name: 'Global Tech Solutions S.A.C.',
      rating: '4.9',
      reviews: '128 reseñas verificadas',
      location: 'Lima, Perú',
      price: 'US$ 11,250.00',
      delivery: '2 - 3 días hábiles',
      badges: ['Gold Partner Cisco', 'ISO 9001']
    },
    {
      name: 'CompuRedes Corporativas',
      rating: '4.7',
      reviews: '85 reseñas verificadas',
      location: 'Arequipa, Perú',
      price: 'US$ 10,950.00',
      delivery: '5 - 7 días hábiles',
      badges: ['Distribuidor Autorizado']
    },
    {
      name: 'NetWorks Corp',
      rating: '4.6',
      reviews: '61 reseñas verificadas',
      location: 'Trujillo, Perú',
      price: 'US$ 11,780.00',
      delivery: '4 - 6 días hábiles',
      badges: ['Partner Regional']
    }
  ];

  summaryItems = [
    {
      name: 'Cisco Catalyst 9300 48-port PoE+',
      qty: '2 unidades'
    },
    {
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      qty: '15 unidades'
    }
  ];
}