import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rfq-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-catalog.html',
  styleUrl: './rfq-catalog.scss'
})
export class RfqCatalogComponent {
  products = [
    {
      brand: 'Cisco',
      name: 'Cisco Catalyst 9200L 48-port PoE+',
      description: 'C9200L-48P-4G-E, 48x 10/100/1000 PoE+, 4x 1G SFP',
      ref: 'C9200L-48P',
      badge: 'Stock local'
    },
    {
      brand: 'Ubiquiti',
      name: 'UniFi Enterprise 48 PoE',
      description: 'USW-Enterprise-48-PoE, 48x 2.5G PoE+, 4x 10G SFP+',
      ref: 'USW-ENT-48',
      badge: 'Stock local'
    },
    {
      brand: 'Aruba',
      name: 'Aruba 2930F 48G PoE+ 4SFP',
      description: 'JL262A, 48x 10/100/1000 PoE+, 4x 1G SFP',
      ref: 'JL262A',
      badge: 'Importación'
    },
    {
      brand: 'Mikrotik',
      name: 'Cloud Router Switch CRS354',
      description: 'CRS354-48P-4S+2Q+RM, 48x 1G PoE, 4x 10G SFP+',
      ref: 'CRS354',
      badge: 'Stock local'
    }
  ];

  requestItems = [
    {
      name: 'Cisco Catalyst 9200L',
      detail: 'Switch • 48 Puertos PoE+',
      qty: 12
    },
    {
      name: 'UniFi Enterprise 48',
      detail: 'Switch • 48 Puertos 2.5G',
      qty: 35
    }
  ];
}