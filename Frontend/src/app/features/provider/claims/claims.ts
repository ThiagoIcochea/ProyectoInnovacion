import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClaimStatus, ProviderClaim } from './claim.model';
import { ProviderClaimsService } from './claims.service';

@Component({
  selector: 'app-provider-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claims.html',
  styleUrls: ['./claims.scss']
})
export class ProviderClaimsComponent implements OnInit {
  claims: ProviderClaim[] = [];
  filteredClaims: ProviderClaim[] = [];
  selectedClaim: ProviderClaim | null = null;

  searchTerm = '';
  estadoSeleccionado: ClaimStatus | '' = '';
  resolucion = '';
  accionSolicitud = 'MANTENER';
  guardando = false;
  cargando = false;
  errorMessage = '';

  constructor(private claimsService: ProviderClaimsService) {}

  ngOnInit(): void {
    this.recargarReclamos();
  }

  recargarReclamos(): void {
    this.cargando = true;
    this.claimsService.listarReclamos().subscribe({
      next: (data) => {
        const prioridad: Record<string, number> = {
          ABIERTO: 1,
          EN_REVISION: 2,
          RESUELTO: 3,
          RECHAZADO: 4
        };

        this.claims = (data || []).sort((a, b) => {
          const estadoA = prioridad[this.normalizar(a.estado)] || 99;
          const estadoB = prioridad[this.normalizar(b.estado)] || 99;

          if (estadoA !== estadoB) {
            return estadoA - estadoB;
          }

          return new Date(b.fechaCreacion || '').getTime() - new Date(a.fechaCreacion || '').getTime();
        });

        this.filtrarReclamos();
        const currentId = this.selectedClaim?.idReclamo;
        this.selectedClaim = this.filteredClaims.find(item => item.idReclamo === currentId) || this.filteredClaims[0] || null;
        this.resetForm();
        this.cargando = false;
        this.notifyProviderCountsRefresh();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los reclamos.';
        this.cargando = false;
      }
    });
  }

  filtrarReclamos(): void {
    const text = this.searchTerm.trim().toLowerCase();

    if (!text) {
      this.filteredClaims = [...this.claims];
      return;
    }

    this.filteredClaims = this.claims.filter(claim => [
      this.getClaimCode(claim),
      claim.idSolicitud?.toString(),
      claim.nombreEmpresa,
      claim.nombreCliente,
      claim.tipo,
      claim.estado,
      claim.descripcion
    ].some(value => (value || '').toString().toLowerCase().includes(text)));
  }

  seleccionarReclamo(claim: ProviderClaim): void {
    this.selectedClaim = claim;
    this.resetForm();
  }

  actualizarEstado(): void {
    if (!this.selectedClaim || this.guardando) {
      return;
    }

    this.errorMessage = '';

    if (!this.estadoSeleccionado) {
      this.errorMessage = 'Debes seleccionar un estado.';
      return;
    }

    if ((this.estadoSeleccionado === 'RESUELTO' || this.estadoSeleccionado === 'RECHAZADO') && !this.resolucion.trim()) {
      this.errorMessage = 'Ingresa la resolucion antes de cerrar el reclamo.';
      return;
    }

    if ((this.estadoSeleccionado === 'RESUELTO' || this.estadoSeleccionado === 'RECHAZADO')) {
      const accionesDisponibles = this.getAccionesDisponibles();
      const accionValida = accionesDisponibles.some(accion => accion.value === this.accionSolicitud);

      if (!accionValida) {
        this.errorMessage = 'Selecciona la acción que tomará la solicitud al cerrar el reclamo.';
        return;
      }
    }

    this.guardando = true;
    this.claimsService.actualizarEstado(this.selectedClaim.idReclamo, {
      estado: this.estadoSeleccionado,
      resolucion: this.resolucion.trim(),
      accion: this.accionSolicitud
    }).subscribe({
      next: (claim) => {
        this.claims = this.claims.map(item => item.idReclamo === claim.idReclamo ? claim : item);
        this.filtrarReclamos();
        this.selectedClaim = claim;
        this.resetForm();
        this.guardando = false;
        this.notifyProviderCountsRefresh();
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el reclamo.';
        this.guardando = false;
      }
    });
  }

  getEstadosDisponibles(): { value: ClaimStatus; label: string }[] {
    if (!this.selectedClaim) {
      return [];
    }

    switch (this.normalizar(this.selectedClaim.estado)) {
      case 'ABIERTO':
        return [{ value: 'EN_REVISION', label: 'En revision' }];
      case 'EN_REVISION':
        return [
          { value: 'RESUELTO', label: 'Resuelto' },
          { value: 'RECHAZADO', label: 'Rechazado' }
        ];
      default:
        return [];
    }
  }

  getAccionesDisponibles(): { value: string; label: string }[] {
    if (!this.selectedClaim) {
      return [];
    }

    switch (this.normalizar(this.selectedClaim.tipo)) {
      case 'CANCELACION':
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'PAGO_PENDIENTE', label: 'Pasar a PAGO PENDIENTE' },
          { value: 'PAGO_VALIDANDO', label: 'Pasar a PAGO VALIDANDO' },
          { value: 'CANCELAR', label: 'Cancelar la solicitud' }
        ];
      case 'ENTREGA_INCOMPLETA':
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'EN_PREPARACION', label: 'Pasar a EN PREPARACION' }
        ];
      default:
        return [
          { value: 'MANTENER', label: 'Mantener el estado actual' },
          { value: 'EN_PREPARACION', label: 'Pasar a EN PREPARACION' }
        ];
    }
  }

  onEstadoSeleccionadoCambio(): void {
    const accionesDisponibles = this.getAccionesDisponibles();
    const tieneAccionValida = accionesDisponibles.some(accion => accion.value === this.accionSolicitud);

    if (!tieneAccionValida) {
      this.accionSolicitud = 'MANTENER';
    }
  }

  getClaimCode(claim: ProviderClaim | null | undefined): string {
    if (!claim) {
      return '';
    }

    const year = new Date(claim.fechaCreacion || new Date()).getFullYear();
    return `RC-${year}-${String(claim.idReclamo).padStart(4, '0')}`;
  }

  getOrderCode(claim: ProviderClaim | null | undefined): string {
    if (!claim?.idSolicitud) {
      return '';
    }

    const year = new Date(claim.fechaCreacion || new Date()).getFullYear();
    return `OR-${year}-${String(claim.idSolicitud).padStart(4, '0')}`;
  }

  getFecha(date?: string): string {
    return date ? new Date(date).toLocaleDateString('es-PE') : '';
  }

  getHora(date?: string): string {
    return date ? new Date(date).toLocaleTimeString('es-PE') : '';
  }

  getTipoLabel(tipo?: string): string {
    const labels: Record<string, string> = {
      NO_ENTREGA: 'No entrega',
      PRODUCTO_DANADO: 'Producto danado',
      PRODUCTO_INCORRECTO: 'Producto incorrecto',
      DEMORA: 'Demora',
      CANCELACION: 'Cancelación',
      ENTREGA_INCOMPLETA: 'Entrega incompleta'
    };

    return labels[this.normalizar(tipo)] || tipo || 'Reclamo';
  }

  getEstadoClass(estado?: string): string {
    return this.normalizar(estado).toLowerCase().replace('_', '-');
  }

  private normalizar(value?: string): string {
    return (value || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  }

  private resetForm(): void {
    this.estadoSeleccionado = '';
    this.resolucion = '';
    this.accionSolicitud = 'MANTENER';
    this.errorMessage = '';
  }

  private notifyProviderCountsRefresh(): void {
    window.dispatchEvent(new Event('providerCountsRefresh'));
  }
}
