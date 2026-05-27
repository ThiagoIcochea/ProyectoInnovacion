// Backend touchpoint: main shell that loads the active user profile, role labels and logout cleanup.
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../core/constants/app.constants';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  usuario: any = {
    nombres: '',
    apellidos: '',
    rol: '',
    fotoPerfil: ''
  };

  estadoApi: string = 'Desconectada';
  menuMovilAbierto = false;
  globalSearchTerm = '';
  private fotoPerfilCacheBust = Date.now();
  private profileUpdatedHandler = (event: Event) => {
    const updatedUser = (event as CustomEvent<any>).detail;

    if (updatedUser) {
      this.usuario = {
        ...this.usuario,
        ...updatedUser
      };
      this.fotoPerfilCacheBust = Date.now();
      this.cdr.detectChanges();
      return;
    }

    this.cargarPerfil();
  };

  private API_URL =
  'https://proyectoinnovacion.onrender.com/api/proveedor-api';

  constructor(
    public router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('profileUpdated', this.profileUpdatedHandler);
    this.cargarPerfil();
    if (this.isProvider) {
    this.cargarEstadoApi();
  }
  }

  ngOnDestroy(): void {
    window.removeEventListener('profileUpdated', this.profileUpdatedHandler);
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto = false;
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

    const rol = (this.usuario?.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

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

    const foto = String(this.usuario.fotoPerfil);

    if (foto.startsWith('data:')) {
      return foto;
    }

    const separator = foto.includes('?') ? '&' : '?';

    return `${foto}${separator}t=${this.fotoPerfilCacheBust}`;
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
    this.fotoPerfilCacheBust = Date.now();
    this.cdr.detectChanges();
  }

  ejecutarBusquedaGlobal(): void {
    const search = this.globalSearchTerm.trim();

    this.router.navigate(
      [APP_ROUTE_PATHS.rfqCatalog],
      search ? { queryParams: { search } } : { queryParams: {} }
    );
  }

  logout(): void {

    this.cerrarMenuMovil();

    localStorage.removeItem(APP_STORAGE_KEYS.token);
    localStorage.removeItem(APP_STORAGE_KEYS.role);
    localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
    localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
    localStorage.removeItem(APP_STORAGE_KEYS.currentSolicitudId);

    this.router.navigate([APP_ROUTE_PATHS.login], { replaceUrl: true });
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarPerfil(): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.usuario = res;
        this.fotoPerfilCacheBust = Date.now();

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  cargarEstadoApi(): void {

  this.http.get<any>(
    this.API_URL,
    {
      headers: this.headers()
    }
  )
  .subscribe({

    next: (res) => {

      this.estadoApi =
        res.estadoConexion || 'Desconectada';

      this.cdr.detectChanges();
    },

    error: (err) => {

      console.error(
        'Error obteniendo estado API',
        err
      );

      this.estadoApi = 'Desconectada';
    }
  });
}
}
