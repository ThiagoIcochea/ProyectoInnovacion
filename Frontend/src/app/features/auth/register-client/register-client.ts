// Backend touchpoint: client registration payload sent to /api/usuarios/register.
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { APP_API_BASE_URL, APP_ROUTE_PATHS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './register-client.html',
  styleUrl: './register-client.scss'
})
export class RegisterClientComponent {

  acepta = false;
  submitted = false;
  formError = '';
  showLegalModal = false;
  legalModalTitle = '';
  legalModalIntro = '';
  legalModalItems: string[] = [];

  form = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    whatsapp: '',
    password: '',
    direccion: '',
    fotoPerfil: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  openLegalModal(type: 'terms' | 'privacy'): void {
    if (type === 'terms') {
      this.legalModalTitle = 'Terminos y Condiciones para Clientes';
      this.legalModalIntro = 'Estos terminos regulan el uso de Nethink por clientes empresariales que solicitan cotizaciones RFQ y gestionan compras B2B de infraestructura TI.';
      this.legalModalItems = [
        'La cuenta debe usarse con informacion real de contacto, entrega y comunicacion corporativa.',
        'Las solicitudes RFQ deben representar una necesidad comercial legitima y contener datos claros sobre productos, cantidades y condiciones esperadas.',
        'Las cotizaciones, precios, tiempos de entrega y disponibilidad pueden variar segun la respuesta final del proveedor.',
        'El cliente es responsable de revisar la informacion del proveedor, confirmar condiciones de pago y validar la recepcion del pedido.',
        'Nethink puede registrar actividad operativa para trazabilidad, seguridad, soporte y mejora del proceso de compra.'
      ];
    } else {
      this.legalModalTitle = 'Politica de Privacidad para Clientes';
      this.legalModalIntro = 'Esta politica explica como Nethink trata los datos del cliente durante el registro, creacion de RFQs, seguimiento y gestion de compras.';
      this.legalModalItems = [
        'Recolectamos datos de identificacion, contacto, direccion de entrega y actividad dentro del sistema para operar la plataforma.',
        'Los datos de una RFQ pueden compartirse con proveedores participantes para responder cotizaciones y gestionar oportunidades comerciales.',
        'No vendemos datos personales. La informacion se usa para autenticacion, trazabilidad, soporte, seguridad y mejora del servicio.',
        'El usuario debe mantener sus credenciales protegidas y reportar accesos no autorizados.',
        'El cliente puede solicitar correccion o revision de sus datos conforme a los canales internos definidos por Nethink.'
      ];
    }

    this.showLegalModal = true;
  }

  closeLegalModal(): void {
    this.showLegalModal = false;
  }

  isFieldMissing(field: keyof RegisterClientComponent['form']): boolean {
    if (field === 'fotoPerfil') {
      return false;
    }

    return this.submitted && !String(this.form[field] || '').trim();
  }

  private hasRequiredFields(): boolean {
    return Boolean(
      this.form.nombres.trim() &&
      this.form.apellidos.trim() &&
      this.form.correo.trim() &&
      this.form.telefono.trim() &&
      this.form.whatsapp.trim() &&
      this.form.password.trim() &&
      this.form.direccion.trim()
    );
  }

  registrar(): void {
    this.submitted = true;
    this.formError = '';

    if (!this.hasRequiredFields()) {
      this.formError = 'Completa todos los campos obligatorios antes de crear tu cuenta.';
      return;
    }

    if (!this.acepta) {
      this.formError = 'Debes aceptar los terminos, condiciones y politica de privacidad.';
      return;
    }

    this.http.post<any>(
      `${APP_API_BASE_URL}/auth/register-client/start`,
      this.form,
    )
    .subscribe({

      next: (res) => {
        sessionStorage.setItem('pending_mfa_flow', JSON.stringify(res));
        this.router.navigate(['/mfa'], { replaceUrl: true });
      },

      error: (err) => {

        console.error('Error al registrar cliente:', err);

        if (err.error?.message) {
          alert(err.error.message);
          return;
        }

        alert('Error al registrar cliente');
      }
    });
  }
}
