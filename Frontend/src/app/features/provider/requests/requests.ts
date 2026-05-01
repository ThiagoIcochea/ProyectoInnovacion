import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-provider-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrl: './requests.scss'
})
export class ProviderRequestsComponent {
  requests = [
    {
      id: 'RFQ-2026-0891',
      client: 'TechNova S.A.',
      time: 'Hace 2 horas',
      items: '14 unidades / 3 ítems',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0888',
      client: 'Corporación Andes',
      time: 'Ayer, 16:30',
      items: '45 unidades / 8 ítems',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0875',
      client: 'Fintech Nexus',
      time: '12 Abr 2026',
      items: '5 unidades / 2 ítems',
      status: 'En evaluación'
    }
  ];

  products = [
    {
      name: 'Cisco ISR 4321 Sec Bundle',
      brand: 'Cisco · Router',
      specs: ['2 puertos Gigabit Ethernet RJ-45', 'Módulo de seguridad avanzado incluido', 'Montaje en rack 1U'],
      qty: 2
    },
    {
      name: 'Aruba 2930F 48G PoE+',
      brand: 'Hewlett Packard Enterprise',
      specs: ['48 puertos 10/100/1000BASE-T PoE+', '4 puertos SFP 1GbE uplink'],
      qty: 5
    }
  ];
}