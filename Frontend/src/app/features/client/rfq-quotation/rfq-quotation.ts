import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rfq-quotation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-quotation.html',
  styleUrl: './rfq-quotation.scss'
})
export class RfqQuotationComponent {
  products = [
    {
      name: 'Cisco Catalyst 9300 48-port PoE+',
      sku: 'C9300-48P-E',
      qty: 2,
      price: 'US$ 3,600.00',
      discount: '-',
      subtotal: 'US$ 7,200.00'
    },
    {
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      sku: 'UAP-AC-PRO-US',
      qty: 15,
      price: 'US$ 300.00',
      discount: '10% volumen',
      subtotal: 'US$ 4,050.00'
    }
  ];
}