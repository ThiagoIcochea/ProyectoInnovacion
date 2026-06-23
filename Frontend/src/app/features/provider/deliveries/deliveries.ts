import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DeliveriesService } from './deliveries.service';
import { DeliveryDetail } from './delivery-detail.model';
import { DeliveryRequest } from './delivery.model';
import { TrackingStep } from './tracking-step.model';
<<<<<<< Updated upstream
import { DeliveryDetail } from './delivery-detail.model';
=======
>>>>>>> Stashed changes

@Component({
  selector: 'app-provider-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class ProviderDeliveriesComponent implements OnInit {
  deliveries$: Observable<DeliveryRequest[]> = of([]);
  tracking$: Observable<TrackingStep[]> = of([]);
  details$: Observable<DeliveryDetail[]> = of([]);

  deliveries: DeliveryRequest[] = [];
  filteredDeliveries: DeliveryRequest[] = [];
  selectedRequest: DeliveryRequest | null = null;

tracking$: Observable<TrackingStep[]> = of([]);

details$: Observable<DeliveryDetail[]> = of([]);

  selectedRequest:
      DeliveryRequest | null = null;
  searchTerm = '';
  estadoSeleccionado = '';
  codigoEntrega = '';
  guardando = false;
  errorMessage = '';

  constructor(
    private deliveriesService: DeliveriesService
  ) {}

  ngOnInit(): void {
    this.recargarSolicitudes();
  }

  recargarSolicitudes(): void {
    this.deliveries$ =
      this.deliveriesService
        .listarSolicitudesEntrega()
        .pipe(
          tap((data) => {
            this.deliveries = data || [];
            this.filtrarEntregas();

            if (this.filteredDeliveries.length > 0) {
              const currentId = this.selectedRequest?.idSolicitud;
              this.seleccionarSolicitud(
                this.filteredDeliveries.find(item => item.idSolicitud === currentId) ||
                this.filteredDeliveries[0]
              );
            } else {
              this.selectedRequest = null;
              this.tracking$ = of([]);
              this.details$ = of([]);
            }
<<<<<<< Updated upstream


            


            //this.selectedRequest =
            //  data.length > 0
             //   ? data[0]
             //   : null;

=======
>>>>>>> Stashed changes
          })
        );
  }

  filtrarEntregas(): void {
    const text = this.searchTerm.trim().toLowerCase();

<<<<<<< Updated upstream
  seleccionarSolicitud(
      solicitud: DeliveryRequest
  ): void {

    this.selectedRequest = solicitud;

    this.cargarTracking(
        solicitud.idSolicitud
    );


// detalles

    this.cargarDetalles(
        solicitud.idSolicitud
    );





  }



cargarTracking(
      idSolicitud: number
  ): void {

    this.tracking$ =

      this.deliveriesService
        .listarTrackingSolicitud(
            idSolicitud
        );

  }




cargarDetalles(
      idSolicitud: number
  ): void {

    this.details$ =

      this.deliveriesService
        .listarDetallesEntrega(
            idSolicitud
        );

  }















}















=======
    if (!text) {
      this.filteredDeliveries = [...this.deliveries];
      return;
    }

    this.filteredDeliveries = this.deliveries.filter(order => [
      this.getOrCode(order),
      order.nombreEmpresa,
      order.nombreCliente,
      order.estado,
      order.idSolicitud?.toString(),
      order.direccionEnvio
    ].some(value => (value || '').toLowerCase().includes(text)));
  }

  seleccionarSolicitud(solicitud: DeliveryRequest): void {
    this.selectedRequest = solicitud;
    this.estadoSeleccionado = '';
    this.codigoEntrega = '';
    this.cargarTracking(solicitud.idSolicitud);
    this.cargarDetalles(solicitud.idSolicitud);
  }

  cargarTracking(idSolicitud: number): void {
    this.tracking$ = this.deliveriesService.listarTrackingSolicitud(idSolicitud);
  }

  cargarDetalles(idSolicitud: number): void {
    this.details$ = this.deliveriesService.listarDetallesEntrega(idSolicitud);
  }

  actualizarTracking(): void {
    if (this.guardando || !this.selectedRequest) {
      return;
    }

    this.errorMessage = '';

    if (!this.estadoSeleccionado) {
      this.errorMessage = 'Debes seleccionar un estado.';
      return;
    }

    if (this.estadoSeleccionado === 'ENTREGADA' && !this.codigoEntrega.trim()) {
      this.errorMessage = 'Debes ingresar el codigo de entrega.';
      return;
    }

    this.guardando = true;

    this.deliveriesService
      .actualizarEstado(
        this.selectedRequest.idSolicitud,
        this.estadoSeleccionado,
        this.codigoEntrega.trim()
      )
      .subscribe({
        next: () => {
          const idSolicitud = this.selectedRequest?.idSolicitud;

          this.estadoSeleccionado = '';
          this.codigoEntrega = '';
          this.guardando = false;

          if (idSolicitud) {
            this.cargarTracking(idSolicitud);
            this.cargarDetalles(idSolicitud);
          }

          this.recargarSolicitudes();
          this.notifyProviderCountsRefresh();
        },
        error: () => {
          this.errorMessage = 'Error al actualizar estado.';
          this.guardando = false;
        }
      });
  }

  getEstadosDisponibles(): { value: string; label: string }[] {
    if (!this.selectedRequest) {
      return [];
    }

    switch (this.selectedRequest.estado) {
      case 'PAGADA':
        return [{ value: 'EN_PREPARACION', label: 'En preparacion' }];
      case 'EN_PREPARACION':
        return [{ value: 'EN_CAMINO', label: 'En camino' }];
      case 'EN_CAMINO':
        return [{ value: 'ENTREGADA', label: 'Entregado' }];
      default:
        return [];
    }
  }

  getFecha(date?: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleDateString('es-PE');
  }

  getHora(date?: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toLocaleTimeString('es-PE');
  }

  getOrCode(deliverie: any): string {
    if (!deliverie) {
      return '';
    }

    const fecha = deliverie.fechaCreacion || deliverie.fechaPago || new Date();
    const year = new Date(fecha).getFullYear();
    const id = String(deliverie.idSolicitud).padStart(4, '0');

    return `OR-${year}-${id}`;
  }

  private notifyProviderCountsRefresh(): void {
    window.dispatchEvent(new Event('providerCountsRefresh'));
  }
}
>>>>>>> Stashed changes
