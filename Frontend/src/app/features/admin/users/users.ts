import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class AdminUsersComponent {
  users = [
    {
      name: 'TechCorp S.A.',
      email: 'admin@techcorp.com',
      role: 'Cliente',
      status: 'Activo',
      date: '21 Abr 2026'
    },
    {
      name: 'Global Tech Solutions',
      email: 'ventas@globaltech.com',
      role: 'Proveedor',
      status: 'Activo',
      date: '20 Abr 2026'
    },
    {
      name: 'Corporación Andes',
      email: 'compras@andes.com',
      role: 'Cliente',
      status: 'Pendiente',
      date: '18 Abr 2026'
    },
    {
      name: 'InfraLink Perú',
      email: 'contacto@infralink.pe',
      role: 'Proveedor',
      status: 'Suspendido',
      date: '15 Abr 2026'
    }
  ];
}