import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-request-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './request-tracking.html',
  styleUrl: './request-tracking.scss'
})
export class RequestTrackingComponent {
  steps = [
    {
      title: 'Solicitud creada',
      description: 'RFQ generado y proveedor seleccionado.',
      date: '21 Abr 2026 · 09:20',
      status: 'done'
    },
    {
      title: 'Pago confirmado',
      description: 'Comprobante validado por el proveedor.',
      date: '21 Abr 2026 · 11:45',
      status: 'done'
    },
    {
      title: 'En preparación',
      description: 'El proveedor está preparando los equipos.',
      date: '22 Abr 2026 · 08:30',
      status: 'active'
    },
    {
      title: 'En camino',
      description: 'Pedido pendiente de salida a ruta.',
      date: 'Pendiente',
      status: 'pending'
    },
    {
      title: 'Entregado',
      description: 'Entrega pendiente de confirmación.',
      date: 'Pendiente',
      status: 'pending'
    }
  ];
}