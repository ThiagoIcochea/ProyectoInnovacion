import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class HistoryComponent {
  history = [
    {
      code: 'RFQ-2026-0618',
      provider: 'NetWorks Corp',
      category: 'Switches',
      amount: 'US$ 4,250.00',
      date: '15 Abr 2026',
      status: 'Completado'
    },
    {
      code: 'RFQ-2026-0542',
      provider: 'InfraLink Perú',
      category: 'Firewalls',
      amount: 'US$ 7,890.00',
      date: '09 Abr 2026',
      status: 'Completado'
    },
    {
      code: 'RFQ-2026-0411',
      provider: 'Global Tech Solutions',
      category: 'Access Points',
      amount: 'US$ 3,420.00',
      date: '02 Abr 2026',
      status: 'Cancelado'
    }
  ];
}