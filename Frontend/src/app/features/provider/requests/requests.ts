import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProviderRequestsService } from './provider-requests.service';

@Component({
  selector: 'app-provider-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.scss']
})
export class ProviderRequestsComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  searchTerm = '';
  loading = true;
  errorMessage = '';

  selectedRequest: any | null = null;
  productos: any[] = [];

  constructor(
    private requestService: ProviderRequestsService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.requestService.listarSolicitudes()
      .subscribe({
        next: (data) => {
          this.requests = data || [];
          this.filterRequests();

          if (this.filteredRequests.length > 0) {
            const currentId = this.selectedRequest?.idSolicitud;
            this.selectRequest(
              this.filteredRequests.find(request => request.idSolicitud === currentId) ||
              this.filteredRequests[0]
            );
          } else {
            this.selectRequest(null);
          }

          this.loading = false;
          this.notifyProviderCountsRefresh();
        },
        error: () => {
          this.requests = [];
          this.filteredRequests = [];
          this.selectRequest(null);
          this.errorMessage = 'No se pudieron cargar las solicitudes.';
          this.loading = false;
          this.notifyProviderCountsRefresh();
        }
      });
  }

  filterRequests(): void {
    const text = this.searchTerm.trim().toLowerCase();

    if (!text) {
      this.filteredRequests = [...this.requests];
      return;
    }

    this.filteredRequests = this.requests.filter(request => [
      this.getRfQCode(request),
      request?.nombreEmpresa,
      request?.nombreCliente,
      request?.correoCliente,
      request?.estado,
      request?.idSolicitud?.toString()
    ].some(value => (value || '').toLowerCase().includes(text)));
  }

  selectRequest(request: any | null): void {
    this.selectedRequest = request;
    this.productos = request?.detalles ?? [];
  }

  getRfQCode(request: any): string {
    if (!request) {
      return '';
    }

    const year = new Date(request.fechaCreacion || new Date()).getFullYear();
    const id = String(request.idSolicitud).padStart(4, '0');

    return `RFQ-${year}-${id}`;
  }

  getFecha(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString('es-PE');
  }

  getHora(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString('es-PE');
  }

  getFechaCompleta(date?: string): string {
    if (!date) {
      return '';
    }

    const fecha = new Date(date);
    const fechaTexto = fecha.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long'
    });
    const horaTexto = fecha.toLocaleTimeString('es-PE', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `Recibida el ${fechaTexto} a las ${horaTexto}`;
  }

  aprobarPedido(): void {
    if (!this.selectedRequest) {
      return;
    }

    this.requestService
      .aprobarPedido(this.selectedRequest.idSolicitud)
      .subscribe({
        next: () => this.loadRequests(),
        error: () => {
          this.errorMessage = 'Error al aprobar pedido.';
        }
      });
  }

  rechazarPedido(): void {
    if (!this.selectedRequest) {
      return;
    }

    const motivo = prompt('Ingrese el motivo por el cual rechaza la orden.');

    if (!motivo?.trim()) {
      return;
    }

    this.requestService
      .rechazarPedido(this.selectedRequest.idSolicitud, motivo.trim())
      .subscribe({
        next: () => this.loadRequests(),
        error: () => {
          this.errorMessage = 'Error al rechazar pedido.';
        }
      });
  }

  private notifyProviderCountsRefresh(): void {
    window.dispatchEvent(new Event('providerCountsRefresh'));
  }
}
