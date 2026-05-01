import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.html',
  styleUrl: './logs.scss'
})
export class AdminLogsComponent {
  logs = [
    {
      event: 'Login exitoso',
      user: 'admin@system.com',
      type: 'Auth',
      date: 'Hoy 10:45'
    },
    {
      event: 'Fallo API proveedores',
      user: 'System',
      type: 'Error',
      date: 'Hoy 09:50'
    },
    {
      event: 'Nuevo RFQ generado',
      user: 'TechNova',
      type: 'RFQ',
      date: 'Hoy 09:20'
    }
  ];
}