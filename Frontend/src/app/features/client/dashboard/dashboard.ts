import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  recommendedProducts = [
    {
      tag: 'Top reseñado',
      brand: 'Cisco',
      type: 'Switch L3',
      name: 'Cisco Catalyst 9300 48-port PoE+',
      description: 'Switch empresarial para redes de alto rendimiento.'
    },
    {
      tag: 'Alta demanda',
      brand: 'Ubiquiti',
      type: 'Access Point',
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      description: 'Punto de acceso para cobertura WiFi corporativa.'
    },
    {
      tag: 'Implementación rápida',
      brand: 'Juniper',
      type: 'Switch',
      name: 'Juniper Networks EX2300',
      description: 'Switch compacto para crecimiento de red.'
    }
  ];

  requestItems = [
    {
      name: 'Cisco Catalyst 9300 48-port PoE+',
      qty: 2
    },
    {
      name: 'Ubiquiti UniFi UAP-AC-PRO',
      qty: 15
    }
  ];
}