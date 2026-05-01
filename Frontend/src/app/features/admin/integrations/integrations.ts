import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrations.html',
  styleUrl: './integrations.scss'
})
export class AdminIntegrationsComponent {
  integrations = [
    {
      name: 'API Inventario Proveedores',
      status: 'Conectado',
      lastSync: 'Hoy, 09:45 AM'
    },
    {
      name: 'Motor de Recomendación IA',
      status: 'Activo',
      lastSync: 'Hoy, 09:40 AM'
    },
    {
      name: 'API Validación Pagos',
      status: 'Error',
      lastSync: 'Hace 1 hora'
    }
  ];
}