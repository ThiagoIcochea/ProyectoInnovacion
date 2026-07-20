import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

interface SecurityBlock {
  idBloqueo: number;
  identificador: string;
  intentosFallidos: number;
  motivo: string;
  fechaBloqueo: string;
  nombreUsuario?: string;
  correoUsuario?: string;
}

@Component({
  selector: 'app-admin-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security.html',
  styleUrl: './security.scss'
})
export class AdminSecurityComponent implements OnInit {
  usuarios: SecurityBlock[] = [];
  ips: SecurityBlock[] = [];
  loading = true;
  actionLoading = '';

  constructor(private http: HttpClient, private mfa: MfaService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.http.get<SecurityBlock[]>(`${APP_API_BASE_URL}/seguridad/admin/usuarios-bloqueados`, { headers: this.headers() }).subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.http.get<SecurityBlock[]>(`${APP_API_BASE_URL}/seguridad/admin/ips-bloqueadas`, { headers: this.headers() }).subscribe({
          next: ips => { this.ips = ips; this.loading = false; },
          error: () => { this.ips = []; this.loading = false; }
        });
      },
      error: () => { this.usuarios = []; this.ips = []; this.loading = false; }
    });
  }

  async desbloquear(tipo: 'USUARIO' | 'IP', item: SecurityBlock): Promise<void> {
    const actionKey = `${tipo}-${item.identificador}`;
    this.actionLoading = actionKey;
    try {
      const email = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfa.requestActionToken(email, 'ADMIN_ACTION');
      await new Promise<void>((resolve, reject) => this.http.post(
        `${APP_API_BASE_URL}/seguridad/admin/${tipo}/desbloquear`, null,
        { headers: this.headers().set('X-MFA-Authorization', token), params: { identificador: item.identificador } }
      ).subscribe({ next: () => resolve(), error: reject }));
      this.cargar();
    } catch (error: any) {
      alert(error?.message || 'No se pudo desbloquear el registro.');
    } finally { this.actionLoading = ''; }
  }

  async bloquearManual(tipo: 'USUARIO' | 'IP'): Promise<void> {
    const etiqueta = tipo === 'IP' ? 'IP' : 'correo del usuario';
    const identificador = prompt(`Ingresa la ${etiqueta} que deseas bloquear:`)?.trim();
    if (!identificador) return;
    this.actionLoading = `manual-${tipo}`;
    try {
      const email = localStorage.getItem('auth_user_email') || '';
      const token = await this.mfa.requestActionToken(email, 'ADMIN_ACTION');
      await new Promise<void>((resolve, reject) => this.http.post(
        `${APP_API_BASE_URL}/seguridad/admin/${tipo}/bloquear`, null,
        { headers: this.headers().set('X-MFA-Authorization', token), params: { identificador } }
      ).subscribe({ next: () => resolve(), error: reject }));
      this.cargar();
    } catch (error: any) {
      alert(error?.message || 'No se pudo bloquear el registro.');
    } finally { this.actionLoading = ''; }
  }

  formatoFecha(value: string): string { return value ? new Date(value).toLocaleString('es-PE') : '—'; }
  private headers(): HttpHeaders { return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` }); }
}
