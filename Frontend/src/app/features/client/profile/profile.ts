import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarPerfil(): void {

    this.http.get<any>('http://localhost:8080/api/usuarios/perfil', {
      headers: this.headers()
    }).subscribe({

      next: (res) => {

        this.usuario = res;

        if (!this.usuario.preferencias) {
          this.usuario.preferencias = {
            notificaciones: true,
            entregaRapida: false
          };
        }

        if (this.usuario.fotoPerfil) {
          this.previewFoto =
            this.usuario.fotoPerfil + '?t=' + Date.now();
        } else {
          this.previewFoto = null;
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      }
    });
  }

  seleccionarFoto(event: any): void {

    const file = event.target.files[0];
    if (!file) return;

    this.archivoFoto = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewFoto = reader.result as string;
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

    formData.append('notificaciones', String(this.usuario.preferencias.notificaciones));
    formData.append('entregaRapida', String(this.usuario.preferencias.entregaRapida));

    if (this.usuario.rol === 'PROVEEDOR') {
      formData.append('razonSocial', this.usuario.razonSocial || '');
      formData.append('ruc', this.usuario.ruc || '');
      formData.append('descripcion', this.usuario.descripcion || '');
    }

    if (this.archivoFoto) {
      formData.append('foto', this.archivoFoto);
    } else if (this.fotoUrl) {
      formData.append('fotoUrl', this.fotoUrl);
    }

    this.http.put(
      'http://localhost:8080/api/usuarios/perfil',
      formData,
      { headers: this.headers() }
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