import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class ProviderDashboardComponent {
  metrics = [
    {
      title: 'Solicitudes recibidas',
      value: '1,248',
      change: '+12% vs. mes anterior',
      icon: '▣'
    },
    {
      title: 'Solicitudes aceptadas',
      value: '842',
      change: '+5% vs. mes anterior',
      icon: '✓'
    },
    {
      title: 'Ingresos estimados',
      value: '$142,500.00',
      change: '+18% vs. mes anterior',
      icon: '$'
    }
  ];

  recentRequests = [
    {
      id: 'RFQ-2026-0891',
      client: 'TechNova S.A.',
      location: 'Lima, Perú',
      products: '14 unidades / 3 ítems',
      date: 'Hoy, 10:45 AM',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0888',
      client: 'Corporación Andes',
      location: 'Bogotá, Colombia',
      products: '45 unidades / 8 ítems',
      date: 'Ayer, 16:30 PM',
      status: 'Nueva'
    },
    {
      id: 'RFQ-2026-0875',
      client: 'Fintech Nexus',
      location: 'Santiago, Chile',
      products: '5 unidades / 2 ítems',
      date: '12 Abr 2026',
      status: 'En evaluación'
    }
  ];
}