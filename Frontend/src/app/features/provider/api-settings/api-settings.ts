import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';
import { MfaService } from '../../../core/services/mfa.service';

type ConnectionState = 'idle' | 'testing' | 'success' | 'error';

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
export class ProviderApiSettingsComponent implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/proveedor-api`;

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
  testingConnection = false;
  connectionMessage = '';
  showEndpoint = false;
  showApiKey = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mfaService: MfaService
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
        this.config = {
          ...this.config,
          ...res
        };
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'Error cargando configuracion API',
          err
        );
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async guardarConfiguracion(): Promise<void> {
    const body = {
      apiUrl: this.config.apiUrl,
      apiTipo: this.config.apiTipo,
      apiToken: this.config.apiToken
    };

    let mfaToken = '';

    try {
      mfaToken = await this.mfaService.requestActionToken(
        localStorage.getItem('auth_user_email') || '',
        'PROVIDER_API_UPDATE'
      );
    } catch (error: any) {
      alert(error?.message || 'No se completo la verificacion multifactor.');
      return;
    }

    this.http.put(
      `${this.API_URL}`,
      body,
      {
        headers: this.headers().set('X-MFA-Authorization', mfaToken)
      }
    )
    .subscribe({

      next: () => {
        alert('Configuracion guardada');

        this.cargarConfiguracion();
      },

      error: (err) => {
        console.error(
          'Error guardando configuracion',
          err
        );

        alert('No se pudo guardar');
      }
    });
  }

  probarConexion(): void {
    if (!this.config.apiUrl?.trim()) {
      this.connectionMessage = 'Configura un endpoint antes de probar la conexion.';
      return;
    }

    this.testingConnection = true;
    this.connectionMessage = '';

    this.http.post<any>(
      `${this.API_URL}/probar`,
      {},
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {
        this.config = {
          ...this.config,
          ...res
        };
        this.testingConnection = false;

        alert('Conexion realizada');

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(
          'Error probando conexion',
          err
        );

        this.config = {
          ...this.config,
          estadoConexion: 'ERROR',
          codigoRespuesta: err?.status || '',
          descripcion: err?.message || 'Error de conexion'
        };
        this.testingConnection = false;
        this.connectionMessage = 'No se pudo conectar con el endpoint configurado.';

        alert('Error de conexion');
        this.cdr.detectChanges();
      }
    });
  }

  get connectionState(): ConnectionState {
    if (this.testingConnection) {
      return 'testing';
    }

    const status = String(this.config.estadoConexion || '').toUpperCase();

    if (status === 'OK' || status === 'CONECTADO' || status === 'SUCCESS') {
      return 'success';
    }

    if (status === 'ERROR') {
      return 'error';
    }

    return 'idle';
  }

  get connectionLabel(): string {
    const labels: Record<ConnectionState, string> = {
      idle: 'Conexion sin probar',
      testing: 'Probando conexion...',
      success: 'API conectada',
      error: 'API con errores'
    };

    return labels[this.connectionState];
  }

  get syncTitle(): string {
    const labels: Record<ConnectionState, string> = {
      idle: 'Conexion sin probar',
      testing: 'Probando conexion',
      success: 'Sincronizacion activa',
      error: 'Sincronizacion con errores'
    };

    return labels[this.connectionState];
  }

  get syncIcon(): string {
    const icons: Record<ConnectionState, string> = {
      idle: '-',
      testing: '...',
      success: 'OK',
      error: '!'
    };

    return icons[this.connectionState];
  }

  get syncEndpoint(): string {
    return this.config.endpoint || this.config.apiUrl || '';
  }

  get endpointLabel(): string {
    return this.syncEndpoint || 'Endpoint no configurado';
  }

  get endpointDisplayLabel(): string {
    if (!this.syncEndpoint) {
      return 'Endpoint no configurado';
    }

    return this.showEndpoint
      ? this.endpointLabel
      : 'Endpoint oculto';
  }

  get responseTimeLabel(): string {
    if (
      this.config.tiempoRespuestaMs === null ||
      this.config.tiempoRespuestaMs === undefined ||
      this.config.tiempoRespuestaMs === ''
    ) {
      return '-';
    }

    return `${this.config.tiempoRespuestaMs} ms`;
  }

  get connectionDescription(): string {
    if (this.connectionMessage) {
      return this.connectionMessage;
    }

    if (this.config.descripcion) {
      return this.config.descripcion;
    }

    if (!this.syncEndpoint) {
      return 'Endpoint no configurado.';
    }

    if (this.connectionState === 'idle') {
      return 'La conexion aun no fue probada.';
    }

    return 'Sin informacion reciente.';
  }

  toggleEndpointVisibility(): void {
    this.showEndpoint = !this.showEndpoint;
  }

  toggleSecret(field: string): void {
    if (field === 'endpoint') {
      this.toggleEndpointVisibility();
      return;
    }

    if (field === 'apiKey') {
      this.showApiKey = !this.showApiKey;
    }
  }
}
