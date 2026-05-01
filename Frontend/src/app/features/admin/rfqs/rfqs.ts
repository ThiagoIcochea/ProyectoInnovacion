import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-rfqs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rfqs.html',
  styleUrl: './rfqs.scss'
})
export class AdminRfqsComponent {
  rfqs = [
    {
      id: 'RFQ-2026-1045',
      client: 'TechNova S.A.',
      provider: 'Global Tech Solutions',
      amount: '$12,450.00',
      status: 'Completado',
      date: '25 Abr 2026'
    },
    {
      id: 'RFQ-2026-1042',
      client: 'Corporación Andes',
      provider: 'InfraLink Perú',
      amount: '$8,900.00',
      status: 'En proceso',
      date: '24 Abr 2026'
    },
    {
      id: 'RFQ-2026-1038',
      client: 'Fintech Nexus',
      provider: 'NetWorks Corp',
      amount: '$4,150.00',
      status: 'Cancelado',
      date: '23 Abr 2026'
    }
  ];
}