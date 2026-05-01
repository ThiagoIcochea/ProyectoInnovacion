import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './providers.html',
  styleUrl: './providers.scss'
})
export class AdminProvidersComponent {
  providers = [
    {
      name: 'Global Tech Solutions',
      email: 'ventas@globaltech.com',
      api: 'Conectada',
      status: 'Verificado',
      rating: '4.9',
      products: 128
    },
    {
      name: 'InfraLink Perú',
      email: 'contacto@infralink.pe',
      api: 'Pendiente',
      status: 'Pendiente',
      rating: '4.5',
      products: 84
    },
    {
      name: 'NetWorks Corp',
      email: 'admin@networkscorp.com',
      api: 'Error',
      status: 'Observado',
      rating: '4.6',
      products: 61
    }
  ];
}