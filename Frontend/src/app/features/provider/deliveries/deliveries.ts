import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-provider-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.scss'
})
export class ProviderDeliveriesComponent {
  orders = [
    {
      id: 'ORD-2026-1045',
      client: 'TechNova S.A.',
      items: '12 equipos',
      time: 'Hace 2 horas',
      status: 'En preparación',
      active: true
    },
    {
      id: 'ORD-2026-1042',
      client: 'Corporación Andes',
      items: '5 equipos',
      time: 'Ayer',
      status: 'En camino',
      active: false
    },
    {
      id: 'ORD-2026-1038',
      client: 'InfraRed Corp',
      items: '45 equipos',
      time: '23 Abr 2026',
      status: 'Entregado',
      active: false
    }
  ];

  shipmentProducts = [
    {
      product: 'Cisco Catalyst 9300 48-port PoE+',
      sku: 'C9300-48P-E',
      qty: 2
    },
    {
      product: 'Ubiquiti UniFi UAP-AC-PRO',
      sku: 'UAP-AC-PRO-US',
      qty: 10
    }
  ];

  steps = [
    {
      title: 'Pago validado',
      description: '25 Abr 2026, 10:30 AM',
      status: 'done'
    },
    {
      title: 'En preparación',
      description: 'Equipos en almacén',
      status: 'active'
    },
    {
      title: 'En camino',
      description: 'Pendiente',
      status: 'pending'
    },
    {
      title: 'Entregado',
      description: 'Pendiente confirmación',
      status: 'pending'
    }
  ];
} 