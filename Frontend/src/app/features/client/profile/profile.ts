// Backend touchpoint: profile data loader and updater; RUC fields are provider-only.
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {

  usuario: any = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    whatsapp: '',
    direccion: '',
    razonSocial: '',
    ruc: '',
    descripcion: '',
    rol: '',
    fotoPerfil: '',
    preferencias: {
      notificaciones: true,
      entregaRapida: false
    }
  };

  previewFoto: string | null = null;

  archivoFoto: File | null = null;

  nombreArchivoFoto: string = '';

  fotoUrl: string = '';

  modoImagen: string = 'archivo';

  mostrarIniciales: boolean = false;

  iniciales: string = '';

  private voiceProfilePatchHandler = (event: Event): void => {
    const detail = (event as CustomEvent).detail || {};
    const patch = detail.profile || { [detail.field]: detail.value };

    this.usuario = {
      ...this.usuario,
      ...patch,
      preferencias: patch.preferencias || this.usuario.preferencias || {
        notificaciones: true,
        entregaRapida: false
      }
    };

    this.generarIniciales();
    this.cdr.detectChanges();
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
  ) {}

  get esProveedor(): boolean {
    return (this.usuario.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase() === 'PROVEEDOR';
  }

  get rolTexto(): string {

    const rol = (this.usuario.rol || localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'PROVEEDOR') {
      return 'Proveedor';
    }

    return 'Cliente';
  }

  ngOnInit(): void {
    window.addEventListener('voiceProfilePatch', this.voiceProfilePatchHandler);
    this.cargarPerfil();
  }

  ngOnDestroy(): void {
    window.removeEventListener('voiceProfilePatch', this.voiceProfilePatchHandler);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarPerfil(notifyProfileUpdated = false): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      {
        headers: this.headers()
      }
    ).subscribe({

      next: (res) => {

        this.usuario = res;

        if (!this.usuario.preferencias) {
          this.usuario.preferencias = {
            notificaciones: true,
            entregaRapida: false
          };
        }

        this.generarIniciales();

        if (this.usuario.fotoPerfil) {

          this.previewFoto =
            this.usuario.fotoPerfil + '?t=' + Date.now();

          this.mostrarIniciales = false;

        } else {

          this.previewFoto = null;
          this.mostrarIniciales = true;
        }

        if (notifyProfileUpdated) {
          window.dispatchEvent(
            new CustomEvent('profileUpdated', {
              detail: this.usuario
            })
          );
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  generarIniciales(): void {

    const nombres = this.usuario.nombres || '';
    const apellidos = this.usuario.apellidos || '';

    const n1 = nombres.charAt(0).toUpperCase();
    const a1 = apellidos.charAt(0).toUpperCase();

    this.iniciales = `${n1}${a1}`.trim();

    if (!this.iniciales) {
      this.iniciales = 'U';
    }
  }

  onImageError(): void {

    this.previewFoto = null;
    this.mostrarIniciales = true;

    this.cdr.detectChanges();
  }

  seleccionarFoto(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    this.archivoFoto = file;
    this.nombreArchivoFoto = file.name;

    const reader = new FileReader();

    reader.onload = () => {

      this.previewFoto = reader.result as string;

      this.mostrarIniciales = false;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  async guardarPerfil(): Promise<void> {

    const formData = new FormData();

    formData.append('nombres', this.usuario.nombres || '');
    formData.append('apellidos', this.usuario.apellidos || '');
    formData.append('correo', this.usuario.correo || '');
    formData.append('telefono', this.usuario.telefono || '');
    formData.append('whatsapp', this.usuario.whatsapp || '');
    formData.append('direccion', this.usuario.direccion || '');

    formData.append(
      'notificaciones',
      String(this.usuario.preferencias.notificaciones)
    );

    formData.append(
      'entregaRapida',
      String(this.usuario.preferencias.entregaRapida)
    );

    if (this.esProveedor) {

      formData.append(
        'razonSocial',
        this.usuario.razonSocial || ''
      );

      formData.append(
        'ruc',
        this.usuario.ruc || ''
      );

      formData.append(
        'descripcion',
        this.usuario.descripcion || ''
      );
    }

    if (this.archivoFoto) {

      formData.append('foto', this.archivoFoto);

    } else if (this.fotoUrl) {

      formData.append('fotoUrl', this.fotoUrl);
    }

    let mfaToken = '';

    try {
      mfaToken = await this.mfaService.requestActionToken(
        localStorage.getItem('auth_user_email') || this.usuario.correo || '',
        'PROFILE_UPDATE',
        this.preferredMfaMethod()
      );
    } catch (error: any) {
      alert(error?.message || 'No se completo la verificacion multifactor.');
      return;
    }

    this.http.put(
      `${APP_API_BASE_URL}/usuarios/perfil`,
      formData,
      {
        headers: this.headers().set('X-MFA-Authorization', mfaToken)
      }
    ).subscribe({

      next: () => {

        this.archivoFoto = null;
        this.nombreArchivoFoto = '';
        this.fotoUrl = '';

        this.cargarPerfil(true);
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  private preferredMfaMethod(): string {
    if (this.usuario.whatsapp || this.usuario.telefono) {
      return 'whatsapp';
    }

    return 'email';
  }
}
