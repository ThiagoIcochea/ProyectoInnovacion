import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-provider-api-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './api-settings.html',
  styleUrl: './api-settings.scss'
})
export class ProviderApiSettingsComponent
implements OnInit {

  private API_URL =
    'https://proyectoinnovacion.onrender.com/api/proveedor-api';

  config: any = {

    apiUrl: '',
    apiTipo: 'REST',
    apiToken: '',
    estadoProveedor: '',

    endpoint: '',
    metodoHttp: '',
    codigoRespuesta: '',
    tiempoRespuestaMs: 0,
    estadoConexion: '',
    descripcion: '',
    fechaUltimaConexion: ''
  };

  loading = true;
  showEndpoint = false;
  showApiKey = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({
      Authorization:
        `Bearer ${localStorage.getItem('token')}`
    });
  }

  cargarConfiguracion(): void {

    this.loading = true;

    this.http.get<any>(
      `${this.API_URL}`,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.config = res;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'Error cargando configuración API',
          err
        );
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarConfiguracion(): void {

   

    const body = {

      apiUrl: this.config.apiUrl,
      apiTipo: this.config.apiTipo,
      apiToken: this.config.apiToken
    };

    this.http.put(
      `${this.API_URL}`,
      body,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: () => {

        alert('Configuración guardada');

        this.cargarConfiguracion();
      },

      error: (err) => {

        console.error(
          'Error guardando configuración',
          err
        );

        alert('No se pudo guardar');
      }
    });
  }

  probarConexion(): void {

   

    this.http.post<any>(
      `${this.API_URL}/probar`,
      {},
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.config = res;

        alert('Conexión realizada');

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(
          'Error probando conexión',
          err
        );

        alert('Error de conexión');
      }
    });
  }

  toggleSecret(field: string): void {
    if (field === 'endpoint') {
      this.showEndpoint = !this.showEndpoint;
      return;
    }

    if (field === 'apiKey') {
      this.showApiKey = !this.showApiKey;
    }
  }
}
