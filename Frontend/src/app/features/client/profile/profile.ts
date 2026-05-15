import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {

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

  fotoUrl: string = '';

  modoImagen: string = 'archivo';

  mostrarIniciales: boolean = false;

  iniciales: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  get esProveedor(): boolean {
    return (this.usuario.rol || localStorage.getItem('rol') || '').toUpperCase() === 'PROVEEDOR';
  }

  get rolTexto(): string {

    const rol = (this.usuario.rol || localStorage.getItem('rol') || '').toUpperCase();

    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'PROVEEDOR') {
      return 'Proveedor';
    }

    return 'Cliente';
  }

  ngOnInit(): void {
    this.cargarPerfil();
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

    const reader = new FileReader();

    reader.onload = () => {

      this.previewFoto = reader.result as string;

      this.mostrarIniciales = false;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  guardarPerfil(): void {

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

    this.http.put(
      'https://proyectoinnovacion.onrender.com/api/usuarios/perfil',
      formData,
      {
        headers: this.headers()
      }
    ).subscribe({

      next: () => {

        this.archivoFoto = null;
        this.fotoUrl = '';

        this.cargarPerfil();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }
}