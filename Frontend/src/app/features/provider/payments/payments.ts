import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-provider-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrl: './payments.scss'
})
export class ProviderPaymentsComponent {
  payments = [
    {
      id: 'PAG-2026-1045',
      client: 'TechNova S.A.',
      amount: '$12,450.00',
      time: 'Hace 30 min',
      status: 'En revisión',
      active: true
    },
    {
      id: 'PAG-2026-1042',
      client: 'Corporación Andes',
      amount: '$8,900.00',
      time: 'Ayer, 15:20',
      status: 'En revisión',
      active: false
    },
    {
      id: 'PAG-2026-1038',
      client: 'InfraRed Corp',
      amount: '$34,200.00',
      time: 'Ayer, 10:15',
      status: 'En revisión',
      active: false
    },
    {
      id: 'PAG-2026-1031',
      client: 'Fintech Nexus',
      amount: '$4,150.00',
      time: '23 Abr 2026',
      status: 'Aprobado',
      active: false
    }
  ];
}