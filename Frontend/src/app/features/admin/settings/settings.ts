import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class AdminSettingsComponent {
  config = {
    systemName: 'NetProcure',
    supportEmail: 'soporte@netprocure.com',
    timezone: 'America/Lima',
    maintenanceMode: false,
    aiEnabled: true
  };

  save() {
    console.log('Configuración guardada:', this.config);
    alert('Cambios guardados correctamente');
  }
}