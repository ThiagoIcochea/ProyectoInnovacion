import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit {

  usuario: any = {
    nombres: '',
    apellidos: '',
    rol: '',
    fotoPerfil: ''
  };

  constructor(
    public router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  get isAdmin(): boolean {
    return this.router.url.startsWith('/app/admin');
  }

  get isProvider(): boolean {
    return this.router.url.startsWith('/app/provider');
  }

  get isClient(): boolean {
    return !this.isAdmin && !this.isProvider;
  }

  get nombreCompleto(): string {

    const nombres = this.usuario?.nombres || '';
    const apellidos = this.usuario?.apellidos || '';

    return `${nombres} ${apellidos}`.trim();
  }

  get nombreRol(): string {

    const rol = (this.usuario?.rol || localStorage.getItem('rol') || '').toUpperCase();

    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'PROVEEDOR') {
      return 'Proveedor';
    }

    return 'Cliente';
  }

  get panelActual(): string {

    if (this.isAdmin) {
      return 'Panel Administrativo';
    }

    if (this.isProvider) {
      return 'Panel Proveedor';
    }

    return 'Panel Cliente';
  }

  get fotoPerfil(): string {

    if (!this.usuario?.fotoPerfil) {
      return '';
    }

    return this.usuario.fotoPerfil + '?t=' + Date.now();
  }

  get fotoPerfilValida(): boolean {

    return !!this.usuario?.fotoPerfil &&
           this.usuario.fotoPerfil !== 'null' &&
           this.usuario.fotoPerfil.trim() !== '';
  }

  get iniciales(): string {

    const nombres = this.usuario?.nombres || '';
    const apellidos = this.usuario?.apellidos || '';

    const n1 = nombres.charAt(0).toUpperCase();
    const a1 = apellidos.charAt(0).toUpperCase();

    return `${n1}${a1}`;
  }

  imagenError(): void {
    this.usuario.fotoPerfil = '';
    this.cdr.detectChanges();
  }

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('rfq_cart');
    localStorage.removeItem('selected_provider');
    localStorage.removeItem('current_solicitud_id');

    this.router.navigate(['/login']);
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarPerfil(): void {

    this.http.get<any>(
      'https://proyectoinnovacion.onrender.com/api/usuarios/perfil',
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.usuario = res;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }
}