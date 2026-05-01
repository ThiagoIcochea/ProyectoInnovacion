import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './requests.html',
  styleUrl: './requests.scss'
})
export class RequestsComponent {
  requests = [
    {
      code: 'RFQ-2026-0892',
      provider: 'Global Tech Solutions S.A.C.',
      items: '2 modelos / 17 unidades',
      amount: 'US$ 12,744.00',
      date: '21 Abr 2026',
      status: 'En preparación',
      statusClass: 'preparing'
    },
    {
      code: 'RFQ-2026-0741',
      provider: 'CompuRedes Corporativas',
      items: '3 modelos / 24 unidades',
      amount: 'US$ 8,930.00',
      date: '18 Abr 2026',
      status: 'En camino',
      statusClass: 'shipping'
    },
    {
      code: 'RFQ-2026-0618',
      provider: 'NetWorks Corp',
      items: '1 modelo / 10 unidades',
      amount: 'US$ 4,250.00',
      date: '15 Abr 2026',
      status: 'Entregado',
      statusClass: 'delivered'
    }
  ];
}