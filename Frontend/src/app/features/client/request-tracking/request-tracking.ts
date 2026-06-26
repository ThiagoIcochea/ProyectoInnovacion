// Backend touchpoint: request tracking timeline, cancel action and payment handoff.
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { DelayClaim, DelayClaimsService } from '../../../core/services/delay-claims.service';

@Component({
  selector: 'app-request-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './request-tracking.html',
  styleUrl: './request-tracking.scss'
})
export class RequestTrackingComponent implements OnInit {

  tracking: any = null;
  steps: any[] = [];
  loading = true;
  errorMessage = '';
  claimModalOpen = false;
  claimDescription = '';
  claimPromisedDate = '';
  claimError = '';
  currentClaim: DelayClaim | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private delayClaimsService: DelayClaimsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargarTracking(id);
      return;
    }

    this.errorMessage = 'No se encontro el identificador de la solicitud.';
    this.loading = false;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarTracking(id: string): void {

    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(
      `${APP_API_BASE_URL}/solicitudes/${id}/tracking`,
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('TRACKING:', res);

        this.tracking = res;
        this.currentClaim = this.delayClaimsService.getBySolicitud(res.idSolicitud);
        this.claimPromisedDate = this.getDefaultPromisedDateInput();

        localStorage.setItem(
          APP_STORAGE_KEYS.currentSolicitudId,
          String(res.idSolicitud)
        );

        this.steps = (res.timeline || []).map((t: any, i: number) => ({
          title: this.mapEstado(t.estado),
          description: t.descripcion,
          date: t.fecha,
          status: i === res.timeline.length - 1
            ? 'active'
            : 'done'
        }));

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.errorMessage = this.getTrackingErrorMessage(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getTrackingErrorMessage(err: any): string {
    if (err?.status === 400) {
      return 'No se pudo cargar el tracking de esta solicitud. Verifica que el ID exista y pertenezca a tu cuenta.';
    }

    if (err?.status === 401 || err?.status === 403) {
      return 'Tu sesion no tiene permisos para ver el tracking de esta solicitud.';
    }

    return 'No se pudo cargar el tracking en este momento.';
  }

  irAPago(): void {

    if (!this.tracking?.idSolicitud) {
      return;
    }

    localStorage.setItem(
      APP_STORAGE_KEYS.currentSolicitudId,
      String(this.tracking.idSolicitud)
    );

    this.router.navigate([APP_ROUTE_PATHS.rfqPayment]);
  }

  cancelarSolicitud(): void {

    const id = this.tracking.idSolicitud;

    this.http.put(
      `${APP_API_BASE_URL}/solicitudes/${id}/cancelar`,
      {},
      { headers: this.headers() }
    ).subscribe({

      next: (res) => {

        console.log('CANCELADO:', res);

        this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
      },

      error: (err) => {

        console.error('ERROR CANCELAR:', err);

        alert('Error al cancelar');
      }
    });
  }

  abrirReclamoDemora(): void {
    if (this.currentClaim) {
      return;
    }

    this.claimError = '';
    this.claimDescription = this.getDefaultClaimDescription();
    this.claimPromisedDate = this.getDefaultPromisedDateInput();
    this.claimModalOpen = true;
  }

  cerrarReclamoDemora(): void {
    this.claimModalOpen = false;
    this.claimError = '';
  }

  guardarReclamoDemora(): void {
    if (!this.tracking?.idSolicitud) {
      return;
    }

    const promisedDate = this.getClaimPromisedDate();
    const description = this.claimDescription.trim();

    if (!promisedDate) {
      this.claimError = 'Indica la fecha prometida por el proveedor.';
      return;
    }

    if (!description) {
      this.claimError = 'Describe brevemente el reclamo por demora.';
      return;
    }

    const saved = this.delayClaimsService.save({
      idSolicitud: Number(this.tracking.idSolicitud),
      idProveedor: this.tracking?.idProveedor ?? null,
      proveedor: this.tracking?.proveedor || 'Proveedor',
      empresaCliente: this.tracking?.empresaCompradora?.razonSocial || 'Cliente',
      orderCode: this.getRequestCode(),
      motivo: 'DEMORA_ENTREGA',
      descripcion: description,
      fechaPrometida: promisedDate.toISOString(),
      diasDemora: this.getDelayDays(promisedDate)
    });

    this.currentClaim = saved;
    this.claimModalOpen = false;
    this.claimError = '';
    this.cdr.detectChanges();
  }

  getRequestCode(): string {
    return `RFQ-2026-${this.tracking?.idSolicitud || ''}`;
  }

  getPromisedDate(): Date | null {
    const raw =
      this.tracking?.fechaLimiteEntrega ||
      this.tracking?.fechaEntregaPrometida ||
      this.tracking?.fechaEntregaEstimada ||
      this.tracking?.fechaPrometida;

    if (raw) {
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const baseDate =
      this.tracking?.fechaCreacion ||
      this.steps?.[0]?.date ||
      this.tracking?.timeline?.[0]?.fecha;
    const deliveryDays = Number(
      this.tracking?.tiempoEntregaDias ??
      this.tracking?.tiempoEntregaPromedio ??
      0
    );

    if (!baseDate || !deliveryDays) {
      return null;
    }

    const base = new Date(baseDate);

    if (Number.isNaN(base.getTime())) {
      return null;
    }

    base.setDate(base.getDate() + deliveryDays);
    return base;
  }

  getDelayDays(date = this.getPromisedDate()): number {
    if (!date) {
      return 0;
    }

    const end = this.isDelivered()
      ? new Date(this.tracking?.fechaEntrega || Date.now())
      : new Date();

    const ms = end.getTime() - date.getTime();

    if (ms <= 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(ms / 86400000));
  }

  canCreateDelayClaim(): boolean {
    if (!this.tracking || this.currentClaim || this.isFinalStatus()) {
      return false;
    }

    return this.getDelayDays() > 0 || !this.getPromisedDate();
  }

  getDelayClaimHint(): string {
    const promisedDate = this.getPromisedDate();

    if (!promisedDate) {
      return 'El backend aun no expone la fecha limite. Puedes registrar la fecha prometida por el proveedor en el reclamo.';
    }

    const days = this.getDelayDays(promisedDate);

    if (days > 0) {
      return `La entrega supera la fecha prometida por ${days} dia${days === 1 ? '' : 's'}.`;
    }

    return 'La entrega aun esta dentro del plazo registrado.';
  }

  formatClaimDate(value?: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    return new Date(value).toLocaleDateString('es-PE');
  }

  getClaimPromisedDate(): Date | null {
    if (this.claimPromisedDate) {
      const parsed = new Date(`${this.claimPromisedDate}T23:59:59`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return this.getPromisedDate();
  }

  private getDefaultPromisedDateInput(): string {
    const promisedDate = this.getPromisedDate();

    if (!promisedDate) {
      return '';
    }

    return promisedDate.toISOString().slice(0, 10);
  }

  private getDefaultClaimDescription(): string {
    const days = this.getDelayDays();
    const suffix = days > 0
      ? ` La demora calculada es de ${days} dia${days === 1 ? '' : 's'}.`
      : '';

    return `Solicito revision por demora en la entrega de la solicitud ${this.getRequestCode()}.${suffix}`;
  }

  private isDelivered(): boolean {
    const estado = this.normalizarEstado(this.tracking?.estado);
    return estado === 'ENTREGADA' || estado === 'COMPLETADA';
  }

  private isFinalStatus(): boolean {
    const estado = this.normalizarEstado(this.tracking?.estado);
    return ['ENTREGADA', 'COMPLETADA', 'CANCELADA', 'RECHAZADA'].includes(estado);
  }

  private normalizarEstado(estado: string): string {
    return (estado || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  mapEstado(estado: string): string {

    const map: any = {
      CREADA: 'Creada',
      PAGO_PENDIENTE: 'Pedido en revisión',
      PEDIDO_APROBADO: "Pedido aprobado",
      PAGO_VALIDANDO: 'Validando pago',
      PAGADA : "Pagado",
      EN_CAMINO: 'En camino',
      ENTREGADA: 'Entregado',
      CANCELADA: 'Cancelada'
    };

    return map[this.normalizarEstado(estado)] || estado;
  }

  getEstadoTexto(): string {

    if (!this.tracking) {
      return '';
    }

    return this.mapEstado(this.tracking.estado);
  }

  esPedidoAprobado(): boolean {
    return this.normalizarEstado(this.tracking?.estado) === 'PEDIDO_APROBADO';
  }

   esPosibleCancelar(): boolean {
    return this.normalizarEstado(this.tracking?.estado) === 'PAGO_PENDIENTE';
  }
  esEnCamino(): boolean {
    return  this.tracking?.estado === 'En camino';
  }
}
