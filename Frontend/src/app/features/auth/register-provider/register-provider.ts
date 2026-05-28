// Backend touchpoint: provider registration payload, payment methods and certifications.
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProviderComponent implements OnInit {

  nombres = '';
  apellidos = '';
  correo = '';
  password = '';
  telefono = '';
  whatsapp = '';
  direccion = '';

  razonSocial = '';
  ruc = '';
  descripcion = '';

  apiUrl = '';
  apiTipo = 'REST';
  apiToken = '';
  submitted = false;
  formError = '';
  aceptaLegal = false;
  showLegalModal = false;
  legalModalTitle = '';
  legalModalIntro = '';
  legalModalItems: string[] = [];

  private baseUrl = `${APP_API_BASE_URL}/provider`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  openLegalModal(type: 'terms' | 'privacy'): void {
    if (type === 'terms') {
      this.legalModalTitle = 'Terminos y Condiciones para Proveedores';
      this.legalModalIntro = 'Estos terminos regulan la participacion de proveedores en Nethink para recibir RFQs, publicar informacion comercial y cotizar productos B2B.';
      this.legalModalItems = [
        'El proveedor declara que la informacion de empresa, RUC, contacto, catalogo, API, certificaciones y metodos de pago es veraz y esta actualizada.',
        'Las cotizaciones enviadas deben respetar precio, stock, condiciones de entrega, vigencia y disponibilidad informadas al cliente.',
        'La integracion API debe usarse para sincronizar informacion operativa legitima, sin exponer credenciales, datos sensibles innecesarios o servicios no autorizados.',
        'Nethink puede registrar actividad, pruebas de conexion, cambios de configuracion y eventos comerciales para trazabilidad, seguridad y soporte.',
        'El proveedor es responsable de cumplir las condiciones acordadas con clientes y de mantener sus certificaciones vigentes cuando las use como respaldo comercial.'
      ];
    } else {
      this.legalModalTitle = 'Politica de Privacidad para Proveedores';
      this.legalModalIntro = 'Esta politica explica como Nethink trata los datos del proveedor durante el registro, validacion, integracion API y participacion en oportunidades RFQ.';
      this.legalModalItems = [
        'Recolectamos datos de usuario, empresa, RUC, contacto, descripcion comercial, configuracion API, metodos de pago y certificaciones seleccionadas.',
        'La informacion comercial necesaria puede mostrarse a clientes para evaluar cotizaciones, proveedores disponibles, cumplimiento y condiciones de compra.',
        'Los tokens o datos de API se usan para operar integraciones y pruebas de conexion; deben mantenerse protegidos y actualizarse si existe riesgo de exposicion.',
        'No vendemos datos personales. La informacion se usa para autenticacion, seguridad, trazabilidad, soporte, sincronizacion y mejora del marketplace B2B.',
        'El proveedor puede solicitar revision o correccion de sus datos mediante los canales internos definidos por Nethink.'
      ];
    }

    this.showLegalModal = true;
  }

  closeLegalModal(): void {
    this.showLegalModal = false;
  }

  headers() {
    const token = localStorage.getItem(APP_STORAGE_KEYS.token);

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  /* ================= METODOS DE PAGO ================= */

  metodosPago: any[] = [];
  showPagoModal = false;
  pagoSubmitted = false;
  pagoError = '';

  tipoPago = '';
  entidadPago = '';
  numeroCuenta = '';

  openPagoModal() {
    this.pagoSubmitted = false;
    this.pagoError = '';
    this.showPagoModal = true;
  }

  closePagoModal() {
    this.pagoSubmitted = false;
    this.pagoError = '';
    this.showPagoModal = false;
  }

  addMetodoPago() {
    this.pagoSubmitted = true;
    this.pagoError = '';

    if (!this.tipoPago || !this.entidadPago || !this.numeroCuenta) {
      this.pagoError = 'Completa todos los campos del metodo de pago.';
      return;
    }

    this.metodosPago.push({
      tipo: this.tipoPago,
      entidad: this.entidadPago,
      numeroCuenta: this.numeroCuenta
    });

    this.tipoPago = '';
    this.entidadPago = '';
    this.numeroCuenta = '';
    this.showPagoModal = false;
  }

  removeMetodoPago(index: number): void {
    this.metodosPago.splice(index, 1);
  }

  maskCuenta(numeroCuenta: string): string {
    if (!numeroCuenta) {
      return 'Sin numero';
    }

    const visibleDigits = numeroCuenta.slice(-4);
    return `**** **** ${visibleDigits}`;
  }

  isMissing(value: string | null | undefined): boolean {
    return this.submitted && !String(value || '').trim();
  }

  isPaymentFieldMissing(value: string | null | undefined): boolean {
    return this.pagoSubmitted && !String(value || '').trim();
  }

  /* ================= CERTIFICACIONES ================= */

  certificaciones: any[] = [];
  selectedCerts: any = {};
  certificacionesLoading = true;
  certificacionesError = '';

  fechaObtencionMap: any = {};
  fechaExpiracionMap: any = {};

  ngOnInit(): void {
    this.cargarCertificaciones();
  }

  cargarCertificaciones(): void {
    this.certificacionesLoading = true;
    this.certificacionesError = '';

    this.http.get<any>(`${APP_API_BASE_URL}/certificaciones`)
      .subscribe({
        next: res => {
          this.certificaciones = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : [];

          this.certificacionesLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.certificaciones = [];
          this.certificacionesLoading = false;
          this.certificacionesError = err?.status === 403
            ? 'El backend no esta permitiendo cargar certificaciones en el registro publico.'
            : 'No se pudieron cargar las certificaciones desde el backend.';
          this.cdr.detectChanges();
        }
      });
  }

  toggleCertificacion(event: any, id: number) {

    if (event.target.checked) {
      this.selectedCerts[id] = true;
    } else {
      delete this.selectedCerts[id];
      delete this.fechaObtencionMap[id];
      delete this.fechaExpiracionMap[id];
    }
  }

  isCertDateMissing(id: number, field: 'obtencion' | 'expiracion'): boolean {
    if (!this.submitted || !this.selectedCerts[id]) {
      return false;
    }

    const map = field === 'obtencion'
      ? this.fechaObtencionMap
      : this.fechaExpiracionMap;

    return !map[id];
  }

  private hasRequiredFields(): boolean {
    return Boolean(
      this.nombres.trim() &&
      this.apellidos.trim() &&
      this.correo.trim() &&
      this.password.trim() &&
      this.telefono.trim() &&
      this.whatsapp.trim() &&
      this.direccion.trim() &&
      this.razonSocial.trim() &&
      this.ruc.trim() &&
      this.descripcion.trim() &&
      this.apiUrl.trim() &&
      this.apiTipo.trim() &&
      this.apiToken.trim()
    );
  }

  hasSelectedCertification(): boolean {
    return Object.keys(this.selectedCerts).length > 0;
  }

  private hasCertificationDates(): boolean {
    return Object.keys(this.selectedCerts).every(id =>
      Boolean(this.fechaObtencionMap[id] && this.fechaExpiracionMap[id])
    );
  }

  register() {
    this.submitted = true;
    this.formError = '';

    if (!this.hasRequiredFields()) {
      this.formError = 'Completa todos los campos obligatorios antes de registrar el proveedor.';
      return;
    }

    if (this.metodosPago.length < 1) {
      this.formError = 'Debes agregar al menos 1 metodo de pago.';
      return;
    }

    if (this.certificacionesLoading) {
      this.formError = 'Espera a que terminen de cargar las certificaciones.';
      return;
    }

    if (this.certificacionesError) {
      this.formError = this.certificacionesError;
      return;
    }

    if (this.certificaciones.length < 1) {
      this.formError = 'No hay certificaciones disponibles desde el backend.';
      return;
    }

    if (!this.hasSelectedCertification()) {
      this.formError = 'Debes seleccionar al menos 1 certificacion.';
      return;
    }

    if (!this.hasCertificationDates()) {
      this.formError = 'Completa las fechas de cada certificacion seleccionada.';
      return;
    }

    if (!this.aceptaLegal) {
      this.formError = 'Debes aceptar los terminos, condiciones y politica de privacidad.';
      return;
    }

    const certificacionesPayload = Object.keys(this.selectedCerts).map(id => ({
      idCertificacion: Number(id),
      fechaObtencion: this.fechaObtencionMap[id],
      fechaExpiracion: this.fechaExpiracionMap[id]
    }));

    const payload = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      correo: this.correo,
      password: this.password,
      telefono: this.telefono,
      whatsapp: this.whatsapp,
      direccion: this.direccion,

      razonSocial: this.razonSocial,
      ruc: this.ruc,
      descripcion: this.descripcion,

      apiUrl: this.apiUrl,
      apiTipo: this.apiTipo,
      apiToken: this.apiToken,

      metodosPago: this.metodosPago,
      certificaciones: certificacionesPayload
    };

    this.http.post(
      `${this.baseUrl}/register`,
      payload,
      { headers: this.headers() }
    ).subscribe({
      next: () => alert('Proveedor registrado correctamente'),
      error: err => {
        console.error(err);
        this.formError = err?.error?.message || 'No se pudo registrar el proveedor.';
      }
    });
  }
}
