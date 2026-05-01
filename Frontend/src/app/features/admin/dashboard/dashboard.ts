import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class AdminDashboardComponent {
  metrics = [
    { title: 'Usuarios activos', value: '2,845', change: '+12.5% vs mes anterior', type: 'positive' },
    { title: 'Proveedores verificados', value: '184', change: '+4.2% vs mes anterior', type: 'positive' },
    { title: 'Solicitudes RFQ totales', value: '5,231', change: '+18.7% vs mes anterior', type: 'positive' },
    { title: 'Volumen transaccional', value: '$1.2M', change: '-2.1% vs mes anterior', type: 'negative' }
  ];

  activity = [
    { title: 'Nuevo proveedor validado', detail: 'Global Tech Solutions', status: 'OK' },
    { title: 'Fallo de sincronización API', detail: 'API Cisco Latam', status: 'Retry' },
    { title: 'RFQ completado y pagado', detail: 'ORD-2026-1045', status: 'Completado' },
    { title: 'Nuevo usuario registrado', detail: 'TechNova S.A.', status: 'Nuevo' }
  ];
}